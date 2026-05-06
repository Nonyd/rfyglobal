'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

type EventRow = {
  id: string
  title: string
  description: string | null
  city: string
  venue: string
  date: string
  time: string | null
  imageUrl: string | null
  isActive: boolean
}

const emptyForm = {
  title: '',
  description: '',
  city: '',
  venue: '',
  date: '',
  time: '',
  imageUrl: '',
  isActive: true,
}

export function EventsManager() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    const res = await fetch('/api/events')
    if (!res.ok) {
      toast.error('Failed to load events')
      return
    }
    const data = (await res.json()) as EventRow[]
    setEvents(data)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await load()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (e: EventRow) => {
    setEditingId(e.id)
    const d = new Date(e.date)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setForm({
      title: e.title,
      description: e.description ?? '',
      city: e.city,
      venue: e.venue,
      date: `${y}-${m}-${day}`,
      time: e.time ?? '',
      imageUrl: e.imageUrl ?? '',
      isActive: e.isActive,
    })
    setPanelOpen(true)
  }

  const save = async () => {
    if (!form.title.trim() || !form.city.trim() || !form.venue.trim() || !form.date) {
      toast.error('Title, city, venue, and date are required')
      return
    }
    const dateIso = new Date(`${form.date}T12:00:00`).toISOString()
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      city: form.city.trim(),
      venue: form.venue.trim(),
      date: dateIso,
      time: form.time.trim() || undefined,
      imageUrl: form.imageUrl.trim() || '',
      isActive: form.isActive,
    }

    const url = editingId ? `/api/events/${editingId}` : '/api/events'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      toast.error('Failed to save event')
      return
    }
    toast.success(editingId ? 'Event updated' : 'Event created')
    setPanelOpen(false)
    await load()
  }

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete')
      return
    }
    toast.success('Event deleted')
    await load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24" style={{ color: 'var(--a-text-muted)' }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>Events</h2>
          <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>{events.length} events</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 bg-gold px-5 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      <div className="space-y-3">
        {events.map((e) => {
          const past = new Date(e.date) < now
          return (
            <div
              key={e.id}
              className={cn(
                'flex flex-wrap items-start justify-between gap-4 border p-5 transition-opacity',
                past ? 'opacity-50' : 'opacity-100'
              )}
              style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-surface)' }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>{e.title}</h3>
                  <span
                    className={cn(
                      'px-2 py-0.5 font-body text-[10px] uppercase tracking-widest',
                      ''
                    )}
                    style={{
                      background: e.isActive ? 'var(--a-gold-light)' : 'var(--a-sidebar-hover)',
                      color: e.isActive ? 'var(--a-gold)' : 'var(--a-text-muted)',
                    }}
                  >
                    {e.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {past && (
                    <span className="font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                      Past
                    </span>
                  )}
                </div>
                <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
                  {e.city} · {e.venue}
                </p>
                <p className="mt-1 font-body text-xs" style={{ color: 'var(--a-gold)' }}>
                  {formatDate(e.date)}
                  {e.time ? ` · ${e.time}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(e)}
                  className="p-2"
                  style={{ color: 'var(--a-text-muted)' }}
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(e.id, e.title)}
                  className="p-2"
                  style={{ color: 'var(--a-text-muted)' }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
        {events.length === 0 && (
          <p className="py-16 text-center font-body" style={{ color: 'var(--a-text-muted)' }}>No events yet.</p>
        )}
      </div>

      <div
        className={cn(
          'fixed inset-0 z-50 transition-opacity',
          panelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/70"
          aria-label="Close"
          onClick={() => setPanelOpen(false)}
        />
        <div
          className={cn(
            'absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l bg-black shadow-xl transition-transform',
            panelOpen ? 'translate-x-0' : 'translate-x-full'
          )}
          style={{ borderColor: 'rgba(201,168,76,0.25)' }}
        >
          <div
            className="flex items-center justify-between border-b p-4"
            style={{ borderColor: 'rgba(201,168,76,0.15)' }}
          >
            <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>
              {editingId ? 'Edit Event' : 'New Event'}
            </h3>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="p-2"
              style={{ color: 'var(--a-text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                rows={3}
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text-secondary)' }}
              />
            </Field>
            <Field label="City">
              <input
                value={form.city}
                onChange={(ev) => setForm((f) => ({ ...f, city: ev.target.value }))}
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
            </Field>
            <Field label="Venue">
              <input
                value={form.venue}
                onChange={(ev) => setForm((f) => ({ ...f, venue: ev.target.value }))}
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={form.date}
                onChange={(ev) => setForm((f) => ({ ...f, date: ev.target.value }))}
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
            </Field>
            <Field label="Time">
              <input
                value={form.time}
                onChange={(ev) => setForm((f) => ({ ...f, time: ev.target.value }))}
                placeholder="e.g. 6:00 PM"
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
            </Field>
            <Field label="Image URL">
              <input
                value={form.imageUrl}
                onChange={(ev) => setForm((f) => ({ ...f, imageUrl: ev.target.value }))}
                className="w-full border px-3 py-2 font-mono text-xs focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(ev) => setForm((f) => ({ ...f, isActive: ev.target.checked }))}
                className="accent-gold"
              />
              Active (shown on public page when upcoming)
            </label>
          </div>
          <div className="border-t p-4" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
            <button
              type="button"
              onClick={() => void save()}
              className="w-full bg-gold py-2.5 font-body text-sm font-medium text-black hover:bg-gold-light"
            >
              {editingId ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
