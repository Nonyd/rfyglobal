'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { EventFormField } from '@prisma/client'

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  eventSlug: string
  eventTitle: string
  eventDate: string
  eventCity: string
  customFields?: EventFormField[]
}

function jsonStringList(options: unknown): string[] {
  if (!options) return []
  if (Array.isArray(options)) return options.filter((x): x is string => typeof x === 'string')
  return []
}

function messageFromApiError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const e = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
    if (e.formErrors?.length) return e.formErrors[0]
    const firstField = Object.values(e.fieldErrors ?? {}).flat()[0]
    if (firstField) return firstField
  }
  return 'Registration failed'
}

export function EventRegistrationModal({
  isOpen,
  onClose,
  eventSlug,
  eventTitle,
  eventDate,
  eventCity,
  customFields = [],
}: EventRegistrationModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    expectations: '',
  })
  const [extraValues, setExtraValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.phone || !form.location) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventSlug)}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, extraFields: extraValues }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyRegistered) {
          toast.error('You are already registered for this event!')
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

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setForm({ name: '', email: '', phone: '', location: '', expectations: '' })
      setExtraValues({})
    }, 300)
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
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
              style={{ background: '#0F0F0F', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {!submitted ? (
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="label-text mb-2">Register to Attend</p>
                      <h2 className="font-display text-snow text-xl font-bold leading-tight">{eventTitle}</h2>
                      <p className="font-body text-mist text-sm mt-1">
                        {eventDate} · {eventCity}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-mist hover:text-snow transition-colors ml-4 mt-1 shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="gold-line mb-8 opacity-30" />

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input
                        value={form.name}
                        onChange={(ev) => setForm((p) => ({ ...p, name: ev.target.value }))}
                        placeholder="Your full name"
                        required
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Email Address *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(ev) => setForm((p) => ({ ...p, email: ev.target.value }))}
                        placeholder="your@email.com"
                        required
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(ev) => setForm((p) => ({ ...p, phone: ev.target.value }))}
                        placeholder="+234..."
                        required
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Location (City, Country) *</label>
                      <input
                        value={form.location}
                        onChange={(ev) => setForm((p) => ({ ...p, location: ev.target.value }))}
                        placeholder="e.g. Abuja, Nigeria"
                        required
                        style={inputStyle}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Expectations (Optional)</label>
                      <textarea
                        value={form.expectations}
                        onChange={(ev) => setForm((p) => ({ ...p, expectations: ev.target.value }))}
                        placeholder="What are you expecting from this gathering?"
                        rows={3}
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                      />
                    </div>

                    {customFields.map((field) => (
                      <div key={field.id}>
                        <label style={labelStyle}>
                          {field.label}
                          {field.required ? ' *' : ''}
                        </label>
                        {field.type === 'LONG_TEXT' ? (
                          <textarea
                            value={extraValues[field.id] ?? ''}
                            onChange={(ev) =>
                              setExtraValues((p) => ({ ...p, [field.id]: ev.target.value }))
                            }
                            placeholder={field.placeholder ?? ''}
                            required={field.required}
                            rows={3}
                            style={{ ...inputStyle, resize: 'none' }}
                            onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                            onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                          />
                        ) : field.type === 'DROPDOWN' ? (
                          <select
                            value={extraValues[field.id] ?? ''}
                            onChange={(ev) =>
                              setExtraValues((p) => ({ ...p, [field.id]: ev.target.value }))
                            }
                            required={field.required}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                          >
                            <option value="">Select an option</option>
                            {jsonStringList(field.options).map((opt) => (
                              <option
                                key={opt}
                                value={opt}
                                style={{ background: '#1A1A1A', color: '#F8F8F8' }}
                              >
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'NUMBER' ? (
                          <input
                            type="number"
                            value={extraValues[field.id] ?? ''}
                            onChange={(ev) =>
                              setExtraValues((p) => ({
                                ...p,
                                [field.id]: ev.target.value,
                              }))
                            }
                            placeholder={field.placeholder ?? ''}
                            required={field.required}
                            style={inputStyle}
                            onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                            onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                          />
                        ) : field.type === 'EMAIL' ? (
                          <input
                            type="email"
                            value={extraValues[field.id] ?? ''}
                            onChange={(ev) =>
                              setExtraValues((p) => ({ ...p, [field.id]: ev.target.value }))
                            }
                            placeholder={field.placeholder ?? ''}
                            required={field.required}
                            style={inputStyle}
                            onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                            onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                          />
                        ) : field.type === 'DATE' ? (
                          <input
                            type="date"
                            value={extraValues[field.id] ?? ''}
                            onChange={(ev) =>
                              setExtraValues((p) => ({ ...p, [field.id]: ev.target.value }))
                            }
                            required={field.required}
                            style={inputStyle}
                            onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                            onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                          />
                        ) : field.type === 'RADIO' && jsonStringList(field.options).length > 0 ? (
                          <div className="space-y-2">
                            {jsonStringList(field.options).map((opt) => (
                              <label
                                key={opt}
                                className="flex cursor-pointer items-center gap-2 font-body text-sm text-mist"
                              >
                                <input
                                  type="radio"
                                  name={field.id}
                                  value={opt}
                                  checked={(extraValues[field.id] ?? '') === opt}
                                  onChange={() =>
                                    setExtraValues((p) => ({ ...p, [field.id]: opt }))
                                  }
                                  required={field.required}
                                  className="accent-[#C9A84C]"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            value={extraValues[field.id] ?? ''}
                            onChange={(ev) =>
                              setExtraValues((p) => ({ ...p, [field.id]: ev.target.value }))
                            }
                            placeholder={field.placeholder ?? ''}
                            required={field.required}
                            type={field.type === 'PHONE' ? 'tel' : 'text'}
                            style={inputStyle}
                            onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
                            onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                          />
                        )}
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 font-body font-semibold text-xs tracking-widest uppercase transition-all duration-300 disabled:opacity-50 mt-2"
                      style={{ background: '#C9A84C', color: '#0F0F0F' }}
                    >
                      {submitting ? 'Registering…' : 'Complete Registration →'}
                    </button>

                    <p className="font-body text-xs text-center" style={{ color: '#585858' }}>
                      A confirmation email will be sent to you.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div
                    className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-6"
                    style={{ borderColor: '#C9A84C' }}
                  >
                    <CheckCircle size={28} className="text-gold" />
                  </div>

                  <div className="gold-line max-w-[60px] mx-auto mb-6 opacity-40" />

                  <h2 className="font-display text-snow text-3xl font-bold mb-3">{"You're in!"}</h2>
                  <p className="font-body text-mist text-sm leading-relaxed mb-2">You are registered for</p>
                  <p className="font-display text-gold text-lg mb-6">{eventTitle}</p>
                  <p className="font-body text-mist text-sm leading-relaxed mb-8">
                    {`Check your email for confirmation and event details. We'll see you there. 🙌`}
                  </p>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-8 py-3 font-body text-xs tracking-widest uppercase border transition-all"
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
