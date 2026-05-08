'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Testimony, TestimonyStatus } from '@prisma/client'

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

function parseImages(imageUrls: unknown): string[] {
  if (!imageUrls) return []
  try {
    return Array.isArray(imageUrls) ? imageUrls : JSON.parse(imageUrls as string)
  } catch {
    return []
  }
}

export function TestimonyManager() {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [items, setItems] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Testimony | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/testimony?status=${tab}`)
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      setItems(data as Testimony[])
      setSelected((prev) => {
        if (!prev) return null
        const still = (data as Testimony[]).find((t) => t.id === prev.id)
        return still ?? (data as Testimony[])[0] ?? null
      })
    } catch {
      toast.error('Could not load testimonies')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    setSelected(null)
    void load()
  }, [tab, load])

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/testimony/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      toast.error('Update failed')
      return
    }
    toast.success('Saved')
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this testimony?')) return
    const res = await fetch(`/api/admin/testimony/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Delete failed')
      return
    }
    toast.success('Deleted')
    if (selected?.id === id) setSelected(null)
    load()
  }

  const mediaFlags = (t: Testimony) => {
    const imgs = parseImages(t.imageUrls)
    const parts: string[] = []
    if (t.body?.trim()) parts.push('📝')
    if (imgs.length) parts.push('📷')
    if (t.videoUrl) parts.push('📹')
    return parts.join(' ')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="rounded border px-4 py-2 font-body text-xs uppercase tracking-widest"
              style={{
                borderColor: tab === t ? 'var(--a-gold-border)' : 'var(--a-border)',
                background: tab === t ? 'var(--a-gold-active)' : 'transparent',
                color: tab === t ? 'var(--a-gold)' : 'var(--a-text-secondary)',
              }}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-body text-sm text-mist">Loading…</p>
        ) : items.length === 0 ? (
          <p className="font-body text-sm text-mist">No testimonies.</p>
        ) : (
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {items.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t)}
                className="w-full border p-3 text-left transition-colors"
                style={{
                  borderColor: selected?.id === t.id ? 'var(--a-gold-border)' : 'var(--a-border)',
                  background: selected?.id === t.id ? 'var(--a-gold-active)' : 'var(--a-surface)',
                }}
              >
                <p className="font-display text-sm font-semibold" style={{ color: 'var(--a-text)' }}>
                  {t.title}
                </p>
                <p className="mt-1 line-clamp-2 font-body text-xs" style={{ color: 'var(--a-text-secondary)' }}>
                  {t.body || '—'}
                </p>
                <p className="mt-2 font-body text-[10px]" style={{ color: 'var(--a-text-muted)' }}>
                  {t.isAnonymous ? 'Anonymous' : t.name || '—'} · {mediaFlags(t)} ·{' '}
                  {format(new Date(t.createdAt), 'MMM d, yyyy')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="min-h-[320px] border p-4 lg:max-h-[70vh] lg:overflow-y-auto"
        style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
      >
        {!selected ? (
          <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            Select a testimony to preview.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--a-text)' }}>
                {selected.title}
              </h2>
              <p className="mt-1 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                {selected.email} · {selected.status}
                {selected.isFeatured ? ' · Featured' : ''}
              </p>
            </div>
            {selected.body && (
              <p
                className="whitespace-pre-wrap font-body text-sm leading-relaxed"
                style={{ color: 'var(--a-text-secondary)' }}
              >
                {selected.body}
              </p>
            )}
            {parseImages(selected.imageUrls).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {parseImages(selected.imageUrls).map((url) => (
                  <div
                    key={url}
                    className="relative aspect-video w-full overflow-hidden border"
                    style={{ borderColor: 'var(--a-border)' }}
                  >
                    <Image src={url} alt="" fill className="object-cover" sizes="400px" />
                  </div>
                ))}
              </div>
            )}
            {selected.videoUrl && (
              <p className="break-all font-body text-xs" style={{ color: 'var(--a-gold)' }}>
                {selected.videoUrl}
              </p>
            )}

            <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--a-border)' }}>
              {selected.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => patch(selected.id, { status: 'APPROVED' as TestimonyStatus })}
                    className="rounded px-3 py-1.5 font-body text-xs font-semibold uppercase"
                    style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => patch(selected.id, { status: 'REJECTED' as TestimonyStatus })}
                    className="rounded border px-3 py-1.5 font-body text-xs"
                    style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-secondary)' }}
                  >
                    Reject
                  </button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => patch(selected.id, { isFeatured: !selected.isFeatured })}
                  className="rounded border px-3 py-1.5 font-body text-xs"
                  style={{ borderColor: 'var(--a-gold-border)', color: 'var(--a-gold)' }}
                >
                  {selected.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
              )}
              <button
                type="button"
                onClick={() => del(selected.id)}
                className="rounded border px-3 py-1.5 font-body text-xs"
                style={{ borderColor: 'var(--a-border)', color: 'var(--a-red)' }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
