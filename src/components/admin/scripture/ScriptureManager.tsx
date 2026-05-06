'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Volume2, Calendar, Shuffle, X } from 'lucide-react'
import { UploadZone } from '@/components/shared/UploadZone'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Scripture } from '@prisma/client'

const TRANSLATIONS = ['KJV', 'NIV', 'ESV', 'NKJV', 'AMP', 'NLT']

interface ScriptureManagerProps {
  initialScriptures: Scripture[]
}

export function ScriptureManager({ initialScriptures }: ScriptureManagerProps) {
  const [scriptures, setScriptures] = useState(initialScriptures)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Scripture | null>(null)
  const [saving, setSaving] = useState(false)

  const [reference, setReference] = useState('')
  const [translation, setTranslation] = useState('KJV')
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [scheduleType, setScheduleType] = useState<'DATE' | 'RANDOM'>('RANDOM')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isActive, setIsActive] = useState(true)

  const openNew = () => {
    setEditing(null)
    setReference('')
    setTranslation('KJV')
    setText('')
    setAudioUrl('')
    setScheduleType('RANDOM')
    setScheduledAt('')
    setIsActive(true)
    setPanelOpen(true)
  }

  const openEdit = (s: Scripture) => {
    setEditing(s)
    setReference(s.reference)
    setTranslation(s.translation)
    setText(s.text)
    setAudioUrl(s.audioUrl ?? '')
    setScheduleType(s.scheduledAt ? 'DATE' : 'RANDOM')
    setScheduledAt(s.scheduledAt ? new Date(s.scheduledAt).toISOString().split('T')[0] : '')
    setIsActive(s.isActive)
    setPanelOpen(true)
  }

  const handleSave = async () => {
    if (!reference.trim()) {
      toast.error('Reference is required')
      return
    }
    if (!text.trim()) {
      toast.error('Scripture text is required')
      return
    }
    if (scheduleType === 'DATE' && !scheduledAt) {
      toast.error('Please select a date')
      return
    }

    setSaving(true)
    try {
      const payload = {
        reference: reference.trim(),
        translation,
        text: text.trim(),
        audioUrl: audioUrl || '',
        scheduledAt: scheduleType === 'DATE' ? new Date(scheduledAt).toISOString() : '',
        isActive,
      }

      const url = editing ? `/api/scripture/${editing.id}` : '/api/scripture'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save scripture')

      const saved = (await res.json()) as Scripture

      if (editing) {
        setScriptures((prev) => prev.map((s) => (s.id === saved.id ? saved : s)))
        toast.success('Scripture updated')
      } else {
        setScriptures((prev) => [saved, ...prev])
        toast.success('Scripture added')
      }

      setPanelOpen(false)
    } catch {
      toast.error('Failed to save scripture')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scripture?')) return
    const res = await fetch(`/api/scripture/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setScriptures((prev) => prev.filter((s) => s.id !== id))
      toast.success('Scripture deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  const toggleActive = async (s: Scripture) => {
    const res = await fetch(`/api/scripture/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !s.isActive }),
    })
    if (res.ok) {
      setScriptures((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x)),
      )
    }
  }

  return (
    <div className="relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>Daily Scripture</h2>
          <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            One scripture + audio displayed per day · {scriptures.length} total
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 bg-gold px-5 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <Plus size={16} /> Add Scripture
        </button>
      </div>

      {scriptures.length === 0 ? (
        <div
          className="border border-dashed py-24 text-center"
          style={{ borderColor: 'var(--a-gold-border)' }}
        >
          <p className="font-display text-2xl italic" style={{ color: 'var(--a-text-muted)' }}>No scriptures yet</p>
          <p className="mt-2 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>Add your first scripture to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scriptures.map((s) => (
            <div
              key={s.id}
              className={cn(
                'border p-5 transition-all',
                s.isActive ? '' : 'opacity-60',
              )}
              style={{
                borderColor: s.isActive ? 'var(--a-gold-border)' : 'var(--a-border)',
                background: s.isActive ? 'var(--a-gold-light)' : 'var(--a-surface)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg font-semibold" style={{ color: 'var(--a-gold)' }}>{s.reference}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase"
                      style={{
                        background: 'var(--a-gold-light)',
                        color: 'var(--a-text-muted)',
                        border: '1px solid var(--a-gold-border)',
                      }}
                    >
                      {s.translation}
                    </span>
                    {s.audioUrl ? (
                      <span className="flex items-center gap-1 font-body text-[10px]" style={{ color: 'var(--a-gold)' }}>
                        <Volume2 size={10} /> Audio
                      </span>
                    ) : null}
                  </div>
                  <p className="mb-2 line-clamp-2 font-body text-sm italic" style={{ color: 'var(--a-text-secondary)' }}>
                    &ldquo;{s.text.slice(0, 120)}
                    {s.text.length > 120 ? '…' : ''}&rdquo;
                  </p>
                  <div className="flex items-center gap-1 font-body text-xs">
                    {s.scheduledAt ? (
                      <>
                        <Calendar size={11} style={{ color: 'var(--a-gold)' }} />
                        <span style={{ color: 'var(--a-text-muted)' }}>Scheduled: {formatDate(s.scheduledAt)}</span>
                      </>
                    ) : (
                      <>
                        <Shuffle size={11} style={{ color: 'var(--a-text-muted)' }} />
                        <span style={{ color: 'var(--a-text-muted)' }}>Random Pool</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(s)}
                    className="relative h-5 w-9 rounded-full transition-colors"
                    style={{
                      background: s.isActive ? 'var(--a-gold)' : 'var(--a-border-strong)',
                    }}
                    aria-label={s.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full transition-transform',
                        s.isActive ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                      style={{
                        background: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                    aria-label="Edit"
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-gold)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                    aria-label="Delete"
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {panelOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-lg overflow-y-auto"
              style={{
                background: 'var(--a-surface)',
                borderLeft: '1px solid var(--a-border)',
                boxShadow: 'var(--a-shadow-md)',
              }}
            >
              <div className="space-y-6 p-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
                    {editing ? 'Edit Scripture' : 'Add Scripture'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="transition-colors"
                    style={{ color: 'var(--a-text-muted)' }}
                    aria-label="Close panel"
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="h-px" style={{ background: 'var(--a-border)' }} />

                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                    Scripture Reference *
                  </label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. John 3:16"
                    className="w-full border px-4 py-3 font-body text-sm transition-colors focus:outline-none"
                    style={{
                      background: 'var(--a-bg)',
                      borderColor: 'var(--a-border)',
                      color: 'var(--a-text)',
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                    Translation
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRANSLATIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTranslation(t)}
                        className={cn(
                          'border px-3 py-1.5 font-body text-xs transition-colors',
                          translation === t
                            ? ''
                            : '',
                        )}
                        style={
                          translation === t
                            ? {
                                borderColor: 'var(--a-gold)',
                                background: 'var(--a-gold-light)',
                                color: 'var(--a-gold)',
                              }
                            : { borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                    Scripture Text *
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste the scripture text here…"
                    rows={6}
                    className="w-full resize-none border px-4 py-3 font-body text-sm leading-relaxed transition-colors focus:outline-none"
                    style={{
                      background: 'var(--a-bg)',
                      borderColor: 'var(--a-border)',
                      color: 'var(--a-text)',
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                    Audio Explanation (MP3)
                  </label>
                  {audioUrl ? (
                    <div className="flex items-center gap-3 border p-3" style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}>
                      <Volume2 size={16} className="shrink-0" style={{ color: 'var(--a-gold)' }} />
                      <span className="flex-1 truncate font-body text-sm" style={{ color: 'var(--a-gold)' }}>
                        Audio uploaded
                      </span>
                      <button
                        type="button"
                        onClick={() => setAudioUrl('')}
                        className="transition-colors"
                        style={{ color: 'var(--a-text-muted)' }}
                        aria-label="Remove audio"
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <UploadZone
                      folder="scriptureAudio"
                      accept="audio"
                      resourceType="raw"
                      label="Upload audio explanation (MP3, max 32MB)"
                      onUploadComplete={(files) => {
                        if (files[0]?.url) setAudioUrl(files[0].url)
                        toast.success('Audio uploaded')
                      }}
                      onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
                    />
                  )}
                </div>

                <div>
                  <label className="mb-3 block font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                    Display Schedule
                  </label>
                  <div className="mb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType('RANDOM')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 border py-2.5 font-body text-sm transition-all',
                        scheduleType === 'RANDOM'
                          ? ''
                          : '',
                      )}
                      style={
                        scheduleType === 'RANDOM'
                          ? {
                              borderColor: 'var(--a-gold)',
                              background: 'var(--a-gold-light)',
                              color: 'var(--a-gold)',
                            }
                          : { borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }
                      }
                    >
                      <Shuffle size={14} /> Random Pool
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('DATE')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-2 border py-2.5 font-body text-sm transition-all',
                        scheduleType === 'DATE'
                          ? ''
                          : '',
                      )}
                      style={
                        scheduleType === 'DATE'
                          ? {
                              borderColor: 'var(--a-gold)',
                              background: 'var(--a-gold-light)',
                              color: 'var(--a-gold)',
                            }
                          : { borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }
                      }
                    >
                      <Calendar size={14} /> Specific Date
                    </button>
                  </div>

                  {scheduleType === 'DATE' ? (
                    <input
                      type="date"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full border px-4 py-3 font-body text-sm transition-colors focus:outline-none"
                      style={{
                        background: 'var(--a-bg)',
                        borderColor: 'var(--a-border)',
                        color: 'var(--a-text)',
                      }}
                    />
                  ) : (
                    <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--a-text-muted)' }}>
                      This scripture will be randomly selected on days when no scripture is specifically
                      scheduled.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="relative h-5 w-10 rounded-full transition-colors"
                    style={{
                      background: isActive ? 'var(--a-gold)' : 'var(--a-border-strong)',
                    }}
                    aria-label="Toggle active"
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full transition-transform',
                        isActive ? 'translate-x-5' : 'translate-x-0.5',
                      )}
                      style={{
                        background: '#FFFFFF',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                  <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>{isActive ? 'Active' : 'Inactive'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="w-full py-3 font-body text-sm font-medium uppercase tracking-widest transition-colors disabled:opacity-40"
                  style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
                >
                  {saving ? 'Saving…' : editing ? 'Update Scripture' : 'Add Scripture'}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
