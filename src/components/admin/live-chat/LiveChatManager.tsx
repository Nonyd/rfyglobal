'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, MessageCircle, Send, X, Trash2 } from 'lucide-react'
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { LiveIndicator } from '@/components/admin/shared/LiveIndicator'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'
import toast from 'react-hot-toast'

interface LiveMsg {
  id: string
  body: string
  fromAdmin: boolean
  isRead: boolean
  createdAt: string
}

interface LiveSessionRow {
  id: string
  name: string
  email: string
  sessionToken: string
  status: string
  isOnline: boolean
  lastSeenAt: string
  createdAt: string
  updatedAt: string
  messages: LiveMsg[]
  _count: { messages: number }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function visitorLikelyOnline(s: { isOnline: boolean; lastSeenAt: string }): boolean {
  const ms = Date.now() - new Date(s.lastSeenAt).getTime()
  return s.isOnline && ms < 5 * 60 * 1000
}

function groupByDate(messages: LiveMsg[]) {
  const groups: { label: string; messages: LiveMsg[] }[] = []
  let current = ''
  messages.forEach((msg) => {
    const d = new Date(msg.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    if (label !== current) {
      current = label
      groups.push({ label, messages: [msg] })
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  })
  return groups
}

export function LiveChatManager() {
  const [sessions, setSessions] = useState<LiveSessionRow[]>([])
  const [active, setActive] = useState<(LiveSessionRow & { messages: LiveMsg[] }) | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingSession, setLoadingSession] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filtered = sessions.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  )

  const bulk = useBulkSelect(filtered)

  const loadSessions = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/live-chat')
      if (res.ok) setSessions(await res.json())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages?.length])

  const loadSession = useCallback(async (id: string) => {
    setLoadingSession(true)
    try {
      const res = await adminFetch(`/api/admin/live-chat/${id}/messages`)
      if (res.ok) {
        const data = (await res.json()) as LiveSessionRow & { messages: LiveMsg[] }
        setActive(data)
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, _count: { messages: 0 } } : s)),
        )
      }
    } finally {
      setLoadingSession(false)
    }
  }, [])

  useAdminSSE({
    events: ['new_chat', 'new_chat_message'],
    onEvent: useCallback(async () => {
      await loadSessions()
      if (active) await loadSession(active.id)
      toast('💬 New live chat message', {
        style: {
          background: 'var(--a-surface)',
          color: 'var(--a-text)',
          border: '1px solid rgba(201,168,76,0.3)',
        },
        duration: 3000,
      })
    }, [loadSessions, active, loadSession]),
  })

  const removeSession = async (id: string) => {
    if (!confirm('Delete this conversation and all messages permanently?')) return
    try {
      const res = await adminFetch(`/api/admin/live-chat/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const msg = res.status === 403 ? 'You do not have permission to delete' : 'Could not delete'
        toast.error(msg)
        return
      }
      toast.success('Conversation deleted')
      if (active?.id === id) setActive(null)
      bulk.reset()
      await loadSessions()
    } catch {
      toast.error('Could not delete')
    }
  }

  const bulkDeleteSessions = async () => {
    if (!bulk.selectedCount) return
    if (!confirm(`Delete ${bulk.selectedCount} conversation${bulk.selectedCount > 1 ? 's' : ''}?`)) return
    let failed = 0
    await Promise.all(
      bulk.selectedArray.map(async (id) => {
        const res = await adminFetch(`/api/admin/live-chat/${id}`, { method: 'DELETE' })
        if (!res.ok) failed++
      }),
    )
    if (failed > 0) toast.error(`${failed} could not be deleted`)
    else toast.success(`${bulk.selectedCount} deleted`)
    if (active && bulk.selectedArray.includes(active.id)) setActive(null)
    bulk.reset()
    await loadSessions()
  }

  const sendReply = async () => {
    if (!active || !replyBody.trim() || sending) return
    setSending(true)
    try {
      const res = await adminFetch(`/api/admin/live-chat/${active.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      if (res.ok) {
        setReplyBody('')
        await loadSession(active.id)
      } else {
        toast.error('Failed to send reply')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const groups = active ? groupByDate(active.messages) : []

  return (
    <div
      className="flex overflow-hidden border"
      style={{
        borderColor: 'var(--a-border)',
        height: 'calc(100vh - 80px)',
        background: 'var(--a-bg)',
      }}
    >
      <div
        className="flex w-72 shrink-0 flex-col border-r xl:w-80"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        <div className="border-b px-4 pb-3 pt-4" style={{ borderColor: 'var(--a-border)' }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex-1 font-display text-base font-semibold" style={{ color: 'var(--a-text)' }}>
              Live Chat
            </span>
            <LiveIndicator />
          </div>

          <div className="relative mb-3">
            <Search
              size={12}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--a-text-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full border py-2 pl-8 pr-3 font-body text-xs outline-none"
              style={{
                background: 'var(--a-bg)',
                borderColor: 'var(--a-border)',
                color: 'var(--a-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <MessageCircle size={20} style={{ color: 'var(--a-text-muted)', opacity: 0.3 }} />
              <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                No conversations
              </p>
            </div>
          ) : (
            filtered.map((session) => {
              const isSel = active?.id === session.id
              const hasUnread = session._count.messages > 0
              const preview = session.messages[0]
              const online = visitorLikelyOnline(session)

              return (
                <div
                  key={session.id}
                  className="group relative border-b transition-colors"
                  style={{
                    borderColor: 'var(--a-border)',
                    background: isSel ? 'var(--a-gold-light)' : 'transparent',
                    borderLeft: `3px solid ${isSel ? 'var(--a-gold)' : 'transparent'}`,
                  }}
                >
                  <div className="absolute left-3 top-3 z-10">
                    <SelectCheckbox checked={bulk.isSelected(session.id)} onChange={() => bulk.toggle(session.id)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadSession(session.id)}
                    className="w-full px-4 py-3 pl-10 text-left"
                  >
                  <div className="flex items-start gap-2.5">
                    <div className="relative mt-0.5 shrink-0">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: 'var(--a-bg)', color: 'var(--a-gold)' }}
                      >
                        {session.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
                        style={{
                          borderColor: 'var(--a-surface)',
                          background: online ? '#22c55e' : '#6b7280',
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-start justify-between gap-1">
                        <p
                          className="truncate text-xs"
                          style={{
                            color: 'var(--a-text)',
                            fontFamily: 'var(--font-body)',
                            fontWeight: hasUnread ? 700 : 500,
                          }}
                        >
                          {session.name}
                        </p>
                        <span className="shrink-0 font-body text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
                          {timeAgo(session.updatedAt)}
                        </span>
                      </div>
                      <p
                        className="truncate font-body text-[11px]"
                        style={{
                          color: hasUnread ? 'var(--a-text)' : 'var(--a-text-muted)',
                          fontWeight: hasUnread ? 600 : 400,
                        }}
                      >
                        {session.email}
                      </p>
                      {preview && (
                        <p className="truncate font-body text-[11px]" style={{ color: 'var(--a-text-muted)' }}>
                          {preview.fromAdmin ? 'You: ' : ''}
                          {preview.body}
                        </p>
                      )}
                    </div>

                    {hasUnread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--a-gold)' }} />
                    )}
                  </div>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 opacity-40">
            <MessageCircle size={36} style={{ color: 'var(--a-text-muted)' }} />
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Select a conversation
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex shrink-0 items-center gap-3 border-b px-6 py-4"
              style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
            >
              <div className="relative shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full font-bold"
                  style={{ background: 'var(--a-bg)', color: 'var(--a-gold)' }}
                >
                  {active.name.charAt(0).toUpperCase()}
                </div>
                <span
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2"
                  style={{
                    borderColor: 'var(--a-surface)',
                    background: visitorLikelyOnline(active) ? '#22c55e' : '#6b7280',
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
                  {active.name}
                </p>
                <p className="truncate font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                  {active.email}
                </p>
                <p className="mt-0.5 font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                  <span style={{ color: visitorLikelyOnline(active) ? '#22c55e' : 'var(--a-text-muted)' }}>
                    {visitorLikelyOnline(active) ? '● Online' : '● Offline'}
                  </span>
                </p>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => void removeSession(active.id)}
                  className="flex h-8 w-8 items-center justify-center"
                  style={{ color: 'var(--a-red)' }}
                  title="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="flex h-8 w-8 items-center justify-center"
                  style={{ color: 'var(--a-text-muted)' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {loadingSession ? (
                <div className="flex justify-center py-12">
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2"
                    style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
                  />
                </div>
              ) : groups.length === 0 ? (
                <p className="text-center font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                  No messages yet
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.label} className="mb-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-px flex-1" style={{ background: 'var(--a-border)' }} />
                      <span
                        className="shrink-0 px-2 font-body text-[10px] uppercase tracking-widest"
                        style={{ color: 'var(--a-text-muted)' }}
                      >
                        {group.label}
                      </span>
                      <div className="h-px flex-1" style={{ background: 'var(--a-border)' }} />
                    </div>

                    <div className="space-y-1">
                      {group.messages.map((msg, i) => {
                        const isAdmin = msg.fromAdmin
                        const next = group.messages[i + 1]
                        const isLast = !next || next.fromAdmin !== msg.fromAdmin

                        return (
                          <div key={msg.id}>
                            <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className="max-w-[68%] px-4 py-2.5"
                                style={{
                                  background: isAdmin ? '#C9A84C' : 'var(--a-surface)',
                                  color: isAdmin ? '#0F0F0F' : 'var(--a-text)',
                                  border: isAdmin ? 'none' : '1px solid var(--a-border)',
                                  borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  fontSize: '13px',
                                  lineHeight: '1.6',
                                  fontFamily: 'var(--font-body)',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {msg.body}
                              </div>
                            </div>
                            {isLast && (
                              <p
                                className={`mb-2 mt-1 font-body text-[10px] ${isAdmin ? 'text-right' : 'text-left'}`}
                                style={{ color: 'var(--a-text-muted)' }}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {isAdmin ? ' · Sent' : ''}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div
              className="shrink-0 border-t px-6 py-4"
              style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
            >
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void sendReply()
                  }}
                  placeholder="Reply…"
                  rows={3}
                  className="flex-1 resize-none border px-4 py-3 font-body text-sm outline-none"
                  style={{
                    background: 'var(--a-bg)',
                    borderColor: 'var(--a-border)',
                    color: 'var(--a-text)',
                    borderRadius: '12px',
                    lineHeight: '1.5',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
                />
                <button
                  type="button"
                  onClick={() => void sendReply()}
                  disabled={sending || !replyBody.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center transition-all disabled:opacity-40"
                  style={{ background: 'var(--a-gold)', color: '#0F0F0F', borderRadius: '50%' }}
                  title="Send (Cmd+Enter)"
                >
                  {sending ? (
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2"
                      style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#0F0F0F' }}
                    />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
              <p className="mt-2 font-body text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
                ⌘ or Ctrl+Enter to send · Reply appears in the visitor&apos;s chat widget
              </p>
            </div>
          </>
        )}
      </div>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={filtered.length}
        actions={[
          {
            label: 'Delete',
            icon: <Trash2 size={12} />,
            onClick: () => void bulkDeleteSessions(),
            variant: 'danger',
          },
        ]}
      />
    </div>
  )
}
