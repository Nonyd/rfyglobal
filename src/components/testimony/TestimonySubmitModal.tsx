'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { UploadZone } from '@/components/shared/UploadZone'
import { FormSuccessPanel } from '@/components/shared/FormSuccessPanel'
import { RedirectCountdownBanner } from '@/components/shared/RedirectCountdownBanner'
import { Toggle } from '@/components/shared/Toggle'
import { useRedirectCountdown } from '@/hooks/useRedirectCountdown'

const JOIN_REDIRECT_URL = 'https://rfyglobal.org/join'
const JOIN_REDIRECT_SECONDS = 3

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
    edition: '',
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
  const [isNewVisitor, setIsNewVisitor] = useState(false)

  const {
    redirectCountdown,
    pendingRedirectUrl,
    startRedirect,
    resetRedirect,
    isRedirecting,
    totalSeconds,
  } = useRedirectCountdown(JOIN_REDIRECT_SECONDS)

  const uploadExtra = useMemo(() => ({ email: form.email.trim() }), [form.email])

  const handleClose = () => {
    resetRedirect()
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setIsNewVisitor(false)
      setForm({
        email: '',
        name: '',
        edition: '',
        phone: '',
        location: '',
        title: '',
        body: '',
        videoUrl: '',
        isAnonymous: false,
      })
      setImageUrls([])
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
          edition: form.edition.trim() || undefined,
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
        toast.error(messageFromApiError(data.error))
        return
      }
      const visitor = Boolean(data.isNewVisitor)
      setIsNewVisitor(visitor)
      setSubmitted(true)
      if (visitor) {
        startRedirect(JOIN_REDIRECT_URL)
      }
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
              className="dark-surface max-h-[90vh] w-full max-w-lg overflow-y-auto"
              style={{ background: '#0F0F0F', border: '1px solid rgba(139,0,0,0.2)' }}
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
                      <label style={labelStyle}>Email *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

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
                          placeholder="Optional"
                          style={inputStyle}
                          onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
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
                        onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
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
                        onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Room For You Edition
                        <span
                          style={{
                            color: '#585858',
                            fontSize: '0.75rem',
                            marginLeft: '0.5rem',
                            letterSpacing: '0.05em',
                            textTransform: 'none',
                          }}
                        >
                          (optional)
                        </span>
                      </label>
                      <input
                        value={form.edition}
                        onChange={(e) => setForm((p) => ({ ...p, edition: e.target.value }))}
                        placeholder="e.g. April 2024 Edition"
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
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
                        onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
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
                        onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Photos (up to 5)</label>
                      {!emailOk ? (
                        <p className="font-body text-xs text-mist">Enter your email above to enable uploads.</p>
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
                        onFocus={(ev) => (ev.target.style.borderColor = '#8B0000')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-crimson-solid mt-2 w-full py-4 font-body text-xs font-semibold uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting…' : 'Submit for review →'}
                    </button>
                  </form>
                </div>
              ) : (
                <FormSuccessPanel
                  title="Thank you"
                  message={
                    isNewVisitor
                      ? 'Thank you for sharing! Your testimony has been received. We would love to have you in the community.'
                      : 'Your testimony has been received. The team will review it before publishing.'
                  }
                  onClose={isRedirecting ? undefined : handleClose}
                >
                  {isNewVisitor && isRedirecting && redirectCountdown !== null && pendingRedirectUrl ? (
                    <RedirectCountdownBanner
                      redirectCountdown={redirectCountdown}
                      pendingRedirectUrl={pendingRedirectUrl}
                      totalSeconds={totalSeconds}
                    />
                  ) : null}
                </FormSuccessPanel>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
