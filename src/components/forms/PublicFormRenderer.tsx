'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Form, FormField } from '@prisma/client'
import { cn } from '@/lib/utils'

type PublicForm = Omit<Form, 'notifyEmail'> & { fields: FormField[] }

const inputClass =
  'w-full bg-white/[0.03] border border-white/10 text-white px-4 py-3 text-sm font-body focus:border-gold focus:outline-none transition-colors placeholder:text-white/25'

const labelClass = 'block text-xs uppercase tracking-widest text-white/50 mb-2 font-body'

export function PublicFormRenderer({ form }: { form: PublicForm }) {
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const onSubmit = async (data: Record<string, string | string[]>) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/forms/${form.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Submission failed')
      }
      setDone(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-16 px-4 space-y-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent max-w-xs mx-auto" />
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 text-gold text-2xl"
          style={{ borderColor: 'rgba(201,168,76,0.5)' }}
        >
          ✓
        </div>
        <h2 className="font-display text-3xl lg:text-4xl text-white">Thank You</h2>
        <p className="text-white/55 font-body leading-relaxed max-w-md mx-auto">
          Your response has been received. We&apos;ll be in touch soon.
        </p>
        <Link href="/" className="inline-block text-gold font-body text-sm tracking-wide hover:text-gold-light transition-colors">
          Back to Home
        </Link>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent max-w-xs mx-auto" />
      </div>
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
                  <label key={o} className="flex items-center gap-3 text-sm text-white/80 font-body cursor-pointer">
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
                  <label key={o} className="flex items-center gap-3 text-sm text-white/80 font-body cursor-pointer">
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
                      'py-2 file:mr-4 file:bg-gold/20 file:text-gold file:border-0 file:px-3 file:py-1'
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
                ...(field.type === 'EMAIL'
                  ? {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email',
                      },
                    }
                  : {}),
              })}
            />
            {err ? <p className="text-red-brand text-xs mt-1">{err}</p> : null}
          </div>
        )
      })}

      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-10 py-3.5 bg-gold text-black text-sm font-body font-medium tracking-wide hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
