'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { EventFormField } from '@prisma/client'
import { useEmailCheck } from '@/hooks/useEmailCheck'

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  eventSlug: string
  eventTitle: string
  eventDate: string
  eventCity: string
  fields: EventFormField[]
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

function EventPrimaryEmailField({
  eventSlug,
  field,
  value,
  onChange,
  inputStyle,
  labelStyle,
  isOpen,
  onDuplicateChange,
}: {
  eventSlug: string
  field: EventFormField
  value: string
  onChange: (v: string) => void
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
  isOpen: boolean
  onDuplicateChange: (exists: boolean) => void
}) {
  const checkUrl = useCallback(
    (email: string) =>
      `/api/events/${encodeURIComponent(eventSlug)}/check-email?email=${encodeURIComponent(email)}`,
    [eventSlug],
  )
  const { checking: checkingEmail, emailExists, checkEmail, reset } = useEmailCheck({ checkUrl })

  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  useEffect(() => {
    onDuplicateChange(emailExists)
    return () => onDuplicateChange(false)
  }, [emailExists, onDuplicateChange])

  return (
    <>
      <label style={labelStyle}>
        {field.label}
        {field.required ? ' *' : ''}
      </label>
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            onChange(v)
            checkEmail(v)
          }}
          onBlur={() => checkEmail(value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          style={{
            ...inputStyle,
            paddingRight: checkingEmail ? 40 : 16,
            borderColor: emailExists ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)',
          }}
          onFocus={(ev) => {
            if (!emailExists) ev.target.style.borderColor = '#C9A84C'
          }}
        />
        {checkingEmail && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2"
              style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
            />
          </div>
        )}
      </div>
      {emailExists && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-2 px-3 py-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <span className="shrink-0 text-sm text-red-400">⚠</span>
          <p className="font-body text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
            You are already registered for this event with this email address.
          </p>
        </motion.div>
      )}
    </>
  )
}

export function EventRegistrationModal({
  isOpen,
  onClose,
  eventSlug,
  eventTitle,
  eventDate,
  eventCity,
  fields,
}: EventRegistrationModalProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [primaryEmailDuplicate, setPrimaryEmailDuplicate] = useState(false)

  const primaryEmailField = useMemo(() => {
    const emails = fields.filter((f) => f.type === 'EMAIL').sort((a, b) => a.order - b.order)
    return emails[0]
  }, [fields])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (primaryEmailDuplicate) {
      toast.error('You are already registered for this event.')
      return
    }

    if (fields.length === 0) {
      toast.error('Registration form is not available.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventSlug)}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldValues }),
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
      setFieldValues({})
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

  const renderFieldControl = (field: EventFormField) => {
    const value = fieldValues[field.id] ?? ''
    const onChange = (val: string) => setFieldValues((p) => ({ ...p, [field.id]: val }))

    if (field.type === 'LONG_TEXT') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
          onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      )
    }

    if (field.type === 'DROPDOWN') {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">Select an option</option>
          {jsonStringList(field.options).map((opt) => (
            <option key={opt} value={opt} style={{ background: '#1A1A1A', color: '#F8F8F8' }}>
              {opt}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'NUMBER') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          style={inputStyle}
          onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
          onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      )
    }

    if (field.type === 'DATE') {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          style={inputStyle}
          onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
          onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      )
    }

    if (field.type === 'RADIO' && jsonStringList(field.options).length > 0) {
      return (
        <div className="space-y-2">
          {jsonStringList(field.options).map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2 font-body text-sm text-mist">
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                required={field.required}
                className="accent-[#C9A84C]"
              />
              {opt}
            </label>
          ))}
        </div>
      )
    }

    if (field.type === 'CHECKBOXES' || field.type === 'FILE_UPLOAD') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          required={field.required}
          rows={field.type === 'FILE_UPLOAD' ? 2 : 3}
          style={{ ...inputStyle, resize: 'none' }}
          onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
          onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
        />
      )
    }

    const inputType = field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : 'text'

    return (
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ''}
        required={field.required}
        style={inputStyle}
        onFocus={(ev) => (ev.target.style.borderColor = '#C9A84C')}
        onBlur={(ev) => (ev.target.style.borderColor = 'rgba(255,255,255,0.12)')}
      />
    )
  }

  const onPrimaryDup = useCallback((exists: boolean) => {
    setPrimaryEmailDuplicate(exists)
  }, [])

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
                      <p className="label-text mb-2">Register to Attend</p>
                      <h2 className="font-display text-xl font-bold leading-tight text-snow">{eventTitle}</h2>
                      <p className="mt-1 font-body text-sm text-mist">
                        {eventDate} · {eventCity}
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

                  {fields.length === 0 ? (
                    <p className="font-body text-sm text-mist">Registration form is not configured yet.</p>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {fields.map((field) => (
                        <div key={field.id}>
                          {field.type === 'EMAIL' && field.id === primaryEmailField?.id ? (
                            <EventPrimaryEmailField
                              eventSlug={eventSlug}
                              field={field}
                              value={fieldValues[field.id] ?? ''}
                              onChange={(v) => setFieldValues((p) => ({ ...p, [field.id]: v }))}
                              inputStyle={inputStyle}
                              labelStyle={labelStyle}
                              isOpen={isOpen}
                              onDuplicateChange={onPrimaryDup}
                            />
                          ) : (
                            <>
                              <label style={labelStyle}>
                                {field.label}
                                {field.required ? ' *' : ''}
                              </label>
                              {renderFieldControl(field)}
                            </>
                          )}
                        </div>
                      ))}

                      <button
                        type="submit"
                        disabled={submitting || primaryEmailDuplicate}
                        className="mt-2 w-full py-4 font-body text-xs font-semibold uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
                        style={{ background: '#C9A84C', color: '#0F0F0F' }}
                      >
                        {submitting ? 'Registering…' : 'Complete Registration →'}
                      </button>

                      <p className="text-center font-body text-xs" style={{ color: '#585858' }}>
                        A confirmation email will be sent to you.
                      </p>
                    </form>
                  )}
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

                  <h2 className="font-display mb-3 text-3xl font-bold text-snow">{"You're in!"}</h2>
                  <p className="mb-2 font-body text-sm leading-relaxed text-mist">You are registered for</p>
                  <p className="font-display mb-6 text-lg text-gold">{eventTitle}</p>
                  <p className="mb-8 font-body text-sm leading-relaxed text-mist">
                    {`Check your email for confirmation and event details. We'll see you there. 🙌`}
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
