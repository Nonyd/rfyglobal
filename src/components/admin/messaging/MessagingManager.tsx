'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { AdminToggle } from '@/components/shared/Toggle'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'

type MessageRow = {
  id: string
  fromAdmin: boolean
  body: string
  sentAt: string
}

type ThreadRow = {
  id: string
  recipientEmail: string
  recipientName: string | null
  subject: string | null
  lastMessage: string | null
  lastAt: string
  isRead: boolean
  messages: MessageRow[]
  _count: { messages: number }
}

type CommunityMemberRow = { id: string; name: string; email: string; city: string | null; state: string | null }

type FormRow = { id: string; title: string; slug: string }

type FormSubmissionRow = {
  id: string
  values: { fieldLabel: string; value: string }[]
}

function extractEmailFromValues(values: { fieldLabel: string; value: string }[]): string | null {
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/
  for (const v of values) {
    const m = v.value.match(emailRegex)
    if (m) return m[0].trim().toLowerCase()
  }
  const labelHit = values.find((v) => /email/i.test(v.fieldLabel) && v.value.includes('@'))
  return labelHit?.value.trim().toLowerCase() ?? null
}

function initials(name: string | null | undefined, email: string) {
  const n = (name || email).trim()
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2)
  return n.slice(0, 2).toUpperCase()
}

export function MessagingManager() {
  const [threads, setThreads] = useState<ThreadRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [threadDetail, setThreadDetail] = useState<ThreadRow | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [compose, setCompose] = useState('')
  const [sendEmailNow, setSendEmailNow] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'single' | 'bulk' | 'form'>('single')
  const [toEmail, setToEmail] = useState('')
  const [toName, setToName] = useState('')
  const [modalSubject, setModalSubject] = useState('')
  const [modalBody, setModalBody] = useState('')
  const [modalSendEmail, setModalSendEmail] = useState(false)
  const [sendingModal, setSendingModal] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [memberHits, setMemberHits] = useState<CommunityMemberRow[]>([])
  const [forms, setForms] = useState<FormRow[]>([])
  const [formId, setFormId] = useState('')
  const [formSubs, setFormSubs] = useState<FormSubmissionRow[]>([])
  const [cityFilter, setCityFilter] = useState('')
  const [allMembers, setAllMembers] = useState<CommunityMemberRow[]>([])
  const bulk = useBulkSelect(threads)

  const loadThreads = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/admin/messages')
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      setThreads(data as ThreadRow[])
    } catch {
      toast.error('Could not load threads')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  const openThread = async (id: string) => {
    setSelectedId(id)
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/admin/messages/${id}`)
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      setThreadDetail(data as ThreadRow)
      loadThreads()
    } catch {
      toast.error('Could not open thread')
    } finally {
      setLoadingThread(false)
    }
  }

  const sendInThread = async () => {
    if (!selectedId || !compose.trim()) return
    const res = await fetch(`/api/admin/messages/${selectedId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: compose.trim(), sendEmailNow }),
    })
    if (!res.ok) {
      toast.error('Send failed')
      return
    }
    toast.success('Sent')
    setCompose('')
    setSendEmailNow(false)
    openThread(selectedId)
    loadThreads()
  }

  const openModal = async () => {
    setModalOpen(true)
    setModalTab('single')
    setToEmail('')
    setToName('')
    setModalSubject('')
    setModalBody('')
    setModalSendEmail(false)
    setMemberQuery('')
    setMemberHits([])
    setFormId('')
    setFormSubs([])
    setCityFilter('')
    try {
      const [fRes, mRes] = await Promise.all([fetch('/api/forms'), fetch('/api/join/members?limit=500&page=1')])
      if (fRes.ok) setForms(await fRes.json())
      if (mRes.ok) {
        const m = await mRes.json()
        setAllMembers(m.members ?? [])
      }
    } catch {
      /* ignore */
    }
  }

  const searchMembers = async (q: string) => {
    setMemberQuery(q)
    if (q.length < 2) {
      setMemberHits([])
      return
    }
    const res = await fetch(`/api/join/members?q=${encodeURIComponent(q)}&limit=20&page=1`)
    if (res.ok) {
      const data = await res.json()
      setMemberHits(data.members ?? [])
    }
  }

  const loadFormEntries = async (id: string) => {
    setFormId(id)
    const res = await fetch(`/api/forms/${id}/entries?limit=500&page=1`)
    if (!res.ok) {
      toast.error('Could not load form entries')
      return
    }
    const data = await res.json()
    setFormSubs(data.submissions ?? [])
  }

  const submitModal = async () => {
    if (!modalBody.trim()) {
      toast.error('Message is required')
      return
    }
    setSendingModal(true)
    try {
      if (modalTab === 'single') {
        if (!toEmail.trim()) {
          toast.error('Recipient email required')
          return
        }
        const res = await fetch('/api/admin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: toEmail.trim(),
            recipientName: toName.trim() || null,
            subject: modalSubject.trim() || null,
            message: modalBody.trim(),
            sendEmailNow: modalSendEmail,
          }),
        })
        if (!res.ok) {
          toast.error('Failed')
          return
        }
        toast.success('Message sent')
      } else if (modalTab === 'bulk') {
        const list = cityFilter.trim()
          ? allMembers.filter(
              (m) =>
                (m.city && m.city.toLowerCase().includes(cityFilter.toLowerCase())) ||
                (m.state && m.state.toLowerCase().includes(cityFilter.toLowerCase())),
            )
          : allMembers
        const recipients = list.map((m) => ({ email: m.email, name: m.name }))
        if (recipients.length === 0) {
          toast.error('No recipients')
          return
        }
        const res = await fetch('/api/admin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients,
            subject: modalSubject.trim() || null,
            message: modalBody.trim(),
            sendEmailNow: modalSendEmail,
          }),
        })
        if (!res.ok) {
          toast.error('Bulk send failed')
          return
        }
        toast.success(`Queued ${recipients.length} threads`)
      } else {
        if (!formId) {
          toast.error('Select a form')
          return
        }
        const emails = new Map<string, string | undefined>()
        for (const sub of formSubs) {
          const em = extractEmailFromValues(sub.values)
          if (em) emails.set(em, undefined)
        }
        const recipients = Array.from(emails.keys()).map((email) => ({ email }))
        if (recipients.length === 0) {
          toast.error('No emails found in submissions')
          return
        }
        const res = await fetch('/api/admin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients,
            subject: modalSubject.trim() || null,
            message: modalBody.trim(),
            sendEmailNow: modalSendEmail,
          }),
        })
        if (!res.ok) {
          toast.error('Send failed')
          return
        }
        toast.success(`Created ${recipients.length} threads`)
      }
      setModalOpen(false)
      loadThreads()
    } finally {
      setSendingModal(false)
    }
  }

  const bulkDelete = async () => {
    if (!bulk.selectedCount) return
    if (!confirm(`Delete ${bulk.selectedCount} thread${bulk.selectedCount > 1 ? 's' : ''}?`)) return
    await Promise.all(bulk.selectedArray.map((id) => fetch(`/api/admin/messages/${id}`, { method: 'DELETE' })))
    toast.success(`${bulk.selectedCount} threads deleted`)
    if (selectedId && bulk.selectedArray.includes(selectedId)) {
      setSelectedId(null)
      setThreadDetail(null)
    }
    bulk.reset()
    await loadThreads()
  }

  const bulkMarkRead = async () => {
    if (!bulk.selectedCount) return
    await Promise.all(bulk.selectedArray.map((id) => fetch(`/api/admin/messages/${id}/read`, { method: 'POST' })))
    toast.success(`${bulk.selectedCount} threads marked as read`)
    bulk.reset()
    await loadThreads()
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col gap-4 lg:flex-row">
      <div
        className="flex w-full flex-col border lg:w-[360px] lg:shrink-0"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        <div className="border-b p-3" style={{ borderColor: 'var(--a-border)' }}>
          <button
            type="button"
            onClick={openModal}
            className="w-full rounded py-2 font-body text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
          >
            + New message
          </button>
        </div>
        <div className="max-h-[55vh] flex-1 overflow-y-auto lg:max-h-none">
          {loadingList ? (
            <p className="p-4 font-body text-xs text-mist">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="p-4 font-body text-xs text-mist">No threads yet.</p>
          ) : (
            threads.map((t) => (
              <div
                key={t.id}
                className="flex w-full gap-3 border-b p-3 text-left transition-colors"
                style={{
                  borderColor: 'var(--a-border)',
                  borderLeftWidth: 3,
                  borderLeftStyle: 'solid',
                  borderLeftColor: !t.isRead ? 'var(--a-gold)' : 'transparent',
                  background: selectedId === t.id ? 'var(--a-gold-active)' : 'transparent',
                }}
              >
                <SelectCheckbox checked={bulk.isSelected(t.id)} onChange={() => bulk.toggle(t.id)} size="sm" />
                <button type="button" onClick={() => openThread(t.id)} className="flex min-w-0 flex-1 gap-3 text-left">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-body text-xs font-bold"
                  style={{ background: 'var(--a-gold-light)', color: 'var(--a-gold)' }}
                >
                  {initials(t.recipientName, t.recipientEmail)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
                    {t.recipientName || t.recipientEmail}
                  </p>
                  <p className="truncate font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                    {t.lastMessage || '—'}
                  </p>
                  <p className="mt-1 font-body text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
                    {format(new Date(t.lastAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="flex min-h-[400px] flex-1 flex-col border"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        {!selectedId || !threadDetail ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Select a conversation
            </p>
          </div>
        ) : (
          <>
            <div className="border-b p-4" style={{ borderColor: 'var(--a-border)' }}>
              <p className="font-display text-base font-semibold" style={{ color: 'var(--a-text)' }}>
                {threadDetail.recipientName || threadDetail.recipientEmail}
              </p>
              <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                {threadDetail.recipientEmail}
                {threadDetail.subject ? ` · ${threadDetail.subject}` : ''}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingThread ? (
                <p className="font-body text-xs text-mist">Loading…</p>
              ) : (
                threadDetail.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[85%] rounded px-3 py-2 font-body text-sm leading-relaxed"
                      style={
                        m.fromAdmin
                          ? { background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }
                          : {
                              background: 'var(--a-bg)',
                              color: 'var(--a-text-secondary)',
                              border: '1px solid var(--a-border)',
                            }
                      }
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p
                        className="mt-1 text-[10px] opacity-70"
                        style={{ color: m.fromAdmin ? 'var(--a-text-inverse)' : 'var(--a-text-muted)' }}
                      >
                        {format(new Date(m.sentAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t p-3" style={{ borderColor: 'var(--a-border)' }}>
              <textarea
                value={compose}
                onChange={(e) => setCompose(e.target.value)}
                rows={3}
                placeholder="Type a message…"
                className="mb-2 w-full resize-none border p-3 font-body text-sm"
                style={{
                  borderColor: 'var(--a-border)',
                  background: 'var(--a-bg)',
                  color: 'var(--a-text)',
                }}
              />
              <div className="mb-2">
                <AdminToggle
                  checked={sendEmailNow}
                  onChange={(v) => setSendEmailNow(v)}
                  label="Also send as email (Brevo)"
                  size="sm"
                />
              </div>
              <button
                type="button"
                onClick={sendInThread}
                disabled={!compose.trim()}
                className="rounded px-4 py-2 font-body text-xs font-semibold uppercase tracking-widest disabled:opacity-40"
                style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4" onClick={() => setModalOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto border p-6"
            style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--a-text)' }}>
              New message
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['single', 'bulk', 'form'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setModalTab(t)}
                  className="rounded border px-3 py-1 font-body text-[10px] uppercase tracking-wider"
                  style={{
                    borderColor: modalTab === t ? 'var(--a-gold-border)' : 'var(--a-border)',
                    color: modalTab === t ? 'var(--a-gold)' : 'var(--a-text-secondary)',
                  }}
                >
                  {t === 'single' ? 'One recipient' : t === 'bulk' ? 'All / city' : 'Form emails'}
                </button>
              ))}
            </div>

            {modalTab === 'single' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block font-body text-[10px] uppercase tracking-wider text-mist">To (email)</label>
                  <input
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full border p-2 font-body text-sm"
                    style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
                    placeholder="name@example.com"
                  />
                  <input
                    value={memberQuery}
                    onChange={(e) => searchMembers(e.target.value)}
                    className="mt-2 w-full border p-2 font-body text-xs"
                    style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
                    placeholder="Search members…"
                  />
                  {memberHits.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto border" style={{ borderColor: 'var(--a-border)' }}>
                      {memberHits.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="block w-full border-b px-2 py-1.5 text-left font-body text-xs last:border-0 hover:bg-black/20"
                          style={{ borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                          onClick={() => {
                            setToEmail(m.email)
                            setToName(m.name)
                            setMemberHits([])
                            setMemberQuery('')
                          }}
                        >
                          {m.name} · {m.email}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-body text-[10px] uppercase tracking-wider text-mist">Name (optional)</label>
                  <input
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    className="w-full border p-2 font-body text-sm"
                    style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
                  />
                </div>
              </div>
            )}

            {modalTab === 'bulk' && (
              <div className="mt-4 space-y-2">
                <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                  Sends one thread per member ({allMembers.length} loaded). Optional city filter matches city or state
                  field.
                </p>
                <input
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full border p-2 font-body text-sm"
                  style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
                  placeholder="City filter (optional)"
                />
              </div>
            )}

            {modalTab === 'form' && (
              <div className="mt-4 space-y-3">
                <label className="mb-1 block font-body text-[10px] uppercase tracking-wider text-mist">Form</label>
                <select
                  value={formId}
                  onChange={(e) => {
                    const id = e.target.value
                    if (id) loadFormEntries(id)
                    else {
                      setFormId('')
                      setFormSubs([])
                    }
                  }}
                  className="w-full border p-2 font-body text-sm"
                  style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
                >
                  <option value="">Select form…</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
                <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                  {formSubs.length} submission(s) loaded — unique emails will receive a thread.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <label className="mb-1 block font-body text-[10px] uppercase tracking-wider text-mist">Subject (optional)</label>
              <input
                value={modalSubject}
                onChange={(e) => setModalSubject(e.target.value)}
                className="w-full border p-2 font-body text-sm"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
              <label className="mb-1 block font-body text-[10px] uppercase tracking-wider text-mist">Message *</label>
              <textarea
                value={modalBody}
                onChange={(e) => setModalBody(e.target.value)}
                rows={5}
                className="w-full resize-none border p-2 font-body text-sm"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
              <AdminToggle
                checked={modalSendEmail}
                onChange={(v) => setModalSendEmail(v)}
                label="Send as email"
                size="sm"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={sendingModal}
                onClick={submitModal}
                className="rounded px-4 py-2 font-body text-xs font-semibold uppercase disabled:opacity-50"
                style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
              >
                {sendingModal ? 'Sending…' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded border px-4 py-2 font-body text-xs"
                style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={threads.length}
        actions={[
          { label: 'Mark Read', onClick: () => void bulkMarkRead(), variant: 'default' },
          { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => void bulkDelete(), variant: 'danger' },
        ]}
      />
    </div>
  )
}
