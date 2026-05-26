'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useForm, Controller, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import type { Form, FormField } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useEmailCheck } from '@/hooks/useEmailCheck'
import { useRedirectCountdown } from '@/hooks/useRedirectCountdown'
import { RedirectCountdownBanner } from '@/components/shared/RedirectCountdownBanner'
import { FormSuccessPanel } from '@/components/shared/FormSuccessPanel'

type PublicForm = Omit<Form, 'notifyEmail'> & { fields: FormField[] }

const inputClass =
  'w-full border border-theme bg-surface px-4 py-3 text-sm font-body text-text-primary transition-colors placeholder:text-text-muted/60 focus:border-crimson focus:outline-none'

const labelClass = 'mb-2 block text-xs font-body uppercase tracking-widest text-text-muted'

const BIRTHDAY_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

function FormBuilderEmailField({
  formSlug,
  field,
  register,
  errors,
  onExistsChange,
}: {
  formSlug: string
  field: FormField
  register: UseFormRegister<Record<string, string | string[]>>
  errors: FieldErrors<Record<string, string | string[]>>
  onExistsChange: (exists: boolean) => void
}) {
  const checkUrl = useCallback(
    (email: string) =>
      `/api/forms/slug/${encodeURIComponent(formSlug)}/check-email?email=${encodeURIComponent(email)}&fieldId=${encodeURIComponent(field.id)}`,
    [formSlug, field.id],
  )
  const { checking, emailExists, checkEmail } = useEmailCheck({ checkUrl })

  const onExistsRef = useRef(onExistsChange)
  onExistsRef.current = onExistsChange
  useEffect(() => {
    onExistsRef.current(emailExists)
    return () => onExistsRef.current(false)
  }, [emailExists])

  const err = errors[field.id]?.message as string | undefined
  const reg = register(field.id, {
    required: field.required ? `${field.label} is required` : false,
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter a valid email',
    },
  })

  return (
    <div>
      <label htmlFor={field.id} className={labelClass}>
        {field.label}
        {field.required ? <span className="text-red-brand"> *</span> : null}
      </label>
      <div className="relative">
        <input
          id={field.id}
          type="email"
          placeholder={field.placeholder ?? undefined}
          className={cn(inputClass, checking ? 'pr-11' : undefined, emailExists ? '!border-red-500/60' : undefined)}
          {...reg}
          onChange={(e) => {
            reg.onChange(e)
            checkEmail(e.target.value)
          }}
          onBlur={(e) => {
            reg.onBlur(e)
            checkEmail(e.target.value)
          }}
        />
        {checking ? (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'rgba(139,0,0,0.4)' }}
            />
          </div>
        ) : null}
      </div>
      {emailExists ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-2 border border-red-500/30 bg-red-500/10 px-3 py-2"
        >
          <span className="shrink-0 text-sm text-red-400">⚠</span>
          <p className="font-body text-xs leading-relaxed text-red-300">
            This email has already been used on this form. If you need to update your response, please contact us.
          </p>
        </motion.div>
      ) : null}
      {err ? <p className="mt-1 text-xs text-red-brand">{err}</p> : null}
    </div>
  )
}

export function PublicFormRenderer({ form }: { form: PublicForm }) {
  const [done, setDone] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [emailDupByField, setEmailDupByField] = useState<Record<string, boolean>>({})
  const {
    redirectCountdown,
    pendingRedirectUrl,
    startRedirect,
    isRedirecting,
  } = useRedirectCountdown()

  const defaultValues = useMemo(() => {
    const v: Record<string, string | string[]> = {}
    for (const f of form.fields) {
      if (f.type === 'CHECKBOXES') v[f.id] = []
      else v[f.id] = ''
    }
    return v
  }, [form.fields])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string | string[]>>({
    defaultValues,
  })

  const emailSubmitBlocked = Object.values(emailDupByField).some(Boolean)

  const onSubmit = async (data: Record<string, string | string[]>) => {
    if (emailSubmitBlocked) {
      toast.error('This email has already been submitted for this form.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = (await res.json().catch(() => ({}))) as {
        error?: string
        redirectUrl?: string | null
        message?: string
      }
      if (!res.ok) {
        throw new Error(body.error ?? 'Submission failed')
      }
      setSuccessMessage(body.message ?? 'Your submission has been received.')
      setDone(true)
      if (body.redirectUrl) {
        startRedirect(body.redirectUrl)
        return
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <FormSuccessPanel
        theme="light"
        title="Thank you!"
        message={successMessage ?? 'Your submission has been received.'}
      >
        {isRedirecting && redirectCountdown !== null && pendingRedirectUrl ? (
          <RedirectCountdownBanner
            redirectCountdown={redirectCountdown}
            pendingRedirectUrl={pendingRedirectUrl}
          />
        ) : (
          <Link
            href="/"
            className="inline-block font-body text-sm tracking-wide text-crimson transition-colors hover:text-crimson-light"
          >
            Back to Home →
          </Link>
        )}
      </FormSuccessPanel>
    )
  }

  const optionsFor = (f: FormField): string[] => {
    const raw = f.options
    if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string')
    return []
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {form.fields.map((field) => {
        const err = errors[field.id]?.message as string | undefined

        if (field.type === 'LONG_TEXT') {
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClass}>
                {field.label}
                {field.required ? <span className="text-red-brand"> *</span> : null}
              </label>
              <textarea
                id={field.id}
                rows={4}
                placeholder={field.placeholder ?? undefined}
                className={cn(inputClass, 'resize-none min-h-[120px]')}
                {...register(field.id, {
                  required: field.required ? `${field.label} is required` : false,
                })}
              />
              {err ? <p className="text-red-brand text-xs mt-1">{err}</p> : null}
            </div>
          )
        }

        if (field.type === 'DROPDOWN') {
          const opts = optionsFor(field)
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClass}>
                {field.label}
                {field.required ? <span className="text-red-brand"> *</span> : null}
              </label>
              <select
                id={field.id}
                className={cn(inputClass, 'cursor-pointer')}
                {...register(field.id, {
                  required: field.required ? `${field.label} is required` : false,
                })}
              >
                <option value="">Select…</option>
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {err ? <p className="text-red-brand text-xs mt-1">{err}</p> : null}
            </div>
          )
        }

        if (field.type === 'RADIO') {
          const opts = optionsFor(field)
          return (
            <div key={field.id}>
              <p className={labelClass}>
                {field.label}
                {field.required ? <span className="text-red-brand"> *</span> : null}
              </p>
              <div className="space-y-2">
                {opts.map((o) => (
                  <label key={o} className="flex cursor-pointer items-center gap-3 font-body text-sm text-text-secondary">
                    <input
                      type="radio"
                      value={o}
                      className="accent-gold"
                      {...register(field.id, {
                        required: field.required ? `${field.label} is required` : false,
                      })}
                    />
                    {o}
                  </label>
                ))}
              </div>
              {err ? <p className="text-red-brand text-xs mt-1">{err}</p> : null}
            </div>
          )
        }

        if (field.type === 'CHECKBOXES') {
          const opts = optionsFor(field)
          return (
            <div key={field.id}>
              <p className={labelClass}>
                {field.label}
                {field.required ? <span className="text-red-brand"> *</span> : null}
              </p>
              <div className="space-y-2">
                {opts.map((o) => (
                  <label key={o} className="flex cursor-pointer items-center gap-3 font-body text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      value={o}
                      className="accent-gold"
                      {...register(field.id, {
                        required: field.required ? `Select at least one option` : false,
                      })}
                    />
                    {o}
                  </label>
                ))}
              </div>
              {err ? <p className="text-red-brand text-xs mt-1">{err}</p> : null}
            </div>
          )
        }

        if (field.type === 'BIRTHDAY_MONTH') {
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClass}>
                {field.label}
                <span className="ml-2 normal-case tracking-normal text-text-muted">(optional)</span>
              </label>
              <select
                id={field.id}
                className={cn(inputClass, 'cursor-pointer')}
                {...register(field.id)}
              >
                <option value="">Select month…</option>
                {BIRTHDAY_MONTHS.map((month, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {month}
                  </option>
                ))}
              </select>
              <p className="mt-1 font-body text-xs text-text-muted">
                Share your birthday month so we can celebrate you! 🎂
              </p>
            </div>
          )
        }

        if (field.type === 'BIRTHDAY_DAY') {
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClass}>
                {field.label}
                <span className="ml-2 normal-case tracking-normal text-text-muted">(optional)</span>
              </label>
              <Controller
                control={control}
                name={field.id}
                render={({ field: fctrl }) => (
                  <input
                    id={field.id}
                    type="number"
                    min={1}
                    max={31}
                    placeholder="e.g. 15"
                    className={inputClass}
                    value={fctrl.value === '' || fctrl.value === undefined ? '' : String(fctrl.value)}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (!raw) {
                        fctrl.onChange('')
                        return
                      }
                      const val = parseInt(raw, 10)
                      if (!Number.isNaN(val) && val >= 1 && val <= 31) {
                        fctrl.onChange(raw)
                      }
                    }}
                    onBlur={fctrl.onBlur}
                  />
                )}
              />
            </div>
          )
        }

        if (field.type === 'FILE_UPLOAD') {
          return (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClass}>
                {field.label}
                {field.required ? <span className="text-red-brand"> *</span> : null}
              </label>
              <Controller
                control={control}
                name={field.id}
                rules={{
                  required: field.required ? `${field.label} is required` : false,
                }}
                render={({ field: fctrl }) => (
                  <input
                    id={field.id}
                    type="file"
                    className={cn(
                      inputClass,
                      'py-2 file:mr-4 file:bg-crimson/20 file:text-crimson file:border-0 file:px-3 file:py-1'
                    )}
                    onChange={(e) => fctrl.onChange(e.target.files?.[0]?.name ?? '')}
                  />
                )}
              />
              {err ? <p className="text-red-brand text-xs mt-1">{err}</p> : null}
            </div>
          )
        }

        const inputType =
          field.type === 'EMAIL'
            ? 'email'
            : field.type === 'PHONE'
              ? 'tel'
              : field.type === 'NUMBER'
                ? 'number'
                : field.type === 'DATE'
                  ? 'date'
                  : 'text'

        const placeholder =
          field.type === 'LOCATION'
            ? field.placeholder || 'City, Country'
            : field.placeholder ?? undefined

        if (field.type === 'EMAIL') {
          return (
            <FormBuilderEmailField
              key={field.id}
              formSlug={form.slug}
              field={field}
              register={register}
              errors={errors}
              onExistsChange={(exists) =>
                setEmailDupByField((p) => {
                  const next = { ...p }
                  if (exists) next[field.id] = true
                  else delete next[field.id]
                  return next
                })
              }
            />
          )
        }

        return (
          <div key={field.id}>
            <label htmlFor={field.id} className={labelClass}>
              {field.label}
              {field.required ? <span className="text-red-brand"> *</span> : null}
            </label>
            <input
              id={field.id}
              type={inputType}
              placeholder={placeholder}
              className={inputClass}
              {...register(field.id, {
                required: field.required ? `${field.label} is required` : false,
              })}
            />
            {err ? <p className="text-red-brand text-xs mt-1">{err}</p> : null}
          </div>
        )
      })}

      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting || emailSubmitBlocked}
          className="btn-crimson-solid w-full sm:w-auto px-10 py-3.5 bg-crimson text-sm font-body font-medium tracking-wide hover:bg-crimson-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
