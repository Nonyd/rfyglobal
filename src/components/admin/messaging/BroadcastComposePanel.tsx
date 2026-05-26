'use client'

import { useState, useEffect } from 'react'
import { X, Send, Megaphone } from 'lucide-react'
import { adminFetch } from '@/lib/admin-fetch'
import toast from 'react-hot-toast'
import { BROADCAST_GROUP_LABELS } from '@/lib/broadcast-constants'

interface EmailTemplate {
  key: string
  name: string
  subject: string
  html: string
}

interface EventOption {
  id: string
  title: string
}

interface FormOption {
  id: string
  title: string
}

interface BroadcastComposePanelProps {
  open: boolean
  onClose: () => void
  onSent: () => void
}

export function BroadcastComposePanel({ open, onClose, onSent }: BroadcastComposePanelProps) {
  const [group, setGroup] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [templateKey, setTemplateKey] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientCount, setRecipientCount] = useState(0)
  const [loadingCount, setLoadingCount] = useState(false)
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [forms, setForms] = useState<FormOption[]>([])

  useEffect(() => {
    if (!open) return
    adminFetch('/api/admin/email-templates')
      .then(async (r) => {
        if (!r.ok) {
          console.error('[broadcast] email-templates fetch failed:', r.status)
          return []
        }
        const data: unknown = await r.json()
        if (!Array.isArray(data)) {
          console.error('[broadcast] email-templates response is not an array:', data)
          return []
        }
        return data.map((t: { key?: string; name?: string; subject?: string; html?: string }) => ({
          key: String(t.key ?? ''),
          name: String(t.name ?? t.key ?? 'Template'),
          subject: String(t.subject ?? ''),
          html: String(t.html ?? ''),
        })).filter((t) => t.key)
      })
      .then(setTemplates)
      .catch((err) => {
        console.error('[broadcast] email-templates fetch error:', err)
        setTemplates([])
      })
    adminFetch('/api/events')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: EventOption[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
    adminFetch('/api/forms')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: FormOption[]) => setForms(Array.isArray(data) ? data : []))
      .catch(() => setForms([]))
  }, [open])

  useEffect(() => {
    if (!templateKey) return
    adminFetch(`/api/admin/email-templates/${templateKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: EmailTemplate | null) => {
        if (!data) return
        if (data.subject) setSubject(data.subject)
        if (data.html) {
          const text = data.html.replace(/<[^>]+>/g, '').trim()
          setBody(text)
        }
      })
      .catch(() => {})
  }, [templateKey])

  useEffect(() => {
    if (!group) {
      setRecipientCount(0)
      return
    }
    if ((group === 'event_registrants' || group === 'form_submitters') && !groupFilter) {
      setRecipientCount(0)
      return
    }

    setLoadingCount(true)
    const params = new URLSearchParams({ group })
    if (groupFilter) params.set('groupFilter', groupFilter)

    adminFetch(`/api/admin/broadcast/recipients?${params}`)
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((data: { count?: number }) => setRecipientCount(data.count ?? 0))
      .catch(() => setRecipientCount(0))
      .finally(() => setLoadingCount(false))
  }, [group, groupFilter])

  const handleSend = async () => {
    if (!group || !subject.trim() || !body.trim()) {
      toast.error('Select recipients, subject, and message body')
      return
    }
    if ((group === 'event_registrants' || group === 'form_submitters') && !groupFilter) {
      toast.error('Select a specific event or form')
      return
    }
    if (recipientCount === 0) {
      toast.error('No recipients found for this group')
      return
    }
    if (!confirm(`Send this message to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}?`)) {
      return
    }

    setSending(true)
    try {
      const res = await adminFetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          replyTo: replyTo.trim() || undefined,
          group,
          groupFilter: groupFilter || undefined,
          templateKey: templateKey || undefined,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        sent?: number
        failed?: number
      }
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to send broadcast')
        return
      }
      toast.success(
        `Message sent to ${data.sent ?? 0} recipients${(data.failed ?? 0) > 0 ? ` (${data.failed} failed)` : ''}`,
      )
      setGroup('')
      setGroupFilter('')
      setTemplateKey('')
      setReplyTo('')
      setSubject('')
      setBody('')
      onSent()
      onClose()
    } catch {
      toast.error('Network error')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  const inputClass =
    'w-full border px-3 py-2 font-body text-sm outline-none'
  const inputStyle = {
    background: 'var(--a-bg)',
    borderColor: 'var(--a-border)',
    color: 'var(--a-text)',
  }
  const labelClass = 'mb-1 block font-body text-[10px] uppercase tracking-widest'
  const labelStyle = { color: 'var(--a-text-muted)' }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close compose panel"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l shadow-2xl"
        style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--a-border)' }}
        >
          <div className="flex items-center gap-2">
            <Megaphone size={16} style={{ color: 'var(--a-gold)' }} />
            <h2 className="font-display text-base font-semibold" style={{ color: 'var(--a-text)' }}>
              New Broadcast
            </h2>
          </div>
          <button type="button" onClick={onClose} style={{ color: 'var(--a-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className={labelClass} style={labelStyle}>
              To
            </label>
            <select
              value={group}
              onChange={(e) => {
                setGroup(e.target.value)
                setGroupFilter('')
              }}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Select recipients…</option>
              <option value="all_members">All Community Members</option>
              <option value="event_registrants">Event Registrants</option>
              <option value="prayer_requesters">Prayer Requesters</option>
              <option value="testimony_submitters">Testimony Submitters</option>
              <option value="form_submitters">Form Submitters (specific form)</option>
            </select>
          </div>

          {group === 'event_registrants' && (
            <div>
              <label className={labelClass} style={labelStyle}>
                Event
              </label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">Select event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {group === 'form_submitters' && (
            <div>
              <label className={labelClass} style={labelStyle}>
                Form
              </label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">Select form…</option>
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {group && (
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
              Sending to:{' '}
              <strong style={{ color: 'var(--a-gold)' }}>
                {loadingCount ? '…' : recipientCount} recipient{recipientCount === 1 ? '' : 's'}
              </strong>
            </p>
          )}

          <div>
            <label className={labelClass} style={labelStyle}>
              Template (optional)
            </label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              <option value="">Write new message (no template)</option>
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Reply-To (optional)
            </label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="hello@rfyglobal.org"
              className={inputClass}
              style={inputStyle}
            />
            <p className="mt-1 font-body text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
              Recipients who reply will reach this email address.
            </p>
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject…"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Write your message here…

Use {{first_name}} for the recipient's first name.
Use {{name}} for their full name.`}
              rows={12}
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
            <p className="mt-1 font-body text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
              Merge tags: {'{{first_name}}'}, {'{{name}}'}, {'{{email}}'}
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t px-5 py-4" style={{ borderColor: 'var(--a-border)' }}>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !group || recipientCount === 0}
            className="flex w-full items-center justify-center gap-2 py-3 font-body text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-40"
            style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
          >
            {sending ? (
              'Sending…'
            ) : (
              <>
                <Send size={13} />
                Send to {loadingCount ? '…' : recipientCount} recipients
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

interface BroadcastHistoryProps {
  broadcasts: BroadcastRow[]
  loading: boolean
}

export interface BroadcastRow {
  id: string
  subject: string
  group: string
  recipientCount: number
  sentAt: string | null
  status: string
  createdAt: string
}

export function BroadcastHistory({ broadcasts, loading }: BroadcastHistoryProps) {
  if (loading) {
    return (
      <p className="px-4 py-3 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
        Loading broadcasts…
      </p>
    )
  }

  if (broadcasts.length === 0) {
    return (
      <p className="px-4 py-3 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
        No broadcasts sent yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] font-body text-xs">
        <thead>
          <tr style={{ color: 'var(--a-text-muted)', borderBottom: '1px solid var(--a-border)' }}>
            <th className="px-4 py-2 text-left font-medium">Subject</th>
            <th className="px-4 py-2 text-left font-medium">Group</th>
            <th className="px-4 py-2 text-right font-medium">Recipients</th>
            <th className="px-4 py-2 text-left font-medium">Sent</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {broadcasts.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid var(--a-border)', color: 'var(--a-text)' }}>
              <td className="max-w-[140px] truncate px-4 py-2">{b.subject}</td>
              <td className="px-4 py-2">{BROADCAST_GROUP_LABELS[b.group] ?? b.group}</td>
              <td className="px-4 py-2 text-right">{b.recipientCount}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                {b.sentAt
                  ? new Date(b.sentAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
              <td className="px-4 py-2 capitalize">{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
