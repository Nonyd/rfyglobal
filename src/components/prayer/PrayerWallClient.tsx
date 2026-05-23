'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Toggle } from '@/components/shared/Toggle'

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

export function PrayerWallClient() {
  const [form, setForm] = useState({
    email: '',
    name: '',
    subject: '',
    body: '',
    isAnonymous: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notMember, setNotMember] = useState(false)

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#F8F8F8',
    padding: '14px 16px',
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
    marginBottom: '8px',
    fontFamily: 'General Sans, sans-serif',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotMember(false)

    if (!form.email || !form.subject || !form.body) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/prayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.notMember) {
          setNotMember(true)
        } else {
          toast.error(messageFromApiError(data.error))
        }
        return
      }

      setSubmitted(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-6"
          style={{ borderColor: '#8B0000' }}
        >
          <span className="text-crimson text-2xl">🙏</span>
        </div>
        <div className="gold-line max-w-[60px] mx-auto mb-6 opacity-30" />
        <h2 className="font-display text-snow text-3xl font-bold mb-3">Received.</h2>
        <p className="font-body text-mist leading-relaxed max-w-md mx-auto">
          Your prayer request has been received. Minister Yadah and the prayer team will be lifting you up in prayer.
          <span className="text-crimson"> Jesus cares about what concerns you.</span>
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label style={labelStyle}>Email Address *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => {
            setForm((p) => ({ ...p, email: e.target.value }))
            setNotMember(false)
          }}
          placeholder="your@email.com"
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        <p className="font-body text-xs mt-1" style={{ color: '#585858' }}>
          Must be the email you used to join the community.
        </p>
      </div>

      <AnimatePresence>
        {notMember && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 border"
            style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}
          >
            <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
            <div>
              <p className="font-body text-sm" style={{ color: '#FCA5A5' }}>
                This email is not registered with Room For You.
              </p>
              <p className="font-body text-xs mt-1" style={{ color: 'rgba(252,165,165,0.7)' }}>
                Please{' '}
                <Link href="/join" className="underline" style={{ color: '#8B0000' }}>
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
        label={"Submit anonymously (your name won\u2019t be shown to the team)"}
      />

      {!form.isAnonymous && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label style={labelStyle}>Your Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your full name"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
          />
        </motion.div>
      )}

      <div>
        <label style={labelStyle}>Prayer Topic *</label>
        <input
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          placeholder="e.g. Healing, Provision, Guidance..."
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      </div>

      <div>
        <label style={labelStyle}>Your Prayer Request *</label>
        <textarea
          value={form.body}
          onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
          placeholder="Share what you need prayer for..."
          required
          rows={6}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
        <p
          className="font-body text-xs mt-1 text-right"
          style={{ color: form.body.length > 1800 ? '#F87171' : '#585858' }}
        >
          {form.body.length}/2000
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 font-body font-semibold text-xs tracking-widest uppercase transition-all disabled:opacity-40"
        style={{ background: '#8B0000', color: '#0F0F0F' }}
      >
        {submitting ? 'Submitting…' : 'Submit Prayer Request →'}
      </button>

      <p className="font-body text-xs text-center" style={{ color: '#585858' }}>
        🔒 Your request is completely private — only the prayer team will see it.
      </p>
    </form>
  )
}
