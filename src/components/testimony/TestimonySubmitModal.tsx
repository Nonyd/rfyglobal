'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { UploadZone } from '@/components/shared/UploadZone'
import { Toggle } from '@/components/shared/Toggle'

interface TestimonySubmitModalProps {
  isOpen: boolean
  onClose: () => void
}

function messageFromApiError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const e = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
    if (e.formErrors?.length) return e.formErrors[0]
    const firstField = Object.values(e.fieldErrors ?? {}).flat()[0]
    if (firstField) return firstField
  }
  return 'Submission failed'
}

export function TestimonySubmitModal({ isOpen, onClose }: TestimonySubmitModalProps) {
  const [form, setForm] = useState({
    email: '',
    name: '',
    phone: '',
    location: '',
    title: '',
    body: '',
    videoUrl: '',
    isAnonymous: false,
  })
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notMember, setNotMember] = useState(false)

  const uploadExtra = useMemo(() => ({ email: form.email.trim() }), [form.email])

  useEffect(() => {
    if (!isOpen) return
    setNotMember(false)
  }, [isOpen])

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setForm({
        email: '',
        name: '',
        phone: '',
        location: '',
        title: '',
        body: '',
        videoUrl: '',
        isAnonymous: false,
      })
      setImageUrls([])
      setNotMember(false)
    }, 300)
  }

  const onImagesUploaded = useCallback((files: { url: string }[]) => {
    setImageUrls((prev) => {
      const next = [...prev, ...files.map((f) => f.url)]
      return next.slice(0, 5)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotMember(false)
    if (!form.email.trim() || !form.title.trim() || !form.phone.trim() || !form.location.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/testimony', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim() || undefined,
          phone: form.phone.trim(),
          location: form.location.trim(),
          isAnonymous: form.isAnonymous,
          title: form.title.trim(),
          body: form.body.trim() || undefined,
          imageUrls: imageUrls.length ? imageUrls : undefined,
          videoUrl: form.videoUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.notMember) {
          setNotMember(true)
          return
        }
        toast.error(messageFromApiError(data.error))
        return
      }
      setSubmitted(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#F8F8F8',
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: 'General Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: '#A0A0A0',
    marginBottom: '6px',
    fontFamily: 'General Sans, sans-serif',
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
              style={{ background: '#0F0F0F', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {!submitted ? (
                <div className="p-8">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <p className="label-text mb-2">Share a testimony</p>
                      <h2 className="font-display text-xl font-bold leading-tight text-snow">
                        What God has done for you
                      </h2>
                      <p className="mt-1 font-body text-sm text-mist">
                        Submissions are reviewed before appearing on the public page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="ml-4 mt-1 shrink-0 text-mist transition-colors hover:text-snow"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="gold-line mb-8 opacity-30" />

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label style={labelStyle}>Community Member Email *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, email: e.target.value }))
                          setNotMember(false)
                        }}
                        placeholder="your@email.com"
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                      <p className="mt-1 font-body text-xs" style={{ color: '#585858' }}>
                        Must match the email you used to join Room For You.
                      </p>
                    </div>

                    <AnimatePresence>
                      {notMember && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-start gap-3 border p-4"
                          style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}
                        >
                          <span className="mt-0.5 shrink-0 text-red-400">⚠</span>
                          <div>
                            <p className="font-body text-sm" style={{ color: '#FCA5A5' }}>
                              This email is not registered with Room For You.
                            </p>
                            <p className="mt-1 font-body text-xs" style={{ color: 'rgba(252,165,165,0.7)' }}>
                              Please{' '}
                              <Link href="/join" className="underline" style={{ color: '#C9A84C' }}>
                                join the community
                              </Link>{' '}
                              first — it only takes a minute.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Toggle
                      checked={form.isAnonymous}
                      onChange={(val) => setForm((p) => ({ ...p, isAnonymous: val }))}
                      label="Submit anonymously on the public page"
                    />

                    {!form.isAnonymous && (
                      <div>
                        <label style={labelStyle}>Your name</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Optional — defaults to your member name"
                          style={inputStyle}
                          onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                          onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                        />
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+234..."
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Location (City, Country) *</label>
                      <input
                        required
                        value={form.location}
                        onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                        placeholder="e.g. Abuja, Nigeria"
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Title *</label>
                      <input
                        required
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="A short headline"
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Story</label>
                      <textarea
                        value={form.body}
                        onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                        rows={5}
                        placeholder="Tell your story (optional if you add photos or video)"
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Photos (up to 5)</label>
                      {!emailOk ? (
                        <p className="font-body text-xs text-mist">Enter your member email above to enable uploads.</p>
                      ) : (
                        <UploadZone
                          folder="testimony"
                          maxFiles={5 - imageUrls.length}
                          accept="image"
                          label="Drop images here or click to browse"
                          preview
                          uploadEndpoint="/api/testimony/upload"
                          uploadExtra={uploadExtra}
                          onPartialComplete={(result) => {
                            if (result.failed.length) {
                              toast.error(
                                `${result.failed.length} file(s) failed. Check size (max 10MB) and try again.`,
                              )
                            }
                          }}
                          onUploadComplete={(files) => onImagesUploaded(files)}
                        />
                      )}
                      {imageUrls.length > 0 && (
                        <p className="mt-2 font-body text-[11px]" style={{ color: '#585858' }}>
                          {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''} attached
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={labelStyle}>Video URL</label>
                      <input
                        value={form.videoUrl}
                        onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                        placeholder="YouTube, Vimeo, or direct link"
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || notMember}
                      className="mt-2 w-full py-4 font-body text-xs font-semibold uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                      style={{ background: '#C9A84C', color: '#0F0F0F' }}
                    >
                      {submitting ? 'Submitting…' : 'Submit for review →'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div
                    className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2"
                    style={{ borderColor: '#C9A84C' }}
                  >
                    <CheckCircle size={28} className="text-gold" />
                  </div>
                  <div className="gold-line mx-auto mb-6 max-w-[60px] opacity-40" />
                  <h2 className="font-display mb-3 text-3xl font-bold text-snow">Thank you</h2>
                  <p className="mb-8 font-body text-sm leading-relaxed text-mist">
                    Your testimony has been received. The team will review it before publishing.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="border px-8 py-3 font-body text-xs uppercase tracking-widest transition-all"
                    style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C' }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
