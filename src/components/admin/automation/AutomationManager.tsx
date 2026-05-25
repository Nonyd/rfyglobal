'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useCallback, useEffect, useState } from 'react'
import type { AutomationSettings, EmailLog, CommunityMember } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { AdminToggle } from '@/components/shared/Toggle'

type LogRow = EmailLog & {
  member: Pick<CommunityMember, 'name' | 'email'> | null
}

type AutomationSettingRow = {
  id: string
  key: string
  enabled: boolean
  config: unknown
}

interface AutomationManagerProps {
  settings: AutomationSettings
  recentLogs: LogRow[]
}

const AUTOMATIONS = [
  {
    key: 'birthday',
    title: 'Birthday Wishes',
    description:
      'Automatically sends a personalized birthday email to anyone who provided their date of birth in a form.',
    icon: '🎂',
    badge: 'Daily Cron',
  },
  {
    key: 'welcome',
    title: 'Welcome Email',
    description: 'Sends a warm welcome email when someone joins the community via the join form.',
    icon: '👋',
    badge: 'On Join',
  },
  {
    key: 'event_reminder',
    title: 'Event Reminders',
    description: 'Sends a reminder email to all registered attendees 24 hours before each event.',
    icon: '📅',
    badge: 'Daily Cron',
  },
  {
    key: 'daily_scripture',
    title: 'Daily Scripture',
    description:
      "Sends today's published scripture from the Word page to all community members every morning.",
    icon: '📖',
    badge: 'Daily Cron',
  },
  {
    key: 'daily_study',
    title: 'Daily Study',
    description: "Sends today's study material to all community members every morning.",
    icon: '✍️',
    badge: 'Daily Cron',
  },
] as const

function emailTypeLabel(t: string | unknown): string {
  const s = typeof t === 'string' ? t : String(t)
  switch (s) {
    case 'CONFIRMATION':
      return 'Confirmation'
    case 'DAILY_DEVOTIONAL':
      return 'Daily devotional'
    case 'EVENT_REMINDER_WEEK':
      return 'Event (1 week)'
    case 'EVENT_REMINDER_DAY':
      return 'Event (24h)'
    default:
      return s
  }
}

export function AutomationManager({ settings: initial, recentLogs }: AutomationManagerProps) {
  const [whatsappChannelUrl, setWhatsappChannelUrl] = useState(initial.whatsappChannelUrl)
  const [devotionalEmailTime, setDevotionalEmailTime] = useState(initial.devotionalEmailTime)
  const [isDevotionalActive, setIsDevotionalActive] = useState(initial.isDevotionalActive)
  const [isEventReminderActive, setIsEventReminderActive] = useState(initial.isEventReminderActive)
  const [saving, setSaving] = useState(false)
  const [runningDevotional, setRunningDevotional] = useState(false)
  const [runningEvents, setRunningEvents] = useState(false)

  const [automationSettings, setAutomationSettings] = useState<Record<string, boolean>>({})
  const [loadingAutomations, setLoadingAutomations] = useState(true)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const loadAutomations = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/automations')
      if (!res.ok) throw new Error('Failed')
      const rows = (await res.json()) as AutomationSettingRow[]
      const map: Record<string, boolean> = {}
      for (const row of rows) {
        map[row.key] = row.enabled
      }
      setAutomationSettings(map)
    } catch {
      toast.error('Could not load automation toggles')
    } finally {
      setLoadingAutomations(false)
    }
  }, [])

  useEffect(() => {
    loadAutomations()
  }, [loadAutomations])

  const toggleAutomation = async (key: string, enabled: boolean) => {
    setTogglingKey(key)
    setAutomationSettings((prev) => ({ ...prev, [key]: enabled }))
    try {
      const res = await adminFetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      })
      if (!res.ok) throw new Error('Failed')
      const label = AUTOMATIONS.find((a) => a.key === key)?.title ?? key
      toast.success(`${label} ${enabled ? 'enabled' : 'disabled'}`)
    } catch {
      setAutomationSettings((prev) => ({ ...prev, [key]: !enabled }))
      toast.error('Could not save automation')
    } finally {
      setTogglingKey(null)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await adminFetch('/api/automation/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappChannelUrl,
          devotionalEmailTime,
          isDevotionalActive,
          isEventReminderActive,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Automation settings saved')
    } catch {
      toast.error('Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const runDevotional = async () => {
    setRunningDevotional(true)
    try {
      const res = await adminFetch('/api/admin/cron/devotional', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast.success(
        data.skipped ? 'Devotional skipped (no scripture or no members)' : `Sent: ${data.sent ?? 0}`,
      )
    } catch {
      toast.error('Devotional run failed')
    } finally {
      setRunningDevotional(false)
    }
  }

  const runEventReminders = async () => {
    setRunningEvents(true)
    try {
      const res = await adminFetch('/api/admin/cron/event-reminders', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast.success(`Week sends: ${data.week?.sent ?? 0}, Day sends: ${data.day?.sent ?? 0}`)
    } catch {
      toast.error('Event reminder run failed')
    } finally {
      setRunningEvents(false)
    }
  }

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          Email automation
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Toggle automations on or off. Daily jobs run via{' '}
          <code className="text-xs">/api/cron/automations?secret=CRON_SECRET</code>.
        </p>
      </div>

      <div className="space-y-4">
        <p className="font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
          Automations
        </p>
        {loadingAutomations ? (
          <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            Loading…
          </p>
        ) : (
          <div className="space-y-3">
            {AUTOMATIONS.map((auto) => (
              <div
                key={auto.key}
                className="p-5 border rounded-sm flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
              >
                <div className="flex gap-4 min-w-0">
                  <span className="text-2xl shrink-0" aria-hidden>
                    {auto.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
                        {auto.title}
                      </h3>
                      <span
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5 font-body"
                        style={{ background: 'var(--a-gold-light)', color: 'var(--a-gold)' }}
                      >
                        {auto.badge}
                      </span>
                    </div>
                    <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                      {auto.description}
                    </p>
                  </div>
                </div>
                <AdminToggle
                  checked={automationSettings[auto.key] ?? false}
                  onChange={(v) => toggleAutomation(auto.key, v)}
                  label={automationSettings[auto.key] ? 'On' : 'Off'}
                  disabled={togglingKey === auto.key}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="space-y-5 p-6 border rounded-sm"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        <p className="font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
          Legacy cron settings
        </p>
        <div>
          <label
            className="block text-xs uppercase tracking-widest font-body mb-2"
            style={{ color: 'var(--a-text-muted)' }}
          >
            WhatsApp channel URL
          </label>
          <input
            value={whatsappChannelUrl}
            onChange={(e) => setWhatsappChannelUrl(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full border px-4 py-3 font-body text-sm"
            style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
          />
          <p className="mt-1 text-xs font-body" style={{ color: 'var(--a-text-muted)' }}>
            Used in the join confirmation email and on the thank-you screen after signup.
          </p>
        </div>

        <div>
          <label
            className="block text-xs uppercase tracking-widest font-body mb-2"
            style={{ color: 'var(--a-text-muted)' }}
          >
            Devotional send time (reference / UTC)
          </label>
          <input
            value={devotionalEmailTime}
            onChange={(e) => setDevotionalEmailTime(e.target.value)}
            className="w-full border px-4 py-3 font-body text-sm max-w-[140px]"
            style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
          />
        </div>

        <div className="flex flex-col gap-4">
          <AdminToggle
            checked={isDevotionalActive}
            onChange={(v) => setIsDevotionalActive(v)}
            label="Legacy daily devotional cron (separate from Daily Scripture toggle)"
          />
          <AdminToggle
            checked={isEventReminderActive}
            onChange={(v) => setIsEventReminderActive(v)}
            label="Legacy community event reminders (separate from Event Reminders toggle)"
          />
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 font-body text-sm font-medium tracking-widest uppercase text-white disabled:opacity-40"
          style={{ background: 'var(--a-gold)' }}
        >
          {saving ? 'Saving…' : 'Save legacy settings'}
        </button>
      </div>

      <div className="space-y-4">
        <p className="font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
          Manual tests (admin session)
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runDevotional}
            disabled={runningDevotional}
            className="px-4 py-2.5 font-body text-sm border disabled:opacity-40"
            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
          >
            {runningDevotional ? 'Sending…' : "Send today's devotional now"}
          </button>
          <button
            type="button"
            onClick={runEventReminders}
            disabled={runningEvents}
            className="px-4 py-2.5 font-body text-sm border disabled:opacity-40"
            style={{ borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
          >
            {runningEvents ? 'Running…' : 'Check legacy event reminders now'}
          </button>
        </div>
      </div>

      <div>
        <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--a-text-muted)' }}>
          Recent email log
        </p>
        <div className="border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
          <table className="w-full font-body text-sm">
            <thead>
              <tr style={{ background: 'var(--a-sidebar)', borderBottom: `1px solid var(--a-border)` }}>
                {['Type', 'Subject', 'Recipient', 'Sent', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs uppercase tracking-widest"
                    style={{ color: 'var(--a-gold)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center" style={{ color: 'var(--a-text-muted)' }}>
                    No sends logged yet.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: `1px solid var(--a-border)`,
                      background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)',
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                      {emailTypeLabel(log.type)}
                    </td>
                    <td
                      className="px-4 py-3 max-w-[200px] truncate"
                      style={{ color: 'var(--a-text)' }}
                      title={log.subject}
                    >
                      {log.subject}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[160px]" style={{ color: 'var(--a-text-muted)' }}>
                      {log.member?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--a-text-muted)' }}>
                      {formatDate(log.sentAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5"
                        style={{
                          background: log.status === 'sent' ? 'var(--a-gold-light)' : 'var(--a-sidebar)',
                          color: log.status === 'sent' ? 'var(--a-gold)' : 'var(--a-red)',
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
