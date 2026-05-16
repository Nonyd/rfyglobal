'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import type { EventFormField, EventRegistration } from '@prisma/client'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Users,
  Download,
  Settings,
  Lock,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { UploadZone } from '@/components/shared/UploadZone'
import { AdminToggle } from '@/components/shared/Toggle'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'

type EventRow = {
  id: string
  slug: string | null
  title: string
  description: string | null
  city: string
  venue: string
  date: string
  time: string | null
  imageUrl: string | null
  registrationFeeNgn: number | null
  registrationFeeUsd: number | null
  redirectUrl: string | null
  isActive: boolean
  _count?: { registrations: number }
}

const emptyForm = {
  title: '',
  description: '',
  city: '',
  venue: '',
  date: '',
  time: '',
  imageUrl: '',
  registrationFeeNgn: '' as string | number,
  registrationFeeUsd: '' as string | number,
  redirectUrl: '',
  isActive: true,
}

const emptyNewField = {
  label: '',
  type: 'SHORT_TEXT',
  placeholder: '',
  required: false,
  optionsText: '',
}

export function EventsManager() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [registrationsEvent, setRegistrationsEvent] = useState<EventRow | null>(null)
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [registrationFormFields, setRegistrationFormFields] = useState<EventFormField[]>([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [fieldsEvent, setFieldsEvent] = useState<EventRow | null>(null)
  const [eventFields, setEventFields] = useState<EventFormField[]>([])
  const [loadingFields, setLoadingFields] = useState(false)
  const [newField, setNewField] = useState(emptyNewField)
  const [addingField, setAddingField] = useState(false)
  const [fieldEdits, setFieldEdits] = useState<Record<string, Partial<EventFormField>>>({})
  const bulk = useBulkSelect(events)

  const openRegistrations = async (ev: EventRow) => {
    setRegistrationsEvent(ev)
    setLoadingRegs(true)
    try {
      const slugOrId = encodeURIComponent(ev.slug ?? ev.id)
      const [regsRes, fieldsRes] = await Promise.all([
        adminFetch(`/api/events/${slugOrId}/registrations`),
        adminFetch(`/api/events/${ev.id}/fields`),
      ])
      const data = (await regsRes.json()) as { registrations?: EventRegistration[] }
      const fieldsData = (await fieldsRes.json()) as EventFormField[] | { error?: string }
      setRegistrations(data.registrations ?? [])
      setRegistrationFormFields(
        Array.isArray(fieldsData)
          ? fieldsData.filter((f) => f.isActive && !f.isCore)
          : []
      )
    } catch {
      toast.error('Failed to load registrations')
    } finally {
      setLoadingRegs(false)
    }
  }

  const openFields = async (ev: EventRow) => {
    setFieldsEvent(ev)
    setFieldEdits({})
    setLoadingFields(true)
    try {
      const res = await adminFetch(`/api/events/${ev.id}/fields`)
      const data = (await res.json()) as EventFormField[] | { error?: string }
      setEventFields(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load fields')
    } finally {
      setLoadingFields(false)
    }
  }

  const addField = async () => {
    if (!newField.label.trim() || !fieldsEvent) return
    const options =
      newField.type === 'DROPDOWN'
        ? newField.optionsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined
    if (newField.type === 'DROPDOWN' && (!options || options.length === 0)) {
      toast.error('Add at least one dropdown option (one per line)')
      return
    }
    setAddingField(true)
    try {
      const res = await adminFetch(`/api/events/${fieldsEvent.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newField.label.trim(),
          type: newField.type,
          placeholder: newField.placeholder.trim() || null,
          required: newField.required,
          ...(options && options.length > 0 ? { options } : {}),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const field = (await res.json()) as EventFormField
      setEventFields((prev) => [...prev, field])
      setNewField({ ...emptyNewField })
      toast.success('Field added')
    } catch {
      toast.error('Failed to add field')
    } finally {
      setAddingField(false)
    }
  }

  const deleteField = async (fieldId: string) => {
    if (!confirm('Remove this field?') || !fieldsEvent) return
    const res = await adminFetch(`/api/events/${fieldsEvent.id}/fields/${fieldId}`, {
      method: 'DELETE',
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    if (res.ok) {
      setEventFields((prev) => prev.filter((f) => f.id !== fieldId))
      setFieldEdits((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
      toast.success('Field removed')
    } else {
      toast.error(typeof data.error === 'string' ? data.error : 'Failed to remove')
    }
  }

  const updateFieldLocally = (fieldId: string, updates: Partial<EventFormField>) => {
    setFieldEdits((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], ...updates } }))
  }

  const saveFieldChanges = async (fieldId: string, explicit?: Partial<EventFormField>) => {
    const edits = explicit ?? fieldEdits[fieldId]
    if (!edits || Object.keys(edits).length === 0 || !fieldsEvent) return
    try {
      const res = await adminFetch(`/api/events/${fieldsEvent.id}/fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to save')
        return
      }
      const updated = data as EventFormField
      setEventFields((prev) => prev.map((f) => (f.id === fieldId ? updated : f)))
      setFieldEdits((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
      if (!explicit) toast.success('Field updated')
    } catch {
      toast.error('Failed to save field')
    }
  }

  const moveFieldOrder = async (fieldId: string, direction: 'up' | 'down') => {
    if (!fieldsEvent) return
    const sorted = [...eventFields].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((f) => f.id === fieldId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    const orderA = a.order
    const orderB = b.order
    try {
      const [resA, resB] = await Promise.all([
        adminFetch(`/api/events/${fieldsEvent.id}/fields/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderB }),
        }),
        adminFetch(`/api/events/${fieldsEvent.id}/fields/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderA }),
        }),
      ])
      if (!resA.ok || !resB.ok) {
        toast.error('Failed to reorder')
        return
      }
      const updatedA = (await resA.json()) as EventFormField
      const updatedB = (await resB.json()) as EventFormField
      setEventFields((prev) =>
        prev.map((f) => {
          if (f.id === updatedA.id) return updatedA
          if (f.id === updatedB.id) return updatedB
          return f
        })
      )
    } catch {
      toast.error('Failed to reorder')
    }
  }

  const load = useCallback(async () => {
    const res = await adminFetch('/api/events')
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
      registrationFeeNgn: e.registrationFeeNgn ?? '',
      registrationFeeUsd: e.registrationFeeUsd ?? '',
      redirectUrl: e.redirectUrl ?? '',
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
    const parseFee = (v: string | number) => {
      if (v === '' || v === null || v === undefined) return null
      const n = typeof v === 'number' ? v : parseFloat(v)
      return Number.isFinite(n) && n >= 0 ? n : null
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      city: form.city.trim(),
      venue: form.venue.trim(),
      date: dateIso,
      time: form.time.trim() || undefined,
      imageUrl: form.imageUrl.trim() || '',
      registrationFeeNgn: parseFee(form.registrationFeeNgn),
      registrationFeeUsd: parseFee(form.registrationFeeUsd),
      redirectUrl: form.redirectUrl.trim() ? form.redirectUrl.trim() : null,
      isActive: form.isActive,
    }

    const url = editingId ? `/api/events/${editingId}` : '/api/events'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await adminFetch(url, {
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
    const res = await adminFetch(`/api/events/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete')
      return
    }
    toast.success('Event deleted')
    await load()
  }

  const bulkDelete = async () => {
    if (!bulk.selectedCount) return
    if (!confirm(`Delete ${bulk.selectedCount} event${bulk.selectedCount > 1 ? 's' : ''}?`)) return
    await Promise.all(bulk.selectedArray.map((id) => adminFetch(`/api/events/${id}`, { method: 'DELETE' })))
    toast.success(`${bulk.selectedCount} events deleted`)
    bulk.reset()
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
                'group relative flex flex-wrap items-start justify-between gap-4 border p-5 pl-12 transition-opacity',
                past ? 'opacity-50' : 'opacity-100'
              )}
              style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-surface)' }}
            >
              <div className="absolute left-4 top-4">
                <div
                  className={bulk.isSelected(e.id) ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100'}
                >
                  <SelectCheckbox checked={bulk.isSelected(e.id)} onChange={() => bulk.toggle(e.id)} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>{e.title}</h3>
                  <span
                    className="text-xs font-body px-2 py-0.5 border"
                    style={{
                      borderColor: 'var(--a-gold-border)',
                      color: 'var(--a-gold)',
                      background: 'var(--a-gold-light)',
                    }}
                  >
                    {e._count?.registrations ?? 0} registered
                  </span>
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
              <div className="flex shrink-0 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => void openRegistrations(e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-body border transition-all"
                  style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
                  onMouseEnter={(ev) => {
                    ev.currentTarget.style.borderColor = 'var(--a-gold-border)'
                    ev.currentTarget.style.color = 'var(--a-gold)'
                  }}
                  onMouseLeave={(ev) => {
                    ev.currentTarget.style.borderColor = 'var(--a-border)'
                    ev.currentTarget.style.color = 'var(--a-text-secondary)'
                  }}
                >
                  <Users size={12} />
                  Registrations
                </button>
                <button
                  type="button"
                  onClick={() => void openFields(e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-body border transition-all"
                  style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
                  onMouseEnter={(ev) => {
                    ev.currentTarget.style.borderColor = 'var(--a-gold-border)'
                    ev.currentTarget.style.color = 'var(--a-gold)'
                  }}
                  onMouseLeave={(ev) => {
                    ev.currentTarget.style.borderColor = 'var(--a-border)'
                    ev.currentTarget.style.color = 'var(--a-text-secondary)'
                  }}
                >
                  <Settings size={12} />
                  Form Fields
                </button>
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
            <div>
              <label
                className="mb-1 block font-body text-xs uppercase tracking-widest"
                style={{ color: 'var(--a-text-secondary)' }}
              >
                Event image
              </label>
              {form.imageUrl ? (
                <div className="space-y-3">
                  <div className="relative h-40 w-full overflow-hidden border" style={{ borderColor: 'var(--a-border)' }}>
                    <Image
                      src={form.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 28rem) 100vw, 400px"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    className="font-body text-xs transition-colors"
                    style={{ color: 'var(--a-red, #F85149)' }}
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <UploadZone
                  folder="eventImage"
                  accept="image"
                  preview
                  label="Upload event image (max 4MB)"
                  onUploadComplete={(files) => {
                    const url = files[0]?.url
                    if (url) {
                      setForm((f) => ({ ...f, imageUrl: url }))
                      toast.success('Image uploaded')
                    }
                  }}
                  onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
                />
              )}
            </div>
            <Field label="Registration fee (₦ Naira, optional)">
              <input
                type="number"
                min={0}
                step="1"
                value={form.registrationFeeNgn}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, registrationFeeNgn: ev.target.value === '' ? '' : ev.target.value }))
                }
                placeholder="0 = free in NGN"
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
              <p className="mt-1 font-body text-[11px]" style={{ color: 'var(--a-text-muted)' }}>
                Requires Paystack. Visitors can pay in NGN when this is set.
              </p>
            </Field>
            <Field label="Registration fee ($ USD, optional)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.registrationFeeUsd}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, registrationFeeUsd: ev.target.value === '' ? '' : ev.target.value }))
                }
                placeholder="0 = free in USD"
                className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
              />
              <p className="mt-1 font-body text-[11px]" style={{ color: 'var(--a-text-muted)' }}>
                Enable USD on your Paystack account. Visitors choose ₦ or $ when both are set.
              </p>
            </Field>
            <div className="border-t pt-5 mt-5" style={{ borderColor: 'var(--a-border)' }}>
              <p
                className="font-body text-xs uppercase tracking-widest font-semibold mb-4"
                style={{ color: 'var(--a-text-muted)' }}
              >
                After Registration
              </p>
              <div>
                <label
                  className="font-body text-sm font-medium block mb-1.5"
                  style={{ color: 'var(--a-text)' }}
                >
                  Redirect URL
                  <span className="ml-2 font-normal text-xs" style={{ color: 'var(--a-text-muted)' }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="url"
                  value={form.redirectUrl}
                  onChange={(ev) => setForm((f) => ({ ...f, redirectUrl: ev.target.value }))}
                  placeholder="https://rfyglobal.org/events"
                  className="w-full px-3 py-2.5 font-body text-sm border outline-none"
                  style={{
                    background: 'var(--a-bg)',
                    borderColor: 'var(--a-border)',
                    color: 'var(--a-text)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
                />
                <p
                  className="font-body text-xs mt-1.5 leading-relaxed"
                  style={{ color: 'var(--a-text-muted)' }}
                >
                  Redirect visitors to this URL after successful registration. Leave empty to show
                  the default confirmation message.
                </p>
              </div>
            </div>
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

      <AnimatePresence>
        {registrationsEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRegistrationsEvent(null)}
              className="fixed inset-0 z-[55]"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[56] w-full max-w-2xl overflow-y-auto"
              style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p
                      className="font-body text-xs uppercase tracking-widest mb-1"
                      style={{ color: 'var(--a-gold)' }}
                    >
                      Event Registrations
                    </p>
                    <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
                      {registrationsEvent.title}
                    </h3>
                    <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
                      {registrations.length} registered
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/api/events/${encodeURIComponent(registrationsEvent.slug ?? registrationsEvent.id)}/registrations?format=csv`}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-body border transition-all"
                      style={{
                        borderColor: 'var(--a-border)',
                        color: 'var(--a-text-secondary)',
                        background: 'var(--a-bg)',
                      }}
                    >
                      <Download size={12} /> Export CSV
                    </a>
                    <button
                      type="button"
                      onClick={() => setRegistrationsEvent(null)}
                      style={{ color: 'var(--a-text-muted)' }}
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="h-px mb-6" style={{ background: 'var(--a-border)' }} />

                {loadingRegs ? (
                  <div className="text-center py-12">
                    <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                      Loading registrations…
                    </p>
                  </div>
                ) : registrations.length === 0 ? (
                  <div
                    className="text-center py-12 border border-dashed"
                    style={{ borderColor: 'var(--a-border)' }}
                  >
                    <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                      No registrations yet for this event.
                    </p>
                  </div>
                ) : (
                  <div className="border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full font-body text-sm">
                        <thead>
                          <tr
                            style={{
                              background: 'var(--a-sidebar)',
                              borderBottom: `1px solid var(--a-border)`,
                            }}
                          >
                            {(['Name', 'Email', 'Phone', 'Location'] as const).map((h) => (
                              <th
                                key={h}
                                className="text-left px-3 py-2.5 text-xs uppercase tracking-widest"
                                style={{ color: 'var(--a-gold)' }}
                              >
                                {h}
                              </th>
                            ))}
                            {registrationFormFields.map((f) => (
                              <th
                                key={f.id}
                                className="text-left px-3 py-2.5 text-xs uppercase tracking-widest"
                                style={{ color: 'var(--a-gold)' }}
                              >
                                {f.label}
                              </th>
                            ))}
                            <th
                              className="text-left px-3 py-2.5 text-xs uppercase tracking-widest"
                              style={{ color: 'var(--a-gold)' }}
                            >
                              When
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrations.map((r, i) => (
                            <tr
                              key={r.id}
                              style={{
                                borderBottom: `1px solid var(--a-border)`,
                                background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)',
                              }}
                            >
                              <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--a-text)' }}>
                                {r.name}
                              </td>
                              <td className="px-3 py-2.5" style={{ color: 'var(--a-text-secondary)' }}>
                                {r.email}
                              </td>
                              <td className="px-3 py-2.5" style={{ color: 'var(--a-text-secondary)' }}>
                                {r.phone}
                              </td>
                              <td className="px-3 py-2.5" style={{ color: 'var(--a-text-secondary)' }}>
                                {r.location}
                              </td>
                              {registrationFormFields.map((f) => {
                                const extra = r.extraFields as Record<string, string> | null
                                const val = extra?.[f.id]
                                return (
                                  <td
                                    key={f.id}
                                    className="px-3 py-2.5 max-w-[140px] truncate"
                                    style={{ color: 'var(--a-text-secondary)' }}
                                    title={val ?? ''}
                                  >
                                    {val ?? '—'}
                                  </td>
                                )
                              })}
                              <td className="px-3 py-2.5" style={{ color: 'var(--a-text-muted)' }}>
                                {formatDate(r.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fieldsEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFieldsEvent(null)}
              className="fixed inset-0 z-[57]"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[58] w-full max-w-lg overflow-y-auto"
              style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
            >
              <div className="space-y-6 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="mb-1 font-body text-xs uppercase tracking-widest"
                      style={{ color: 'var(--a-gold)' }}
                    >
                      Registration Form Fields
                    </p>
                    <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>
                      {fieldsEvent.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFieldsEvent(null)}
                    style={{ color: 'var(--a-text-muted)' }}
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="h-px" style={{ background: 'var(--a-border)' }} />

                <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
                  All registration fields are editable. New events start with default fields; add more below. The
                  email field cannot be removed — it is used to prevent duplicate registrations.
                </p>

                {loadingFields ? (
                  <p className="py-4 text-center font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
                    Loading…
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...eventFields].sort((a, b) => a.order - b.order).map((field, index, arr) => {
                      const isEmail = field.type === 'EMAIL'
                      const edits = fieldEdits[field.id] ?? {}
                      const currentLabel = edits.label ?? field.label
                      const currentPlaceholder = edits.placeholder ?? field.placeholder ?? ''
                      const currentRequired = edits.required ?? field.required
                      const hasEdits = Object.keys(fieldEdits[field.id] ?? {}).length > 0

                      return (
                        <div
                          key={field.id}
                          className="space-y-3 border p-4"
                          style={{
                            borderColor: hasEdits ? 'var(--a-gold-border)' : 'var(--a-border)',
                            background: hasEdits ? 'var(--a-gold-light)' : 'var(--a-surface)',
                            opacity: field.isActive ? 1 : 0.65,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <div className="flex shrink-0 flex-col gap-0.5">
                                <button
                                  type="button"
                                  aria-label="Move up"
                                  disabled={index === 0}
                                  onClick={() => void moveFieldOrder(field.id, 'up')}
                                  className="rounded p-0.5 transition-colors disabled:opacity-30"
                                  style={{ color: 'var(--a-text-muted)' }}
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Move down"
                                  disabled={index >= arr.length - 1}
                                  onClick={() => void moveFieldOrder(field.id, 'down')}
                                  className="rounded p-0.5 transition-colors disabled:opacity-30"
                                  style={{ color: 'var(--a-text-muted)' }}
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                              <span
                                className="text-[10px] px-2 py-0.5 font-body uppercase tracking-widest"
                                style={{
                                  background: 'var(--a-sidebar)',
                                  color: 'var(--a-text-muted)',
                                  border: '1px solid var(--a-border)',
                                }}
                              >
                                {field.type.replace(/_/g, ' ').toLowerCase()}
                              </span>
                              {isEmail ? (
                                <span
                                  className="flex items-center gap-1 text-[10px] font-body"
                                  style={{ color: 'var(--a-gold)' }}
                                  title="Required for registration"
                                >
                                  <Lock size={12} aria-hidden />
                                  required for registration
                                </span>
                              ) : null}
                              {!field.isActive ? (
                                <span className="text-[10px] font-body" style={{ color: 'var(--a-text-muted)' }}>
                                  (inactive)
                                </span>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {hasEdits && (
                                <button
                                  type="button"
                                  onClick={() => void saveFieldChanges(field.id)}
                                  className="px-3 py-1 font-body text-xs font-medium text-black transition-all"
                                  style={{ background: 'var(--a-gold)' }}
                                >
                                  Save
                                </button>
                              )}
                              {!isEmail && (
                                <button
                                  type="button"
                                  onClick={() => void deleteField(field.id)}
                                  className="p-1.5 transition-colors"
                                  style={{ color: 'var(--a-text-muted)' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--a-text-muted)'
                                  }}
                                  aria-label="Delete field"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <label
                              className="mb-1 block font-body text-[10px] uppercase tracking-widest"
                              style={{ color: 'var(--a-text-muted)' }}
                            >
                              Label
                            </label>
                            <input
                              value={currentLabel}
                              onChange={(e) => updateFieldLocally(field.id, { label: e.target.value })}
                              onBlur={() => hasEdits && void saveFieldChanges(field.id)}
                              className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                              style={{
                                background: 'var(--a-bg)',
                                borderColor: 'var(--a-border)',
                                color: 'var(--a-text)',
                              }}
                              onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                            />
                          </div>

                          <div>
                            <label
                              className="mb-1 block font-body text-[10px] uppercase tracking-widest"
                              style={{ color: 'var(--a-text-muted)' }}
                            >
                              Placeholder
                            </label>
                            <input
                              value={currentPlaceholder}
                              onChange={(e) =>
                                updateFieldLocally(field.id, { placeholder: e.target.value || null })
                              }
                              onBlur={() => hasEdits && void saveFieldChanges(field.id)}
                              placeholder="Optional placeholder text"
                              className="w-full border px-3 py-2 font-body text-sm focus:outline-none"
                              style={{
                                background: 'var(--a-bg)',
                                borderColor: 'var(--a-border)',
                                color: 'var(--a-text)',
                              }}
                              onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <AdminToggle
                              checked={currentRequired}
                              disabled={isEmail}
                              onChange={(val) => {
                                if (isEmail) return
                                void saveFieldChanges(field.id, { required: val })
                              }}
                              label="Required"
                              size="sm"
                            />
                            <AdminToggle
                              checked={field.isActive}
                              disabled={isEmail}
                              onChange={(val) => void saveFieldChanges(field.id, { isActive: val })}
                              label="Active"
                              size="sm"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="space-y-3 border p-4" style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)' }}>
                  <p className="font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                    Add Custom Field
                  </p>

                  <input
                    value={newField.label}
                    onChange={(e) => setNewField((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Field label"
                    className="w-full border px-3 py-2.5 font-body text-sm focus:outline-none"
                    style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField((p) => ({ ...p, type: e.target.value }))}
                      className="border px-3 py-2.5 font-body text-sm focus:outline-none"
                      style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    >
                      <option value="SHORT_TEXT">Short Text</option>
                      <option value="LONG_TEXT">Long Text</option>
                      <option value="PHONE">Phone</option>
                      <option value="NUMBER">Number</option>
                      <option value="EMAIL">Email</option>
                      <option value="DROPDOWN">Dropdown</option>
                    </select>

                    <input
                      value={newField.placeholder}
                      onChange={(e) => setNewField((p) => ({ ...p, placeholder: e.target.value }))}
                      placeholder="Placeholder (optional)"
                      className="border px-3 py-2.5 font-body text-sm focus:outline-none"
                      style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    />
                  </div>

                  {newField.type === 'DROPDOWN' && (
                    <textarea
                      value={newField.optionsText}
                      onChange={(e) => setNewField((p) => ({ ...p, optionsText: e.target.value }))}
                      placeholder="Dropdown options — one per line"
                      rows={3}
                      className="w-full border px-3 py-2.5 font-body text-sm focus:outline-none"
                      style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 font-body text-xs" style={{ color: 'var(--a-text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField((p) => ({ ...p, required: e.target.checked }))}
                        className="accent-gold"
                      />
                      Required
                    </label>

                    <button
                      type="button"
                      onClick={() => void addField()}
                      disabled={addingField || !newField.label.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 font-body text-xs font-medium text-black transition-all disabled:opacity-40"
                      style={{ background: 'var(--a-gold)' }}
                    >
                      <Plus size={12} />
                      {addingField ? 'Adding…' : 'Add Field'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={events.length}
        actions={[
          { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => void bulkDelete(), variant: 'danger' },
        ]}
      />
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
