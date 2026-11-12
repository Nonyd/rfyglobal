'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, ExternalLink, MessageCircle, Pencil, Trash2, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/admin-fetch'
import { AdminToggle } from '@/components/shared/Toggle'
import {
  AUDIO_CHUNK_BYTES,
  AUDIO_MAX_BYTES,
  AUDIO_TYPES,
  formatBytes,
  isAcceptedAudio,
  titleFromFileName,
} from '@/lib/audio-media'

type AudioTrack = {
  id: string
  slug: string
  title: string
  description: string | null
  url: string
  originalName: string
  mimeType: string
  bytes: number
  isPublished: boolean
  plays: number
  createdAt: string
}

const ACCEPT = ['audio/*', ...Object.keys(AUDIO_TYPES)].join(',')

const inputStyle = {
  background: 'var(--a-bg)',
  borderColor: 'var(--a-border)',
  color: 'var(--a-text)',
} as const

function newUploadId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function shareUrl(slug: string): string {
  return `${window.location.origin}/listen/${slug}`
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Link copied')
  } catch {
    window.prompt('Copy this link:', text)
  }
}

/** Sends the file in order, one chunk per request, retrying each chunk a few times. */
async function uploadInChunks(
  file: File,
  meta: { title: string; description: string },
  onProgress: (fraction: number) => void,
): Promise<AudioTrack> {
  const uploadId = newUploadId()
  let offset = 0
  let failures = 0

  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + AUDIO_CHUNK_BYTES, file.size))
    const form = new FormData()
    form.set('uploadId', uploadId)
    form.set('fileName', file.name)
    form.set('offset', String(offset))
    form.set('totalBytes', String(file.size))
    form.set('title', meta.title)
    form.set('description', meta.description)
    form.set('chunk', chunk, 'chunk')

    let res: Response
    try {
      res = await adminFetch('/api/admin/media/upload', { method: 'POST', body: form })
    } catch {
      if (++failures > 4) throw new Error('Network error. Check your connection and try again.')
      await new Promise((r) => setTimeout(r, 1500 * failures))
      continue
    }

    const data = (await res.json().catch(() => ({}))) as {
      error?: string
      expectedOffset?: number
      done?: boolean
      received?: number
      track?: AudioTrack
    }

    if (res.status === 409 && typeof data.expectedOffset === 'number') {
      if (++failures > 4) throw new Error(data.error ?? 'Upload kept getting out of sync')
      offset = data.expectedOffset
      continue
    }
    if (!res.ok) {
      if (res.status >= 500 && ++failures <= 4) {
        await new Promise((r) => setTimeout(r, 1500 * failures))
        continue
      }
      throw new Error(data.error ?? `Upload failed (${res.status})`)
    }

    failures = 0
    offset = data.received ?? offset + chunk.size
    onProgress(offset / file.size)
    if (data.done && data.track) return data.track
  }

  throw new Error('Upload finished without a response from the server')
}

export function MediaManager() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [loading, setLoading] = useState(true)

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState({ title: '', description: '' })

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/media')
      if (!res.ok) throw new Error()
      setTracks((await res.json()) as AudioTrack[])
    } catch {
      toast.error('Could not load media')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const pickFile = (f: File | undefined | null) => {
    if (!f) return
    if (!isAcceptedAudio(f.name)) {
      toast.error('That file type is not supported. Use MP3, M4A, WAV, AAC, OGG, OPUS, FLAC and similar.')
      return
    }
    if (f.size > AUDIO_MAX_BYTES) {
      toast.error('File is larger than 1 GB')
      return
    }
    setFile(f)
    setTitle((t) => t || titleFromFileName(f.name))
  }

  const resetForm = () => {
    setFile(null)
    setTitle('')
    setDescription('')
    setProgress(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const startUpload = async () => {
    if (!file || progress !== null) return
    setProgress(0)
    try {
      const track = await uploadInChunks(file, { title, description }, setProgress)
      setTracks((prev) => [track, ...prev])
      resetForm()
      toast.success('Uploaded. Copy the link to share it.')
      void copyText(shareUrl(track.slug))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setProgress(null)
    }
  }

  const update = async (id: string, data: Partial<Pick<AudioTrack, 'title' | 'description' | 'isPublished'>>) => {
    const res = await adminFetch(`/api/admin/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      toast.error('Failed to save')
      return false
    }
    const updated = (await res.json()) as AudioTrack
    setTracks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return true
  }

  const remove = async (track: AudioTrack) => {
    if (!confirm(`Delete "${track.title}"? The file is removed and its share link stops working.`)) return
    const res = await adminFetch(`/api/admin/media/${track.id}`, { method: 'DELETE' })
    if (!res.ok) return toast.error('Failed to delete')
    setTracks((prev) => prev.filter((t) => t.id !== track.id))
    toast.success('Deleted')
  }

  const uploading = progress !== null

  return (
    <div className="space-y-8">
      {/* Upload */}
      <section className="border p-5" style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}>
        <h2 className="font-display text-lg font-semibold mb-4" style={{ color: 'var(--a-text)' }}>
          Upload audio
        </h2>

        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileInput.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (!uploading) pickFile(e.dataTransfer.files?.[0])
          }}
          className="flex flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center cursor-pointer transition-colors"
          style={{
            borderColor: dragOver ? 'var(--a-gold)' : 'var(--a-border)',
            background: dragOver ? 'var(--a-gold-light)' : 'transparent',
          }}
        >
          <Upload size={22} style={{ color: 'var(--a-gold)' }} />
          {file ? (
            <p className="font-body text-sm" style={{ color: 'var(--a-text)' }}>
              {file.name} <span style={{ color: 'var(--a-text-muted)' }}>· {formatBytes(file.size)}</span>
            </p>
          ) : (
            <p className="font-body text-sm" style={{ color: 'var(--a-text)' }}>
              Drop an audio file here or click to choose
            </p>
          )}
          <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
            MP3, M4A, WAV, AAC, OGG, OPUS, FLAC, WEBM, AIFF, AMR, WMA · up to 1 GB
          </p>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>

        {file && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block font-body text-xs mb-1" style={{ color: 'var(--a-text-muted)' }}>
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={uploading}
                className="w-full px-3 py-2 text-sm font-body border"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block font-body text-xs mb-1" style={{ color: 'var(--a-text-muted)' }}>
                Description (optional, shown on the listen page)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={5000}
                disabled={uploading}
                className="w-full px-3 py-2 text-sm font-body border"
                style={inputStyle}
              />
            </div>

            {uploading && (
              <div>
                <div className="h-2 w-full overflow-hidden" style={{ background: 'var(--a-border)' }}>
                  <div
                    className="h-full transition-all"
                    style={{ width: `${Math.round((progress ?? 0) * 100)}%`, background: 'var(--a-gold)' }}
                  />
                </div>
                <p className="font-body text-xs mt-1" style={{ color: 'var(--a-text-muted)' }}>
                  Uploading… {Math.round((progress ?? 0) * 100)}% · keep this tab open
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => void startUpload()}
                disabled={uploading || !title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-body font-medium disabled:opacity-50"
                style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
              >
                <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload'}
              </button>
              {!uploading && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-body border"
                  style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Library */}
      <section>
        <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--a-text-muted)' }}>
          Library · {tracks.length}
        </p>

        {loading ? (
          <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
            Loading…
          </p>
        ) : tracks.length === 0 ? (
          <div className="flex items-center justify-center h-32 border border-dashed" style={{ borderColor: 'var(--a-border)' }}>
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              No audio yet. Upload your first file above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => {
              const link = typeof window !== 'undefined' ? shareUrl(track.slug) : `/listen/${track.slug}`
              const editing = editId === track.id
              return (
                <div
                  key={track.id}
                  className="border p-4"
                  style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)', opacity: track.isPublished ? 1 : 0.7 }}
                >
                  {editing ? (
                    <div className="space-y-2 mb-3">
                      <input
                        value={edit.title}
                        onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))}
                        maxLength={200}
                        className="w-full px-3 py-2 text-sm font-body border"
                        style={inputStyle}
                        autoFocus
                      />
                      <textarea
                        value={edit.description}
                        onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
                        rows={3}
                        maxLength={5000}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 text-sm font-body border"
                        style={inputStyle}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (await update(track.id, edit)) {
                              setEditId(null)
                              toast.success('Saved')
                            }
                          }}
                          disabled={!edit.title.trim()}
                          className="px-3 py-1.5 text-xs font-body font-medium disabled:opacity-50"
                          style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="px-3 py-1.5 text-xs font-body border"
                          style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-body text-sm font-medium truncate" style={{ color: 'var(--a-text)' }}>
                          {track.title}
                        </p>
                        <p className="font-body text-xs mt-0.5" style={{ color: 'var(--a-text-muted)' }}>
                          {formatBytes(track.bytes)} · {new Date(track.createdAt).toLocaleDateString()} · {track.plays}{' '}
                          {track.plays === 1 ? 'play' : 'plays'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                          {track.isPublished ? 'Link on' : 'Link off'}
                          <AdminToggle
                            checked={track.isPublished}
                            onChange={(val) => void update(track.id, { isPublished: val })}
                            size="sm"
                            aria-label="Share link enabled"
                          />
                        </label>
                        <button
                          onClick={() => {
                            setEditId(track.id)
                            setEdit({ title: track.title, description: track.description ?? '' })
                          }}
                          className="p-1"
                          style={{ color: 'var(--a-text-muted)' }}
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => void remove(track)} className="p-1" style={{ color: 'var(--a-text-muted)' }} aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <audio controls preload="none" src={track.url} className="w-full mb-3" />

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      readOnly
                      value={link}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-[200px] px-3 py-1.5 text-xs font-body border"
                      style={inputStyle}
                    />
                    <button
                      onClick={() => void copyText(link)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-body font-medium"
                      style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
                    >
                      <Copy size={12} /> Copy link
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${track.title}\n${link}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-body border"
                      style={{ borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-body border"
                      style={{ borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    >
                      <ExternalLink size={12} /> Open
                    </a>
                  </div>
                  {!track.isPublished && (
                    <p className="flex items-center gap-1 font-body text-xs mt-2" style={{ color: 'var(--a-text-muted)' }}>
                      <X size={11} /> Link is off: visitors see “not available” until you turn it back on.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
