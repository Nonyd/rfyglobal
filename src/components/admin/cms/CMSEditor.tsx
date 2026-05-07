'use client'

import { useState } from 'react'
import { UploadZone } from '@/components/shared/UploadZone'
import type { CloudinaryFolder } from '@/lib/cloudinary-client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { RotateCcw } from 'lucide-react'

export interface CMSField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'url'
  placeholder?: string
  hint?: string
  /** Cloudinary folder for image uploads (default: cms) */
  uploadFolder?: CloudinaryFolder
}

interface CMSEditorProps {
  title: string
  description?: string
  fields: CMSField[]
  initialValues: Record<string, string>
  /** Canonical defaults used after “reset” (DB row removed). */
  defaults: Record<string, string>
}

export function CMSEditor({ title, description, fields, initialValues, defaults }: CMSEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [baseline, setBaseline] = useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = useState<string | null>(null)

  const hasChanged = (key: string) => values[key] !== (baseline[key] ?? '')

  const saveField = async (key: string) => {
    setSaving(key)
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setBaseline((prev) => ({ ...prev, [key]: values[key] ?? '' }))
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(null)
    }
  }

  const resetField = async (key: string) => {
    const res = await fetch('/api/cms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (res.ok) {
      const next = defaults[key] ?? ''
      setValues((prev) => ({ ...prev, [key]: next }))
      setBaseline((prev) => ({ ...prev, [key]: next }))
      toast.success('Reset to default')
    }
  }

  const saveAll = async () => {
    const changed = fields.filter((f) => hasChanged(f.key))
    if (changed.length === 0) {
      toast('Nothing changed')
      return
    }

    setSaving('all')
    try {
      const results = await Promise.all(
        changed.map((f) =>
          fetch('/api/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: f.key, value: values[f.key] }),
          }),
        ),
      )
      if (results.some((r) => !r.ok)) throw new Error('partial')
      setBaseline((prev) => {
        const next = { ...prev }
        for (const f of changed) next[f.key] = values[f.key] ?? ''
        return next
      })
      toast.success(`Saved ${changed.length} field${changed.length > 1 ? 's' : ''}`)
    } catch {
      toast.error('Some fields failed to save')
    } finally {
      setSaving(null)
    }
  }

  const changedCount = fields.filter((f) => hasChanged(f.key)).length

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>{title}</h2>
          {description ? (
            <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={saving === 'all' || changedCount === 0}
          className={cn(
            'px-5 py-2.5 font-body text-sm font-medium transition-all',
            changedCount > 0
              ? ''
              : 'cursor-not-allowed',
          )}
          style={
            changedCount > 0
              ? { background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }
              : { background: 'var(--a-sidebar-hover)', color: 'var(--a-text-muted)' }
          }
        >
          {saving === 'all' ? 'Saving…' : `Save All${changedCount > 0 ? ` (${changedCount})` : ''}`}
        </button>
      </div>

      <div className="space-y-8">
        {fields.map((field) => {
          const changed = hasChanged(field.key)
          const isSaving = saving === field.key

          return (
            <div
              key={field.key}
              className={cn(
                'border p-6 transition-all',
                '',
              )}
              style={{
                borderColor: changed ? 'var(--a-gold-border)' : 'var(--a-border)',
                background: changed ? 'var(--a-gold-light)' : 'var(--a-surface)',
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="block font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>{field.label}</label>
                  <p className="mt-0.5 font-mono text-[10px]" style={{ color: 'var(--a-text-muted)' }}>{field.key}</p>
                  {field.hint ? (
                    <p className="mt-1 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>{field.hint}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {changed ? (
                    <span className="font-body text-[10px] uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                      Unsaved
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void resetField(field.key)}
                    title="Reset to default"
                    className="p-1.5 transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>

              {field.type === 'image' ? (
                <div className="space-y-3">
                  {values[field.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={values[field.key]}
                      alt=""
                      className="h-32 border object-cover"
                      style={{ borderColor: 'var(--a-border)' }}
                    />
                  ) : null}
                  <UploadZone
                    folder={field.uploadFolder ?? 'cms'}
                    accept="image"
                    preview
                    label="Upload new image"
                    onUploadComplete={(files) => {
                      const url = files[0]?.url
                      if (url) setValues((prev) => ({ ...prev, [field.key]: url }))
                    }}
                    onUploadError={(err) => toast.error(err.message)}
                  />
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full resize-y border px-4 py-3 font-body text-sm transition-colors focus:outline-none"
                  style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
                />
              ) : (
                <input
                  type={field.type === 'url' ? 'url' : 'text'}
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full border px-4 py-3 font-body text-sm transition-colors focus:outline-none"
                  style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text)' }}
                />
              )}

              {changed ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void saveField(field.key)}
                    disabled={isSaving}
                    className="border px-4 py-2 font-body text-xs transition-colors disabled:opacity-40"
                    style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)', color: 'var(--a-gold)' }}
                  >
                    {isSaving ? 'Saving…' : 'Save this field'}
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
