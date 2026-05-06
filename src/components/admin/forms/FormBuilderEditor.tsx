'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { slugify } from '@/lib/utils'
import { SortableFieldCard } from './SortableFieldCard'
import { FieldTypePicker } from './FieldTypePicker'
import toast from 'react-hot-toast'
import type { FormFieldInput } from '@/lib/validations/form'
import type { AppFieldType } from '@/lib/form-field-metadata'
import { cn } from '@/lib/utils'

function apiErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Failed to save form'
  const err = (body as { error?: unknown }).error
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const flat = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
    const fe = flat.formErrors?.find(Boolean)
    if (fe) return fe
    const fieldMsg = Object.values(flat.fieldErrors ?? {})
      .flat()
      .find(Boolean)
    if (fieldMsg) return fieldMsg
  }
  return 'Failed to save form'
}

interface FormBuilderEditorProps {
  mode: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    description?: string | null
    slug: string
    notifyEmail?: string | null
    isActive: boolean
    fields: FormFieldInput[]
  }
}

export function FormBuilderEditor({ mode, initialData }: FormBuilderEditorProps) {
  const router = useRouter()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [notifyEmail, setNotifyEmail] = useState(initialData?.notifyEmail ?? '')
  const [desiredActive, setDesiredActive] = useState(initialData?.isActive ?? true)
  const [fields, setFields] = useState<(FormFieldInput & { _key: string })[]>(
    (initialData?.fields ?? []).map((f, i) => ({
      ...f,
      _key: f.id ?? `field-${i}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }))
  )
  const [saving, setSaving] = useState(false)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (mode === 'create') setSlug(slugify(val))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i._key === active.id)
        const newIndex = items.findIndex((i) => i._key === over.id)
        return arrayMove(items, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }))
      })
    }
  }

  const addField = (type: AppFieldType) => {
    const newField: FormFieldInput & { _key: string } = {
      _key: `field-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label: `${type.replace(/_/g, ' ').toLowerCase()} field`,
      type,
      placeholder: '',
      required: false,
      options: ['DROPDOWN', 'RADIO', 'CHECKBOXES'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
      order: fields.length,
    }
    setFields((prev) => [...prev, newField])
  }

  const updateField = (key: string, updates: Partial<FormFieldInput>) => {
    setFields((prev) => prev.map((f) => (f._key === key ? { ...f, ...updates } : f)))
  }

  const removeField = (key: string) => {
    setFields((prev) =>
      prev
        .filter((f) => f._key !== key)
        .map((f, i) => ({ ...f, order: i }))
    )
  }

  const handleSave = async (isActive: boolean) => {
    if (!title.trim()) {
      toast.error('Form title is required')
      return
    }
    if (!slug.trim()) {
      toast.error('Slug is required')
      return
    }
    if (fields.length === 0) {
      toast.error('Add at least one field')
      return
    }

    const finalActive = isActive ? desiredActive : false

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        slug: slug.trim(),
        notifyEmail: notifyEmail.trim() || undefined,
        isActive: finalActive,
        fields: fields.map((field, i) => {
          const { _key, ...f } = field
          void _key
          return { ...f, order: i }
        }),
      }

      const url = mode === 'create' ? '/api/forms' : `/api/forms/${initialData!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(apiErrorMessage(errBody))
      }

      toast.success(mode === 'create' ? 'Form created!' : 'Form updated!')
      router.push('/admin/forms')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="border p-6 space-y-5"
            style={{ borderColor: 'rgba(201,168,76,0.2)' }}
          >
            <h3
              className="font-display text-lg text-white border-b pb-3"
              style={{ borderColor: 'rgba(201,168,76,0.15)' }}
            >
              Form Settings
            </h3>

            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                Form Title *
              </label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Join Room For You"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                URL Slug *
              </label>
              <div className="flex items-center border border-white/10 focus-within:border-gold transition-colors">
                <span className="px-3 py-3 text-xs text-white/30 font-mono bg-white/5 border-r border-white/10">
                  /forms/
                </span>
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  className="flex-1 bg-transparent text-white px-3 py-3 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description shown on the form page"
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 font-body tracking-widest uppercase mb-2">
                Notify Email
              </label>
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="admin@roomforyou.org"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
              <p className="text-[11px] text-white/30 mt-1 font-body">
                Receive an email on every submission
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDesiredActive(!desiredActive)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  desiredActive ? 'bg-gold' : 'bg-white/10'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                    desiredActive ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
              <div>
                <p className="text-xs text-white font-body">Published (live on site)</p>
                <p className="text-[10px] text-white/35 font-body">
                  When you publish, this controls visibility. Save as Draft always keeps the form
                  off.
                </p>
              </div>
            </div>
          </div>

          {mode === 'edit' && slug ? (
            <div
              className="border p-4 space-y-2"
              style={{ borderColor: 'rgba(201,168,76,0.15)' }}
            >
              <p className="text-xs text-white/50 font-body tracking-widest uppercase">Embed Code</p>
              <code className="block text-[11px] text-gold/70 font-mono bg-white/5 p-3 break-all">
                {`<iframe src="${appUrl || '(set NEXT_PUBLIC_APP_URL)'}/forms/${slug}" width="100%" height="600" frameborder="0"></iframe>`}
              </code>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-lg text-white">Fields</h3>
            <FieldTypePicker onAdd={addField} />
          </div>

          {fields.length === 0 ? (
            <div
              className="border border-dashed py-16 text-center"
              style={{ borderColor: 'rgba(201,168,76,0.2)' }}
            >
              <p className="text-white/30 font-body text-sm">
                No fields yet. Add your first field above.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={fields.map((f) => f._key)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <SortableFieldCard
                      key={field._key}
                      field={field}
                      onUpdate={(updates) => updateField(field._key, updates)}
                      onRemove={() => removeField(field._key)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <div
        className="sticky bottom-0 mt-8 border-t py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: 'rgba(201,168,76,0.2)', background: '#0A0A0A' }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-white/20 text-white/60 text-sm font-body hover:border-white/40 hover:text-white transition-colors w-fit"
        >
          Cancel
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-2.5 border border-gold/50 text-gold/80 text-sm font-body hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2.5 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Publish Form'}
          </button>
        </div>
      </div>
    </div>
  )
}
