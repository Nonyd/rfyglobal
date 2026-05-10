'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import type { PrayerRequest, PrayerRequestStatus } from '@prisma/client'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { LiveIndicator } from '@/components/admin/shared/LiveIndicator'

type Tab = 'PENDING' | 'PRAYED' | 'REPLIED'

export function PrayerManager() {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [requests, setRequests] = useState<PrayerRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyId, setReplyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)
  const bulk = useBulkSelect(requests)

  const load = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/prayer?status=${tab}&page=${page}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setRequests(data.requests ?? [])
      setTotal(data.total ?? 0)
      return true
    } catch {
      toast.error('Could not load prayer requests')
      return false
    } finally {
      setLoading(false)
    }
  }, [tab, page])

  useEffect(() => {
    load()
  }, [load])

  const onPrayerSSE = useCallback(() => {
    void load().then((ok) => {
      if (!ok) return
      toast('New prayer request', {
        icon: '🙏',
        style: {
          background: 'var(--a-surface)',
          color: 'var(--a-text)',
          border: '1px solid rgba(201,168,76,0.3)',
        },
        duration: 3000,
      })
    })
  }, [load])

  useAdminSSE({
    events: ['new_prayer'],
    onEvent: onPrayerSSE,
  })

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/prayer/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = (await res.json().catch(() => null)) as { error?: string } | null
    if (!res.ok) {
      const msg =
        payload && typeof payload.error === 'string' && payload.error.trim()
          ? payload.error
          : res.status === 403
            ? 'You do not have permission to update prayer requests'
            : 'Update failed'
      toast.error(msg)
      return
    }
    toast.success('Updated')
    load()
  }

  const markPrayed = (id: string) => patch(id, { status: 'PRAYED' as PrayerRequestStatus })

  const sendReply = async (id: string) => {
    if (!replyText.trim()) {
      toast.error('Enter a message')
      return
    }
    setReplySending(true)
    try {
      const res = await fetch(`/api/admin/prayer/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendReply: true,
          replyMessage: replyText.trim(),
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        const msg =
          data && typeof data.error === 'string' && data.error.trim()
            ? data.error
            : res.status === 403
              ? 'You do not have permission to send replies'
              : 'Could not send reply'
        toast.error(msg)
        return
      }
      toast.success('Reply sent')
      setReplyId(null)
      setReplyText('')
      load()
    } finally {
      setReplySending(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this prayer request permanently?')) return
    const res = await fetch(`/api/admin/prayer/${id}`, { method: 'DELETE' })
    const payload = (await res.json().catch(() => null)) as { error?: string } | null
    if (!res.ok) {
      const msg =
        payload && typeof payload.error === 'string' && payload.error.trim()
          ? payload.error
          : res.status === 403
            ? 'You do not have permission to delete prayer requests'
            : 'Delete failed'
      toast.error(msg)
      return
    }
    toast.success('Deleted')
    load()
  }

  const bulkDelete = async () => {
    if (!bulk.selectedCount) return
    if (!confirm(`Delete ${bulk.selectedCount} prayer request${bulk.selectedCount > 1 ? 's' : ''}?`)) return
    await Promise.all(bulk.selectedArray.map((id) => fetch(`/api/admin/prayer/${id}`, { method: 'DELETE' })))
    toast.success(`${bulk.selectedCount} requests deleted`)
    bulk.reset()
    await load()
  }

  const bulkMarkPrayed = async () => {
    if (!bulk.selectedCount) return
    await Promise.all(
      bulk.selectedArray.map((id) =>
        fetch(`/api/admin/prayer/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PRAYED' }),
        }),
      ),
    )
    toast.success(`${bulk.selectedCount} requests marked as prayed`)
    bulk.reset()
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Prayer requests
        </h1>
        <LiveIndicator />
      </div>
      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'PRAYED', 'REPLIED'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t)
              setPage(1)
            }}
            className="rounded border px-4 py-2 font-body text-xs uppercase tracking-widest transition-colors"
            style={{
              borderColor: tab === t ? 'var(--a-gold-border)' : 'var(--a-border)',
              background: tab === t ? 'var(--a-gold-active)' : 'transparent',
              color: tab === t ? 'var(--a-gold)' : 'var(--a-text-secondary)',
            }}
          >
            {t === 'PENDING' ? 'Pending' : t === 'PRAYED' ? 'Prayed' : 'Replied'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          Loading…
        </p>
      ) : requests.length === 0 ? (
        <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          No requests in this tab.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="group relative border p-4 pl-10"
              style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
            >
              <div className="absolute left-3 top-3">
                <SelectCheckbox checked={bulk.isSelected(r.id)} onChange={() => bulk.toggle(r.id)} />
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold" style={{ color: 'var(--a-text)' }}>
                    {r.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
                    {r.body}
                  </p>
                  <p className="mt-2 font-body text-sm font-medium" style={{ color: 'var(--a-text-secondary)' }}>
                    {r.isAnonymous ? 'Anonymous' : (r.name ?? 'Community Member')}
                  </p>
                  {!r.isAnonymous ? (
                    <p className="mt-1 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                      {r.email} · {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  ) : (
                    <p className="mt-1 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                      Anonymous · {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="rounded border px-3 py-1.5 font-body text-xs"
                    style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
                  >
                    {expanded === r.id ? 'Collapse' : 'Expand'}
                  </button>
                  {r.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => markPrayed(r.id)}
                      className="rounded border px-3 py-1.5 font-body text-xs"
                      style={{
                        borderColor: 'var(--a-gold-border)',
                        color: 'var(--a-gold)',
                      }}
                    >
                      Mark as prayed
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setReplyId(replyId === r.id ? null : r.id)
                      setReplyText('')
                    }}
                    className="rounded border px-3 py-1.5 font-body text-xs"
                    style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
                  >
                    Reply by email
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="rounded border px-3 py-1.5 font-body text-xs"
                    style={{ borderColor: 'var(--a-border)', color: 'var(--a-red)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 overflow-hidden border-t pt-4 font-body text-sm leading-relaxed"
                    style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
                  >
                    <p className="whitespace-pre-wrap">{r.body}</p>
                    {r.adminNote && (
                      <p className="mt-3 text-xs" style={{ color: 'var(--a-text-muted)' }}>
                        Admin note: {r.adminNote}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {replyId === r.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 border p-4"
                    style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}
                  >
                    {r.isAnonymous && (
                      <div
                        className="mb-4 flex items-start gap-2 border p-3"
                        style={{
                          borderColor: 'rgba(201,168,76,0.3)',
                          background: 'rgba(201,168,76,0.05)',
                        }}
                      >
                        <span className="shrink-0 text-sm text-gold">🔒</span>
                        <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
                          This request was submitted anonymously. Your reply will be sent to their email, but their
                          address is kept private from the admin view.
                        </p>
                      </div>
                    )}
                    <label className="mb-2 block font-body text-xs uppercase tracking-wider text-mist">
                      Email reply
                    </label>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={5}
                      className="w-full resize-none border p-3 font-body text-sm"
                      style={{
                        borderColor: 'var(--a-border)',
                        background: 'var(--a-bg)',
                        color: 'var(--a-text)',
                      }}
                      placeholder="Your message to the requester…"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={replySending}
                        onClick={() => sendReply(r.id)}
                        className="rounded px-4 py-2 font-body text-xs font-semibold uppercase tracking-widest disabled:opacity-50"
                        style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
                      >
                        {replySending ? 'Sending…' : 'Send reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyId(null)
                          setReplyText('')
                        }}
                        className="rounded border px-4 py-2 font-body text-xs"
                        style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border px-3 py-1.5 font-body text-xs disabled:opacity-40"
            style={{ borderColor: 'var(--a-border)' }}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1.5 font-body text-xs disabled:opacity-40"
            style={{ borderColor: 'var(--a-border)' }}
          >
            Next
          </button>
        </div>
      )}

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={requests.length}
        actions={[
          {
            label: 'Mark Prayed',
            icon: <span>🙏</span>,
            onClick: () => void bulkMarkPrayed(),
            variant: 'primary',
          },
          {
            label: 'Delete',
            icon: <Trash2 size={12} />,
            onClick: () => void bulkDelete(),
            variant: 'danger',
          },
        ]}
      />
    </div>
  )
}
