'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { COUNTRIES, NIGERIA_STATES } from '@/lib/geo-data'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { FieldType, type JoinFormField } from '@prisma/client'
import { useEmailCheck } from '@/hooks/useEmailCheck'

const HERO_LINE_STYLES = ['text-outline', 'text-snow', 'text-crimson-gradient', 'text-snow', 'text-outline-gold']

function joinHeroLines(content: Record<string, string>) {
  const defaults = ['A MOVEMENT', 'OF YOUNG', 'BELIEVERS', 'ON FIRE', 'FOR JESUS.']
  return [1, 2, 3, 4, 5].map((n, i) => ({
    text: content[`join.hero.line${n}`] || defaults[i]!,
    style: HERO_LINE_STYLES[i]!,
  }))
}

function dropdownChoices(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((x) => String(x)).filter(Boolean)
  return []
}

function flattenJoinError(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Submission failed'
  const e = err as { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> }
  if (Array.isArray(e.formErrors) && e.formErrors.length > 0) return e.formErrors[0]!
  const vals = Object.values(e.fieldErrors ?? {})
  const first = vals.find((v) => v && v.length)
  return first?.[0] ?? 'Submission failed'
}

interface JoinPageClientProps {
  extraFields: JoinFormField[]
  whatsappUrl: string
  content: Record<string, string>
}

export function JoinPageClient({ extraFields, whatsappUrl, content }: JoinPageClientProps) {
  const movementLines = joinHeroLines(content)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    country: 'Nigeria',
    state: '',
    city: '',
  })
  const [extraValues, setExtraValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(3)

  const joinCheckUrl = useCallback(
    (email: string) => `/api/join/check-email?email=${encodeURIComponent(email)}`,
    [],
  )
  const { checking: checkingEmail, emailExists, checkEmail } = useEmailCheck({ checkUrl: joinCheckUrl })

  const isNigeria = form.country === 'Nigeria'

  useEffect(() => {
    if (!submitted || !whatsappUrl) return

    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          window.location.href = whatsappUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [submitted, whatsappUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (emailExists) {
      toast.error('This email is already registered with Room For You.')
      return
    }

    if (!form.name || !form.phone || !form.email || !form.country) {
      toast.error('Please fill in all required fields')
      return
    }
    if (isNigeria && !form.state) {
      toast.error('Please select your state')
      return
    }
    if (!isNigeria && !form.city) {
      toast.error('Please enter your city')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          extraFields: extraValues,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyRegistered) {
          toast.error('This email is already registered. Welcome back!')
        } else {
          toast.error(flattenJoinError(data.error) ?? 'Submission failed')
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    padding: '14px 16px',
    fontSize: '14px',
    fontFamily: 'General Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    marginBottom: '8px',
    fontFamily: 'General Sans, sans-serif',
  }

  function renderExtraField(field: JoinFormField) {
    const v = extraValues[field.id] ?? ''
    const set = (next: string) => setExtraValues((p) => ({ ...p, [field.id]: next }))
    const commonFocus = {
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        ;(e.target as HTMLInputElement).style.borderColor = '#8B0000'
      },
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        ;(e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'
      },
    }

    if (field.type === FieldType.LONG_TEXT) {
      return (
        <textarea
          value={v}
          onChange={(e) => set(e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
          {...commonFocus}
        />
      )
    }

    if (field.type === FieldType.DROPDOWN) {
      const choices = dropdownChoices(field.options)
      return (
        <select
          value={v}
          onChange={(e) => set(e.target.value)}
          required={field.required}
          style={{ ...inputStyle, cursor: 'pointer' }}
          {...commonFocus}
        >
          <option value="" style={{ background: '#1A1A1A' }}>
            {field.placeholder || 'Select…'}
          </option>
          {choices.map((opt) => (
            <option key={opt} value={opt} style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-primary)' }}>
              {opt}
            </option>
          ))}
        </select>
      )
    }

    const inputType =
      field.type === FieldType.EMAIL
        ? 'email'
        : field.type === FieldType.PHONE
          ? 'tel'
          : field.type === FieldType.NUMBER
            ? 'number'
            : 'text'

    return (
      <input
        type={inputType}
        value={v}
        onChange={(e) => set(e.target.value)}
        placeholder={field.placeholder ?? ''}
        required={field.required}
        style={inputStyle}
        {...commonFocus}
      />
    )
  }

  return (
    <main className="min-h-screen bg-void">
      <div className="flex flex-col lg:flex-row min-h-screen pt-24 lg:pt-36">
        <div className="relative lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-20 lg:py-0 overflow-hidden">
          <div
            className="absolute pointer-events-none"
            style={{
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,0,0,0.06) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="label-text mb-10"
            >
              Room For You
            </motion.p>

            <div className="space-y-1 mb-12">
              {movementLines.map((line, i) => (
                <motion.h1
                  key={i}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 + i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`font-display font-bold leading-none ${line.style}`}
                  style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}
                >
                  {line.text}
                </motion.h1>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              <div className="gold-line-left w-16 mb-6 opacity-50" />
              <p className="font-body text-mist text-base leading-relaxed max-w-sm">
                Join a community of young men and women singing songs of salvation, studying the Word, praying, and
                getting others saved.
                <span className="text-crimson"> Jesus to Nations.</span>
              </p>
            </motion.div>
          </div>
        </div>

        <div
          className="lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-12 lg:py-0"
          style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        >
          {!submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-md w-full mx-auto"
            >
              <p className="label-text mb-3">Join the Community</p>
              <h2 className="font-display text-3xl text-snow mb-2">There is room for you.</h2>
              <p className="font-body text-mist text-sm mb-10">Fill in your details below. It takes less than a minute.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+234..."
                    required
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        const v = e.target.value
                        setForm((p) => ({ ...p, email: v }))
                        checkEmail(v)
                      }}
                      onBlur={() => checkEmail(form.email)}
                      placeholder="your@email.com"
                      required
                      style={{
                        ...inputStyle,
                        paddingRight: checkingEmail ? 40 : 16,
                        borderColor: emailExists ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)',
                      }}
                      onFocus={(e) => {
                        if (!emailExists) e.target.style.borderColor = '#8B0000'
                      }}
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div
                          className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: 'rgba(139,0,0,0.4)', borderTopColor: 'transparent' }}
                        />
                      </div>
                    )}
                  </div>
                  {emailExists && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 mt-2 px-3 py-2"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                      <span className="text-red-400 text-sm shrink-0">⚠</span>
                      <p className="font-body text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
                        This email is already registered with Room For You. You are already part of the community!
                      </p>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Country *</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((p) => ({ ...p, country: e.target.value, state: '', city: '' }))}
                    required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name} style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-primary)' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {isNigeria && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label style={labelStyle}>State *</label>
                    <select
                      value={form.state}
                      onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                      required
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    >
                      <option value="" style={{ background: '#1A1A1A' }}>
                        Select your state
                      </option>
                      {NIGERIA_STATES.map((s) => (
                        <option key={s} value={s} style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-primary)' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {!isNigeria && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <label style={labelStyle}>City *</label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Your city"
                      required
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#8B0000')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                    />
                  </motion.div>
                )}

                {extraFields.map((field) => (
                  <div key={field.id}>
                    <label style={labelStyle}>
                      {field.label}
                      {field.required ? ' *' : ''}
                    </label>
                    {renderExtraField(field)}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={submitting || emailExists}
                  className="w-full py-4 font-body font-semibold text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                  style={{ background: 'var(--color-accent)', color: '#FAF7F2' }}
                >
                  {submitting ? 'Joining…' : 'Join the Community →'}
                </button>

                <p className="font-body text-xs text-center" style={{ color: '#585858' }}>
                  By joining, you agree to receive emails from Room For You. You can unsubscribe at any time.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full mx-auto text-center"
            >
              <div
                className="w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto mb-8"
                style={{ borderColor: '#8B0000' }}
              >
                <span className="text-crimson text-3xl">✓</span>
              </div>

              <div className="gold-line max-w-[60px] mx-auto mb-8 opacity-40" />

              <h2 className="font-display text-4xl text-snow mb-4">You&apos;re in.</h2>
              <p className="font-body text-mist leading-relaxed mb-6">
                Welcome to Room For You. Check your email for your confirmation.
                <span className="text-crimson"> There is room for you here.</span>
              </p>

              {whatsappUrl ? (
                <div className="mb-8">
                  <div
                    className="inline-flex flex-col items-center gap-3 px-8 py-5 border"
                    style={{ borderColor: 'rgba(139,0,0,0.3)', background: 'rgba(139,0,0,0.05)' }}
                  >
                    <p className="font-body text-mist text-sm">Joining our WhatsApp community in</p>
                    <p className="font-display text-crimson text-5xl font-bold">{countdown}</p>
                    <p className="font-body text-mist text-xs opacity-60">seconds</p>
                  </div>
                  <p className="font-body text-xs mt-4" style={{ color: '#585858' }}>
                    Not redirected?{' '}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-crimson hover:opacity-70 transition-opacity underline"
                    >
                      Click here to join →
                    </a>
                  </p>
                </div>
              ) : (
                <div className="mb-8">
                  <p className="font-body text-mist text-sm">Your confirmation email is on its way.</p>
                </div>
              )}

              <Link
                href="/"
                className="font-body text-sm tracking-widest uppercase"
                style={{ color: 'rgba(248,248,248,0.4)' }}
              >
                ← Back to Home
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  )
}
