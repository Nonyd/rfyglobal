'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg =
          typeof data.error === 'string'
            ? data.error
            : Object.values(data.error ?? {}).flat().join(', ')
        throw new Error(errorMsg || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const inputWrapperStyle = {
    position: 'relative' as const,
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--a-bg)',
    borderColor: 'var(--a-border)',
    color: 'var(--a-text)',
    border: '1px solid var(--a-border)',
    padding: '12px 44px 12px 16px',
    fontSize: '14px',
    fontFamily: 'General Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--a-text-secondary)',
    marginBottom: '6px',
    fontFamily: 'General Sans, sans-serif',
    fontWeight: '500',
  }

  const fields = [
    {
      key: 'currentPassword' as const,
      label: 'Current Password',
      show: showCurrent,
      toggle: () => setShowCurrent((p) => !p),
    },
    {
      key: 'newPassword' as const,
      label: 'New Password',
      show: showNew,
      toggle: () => setShowNew((p) => !p),
      hint: 'Minimum 8 characters',
    },
    {
      key: 'confirmPassword' as const,
      label: 'Confirm New Password',
      show: showConfirm,
      toggle: () => setShowConfirm((p) => !p),
    },
  ]

  return (
    <div
      className="p-6 border"
      style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Lock size={16} style={{ color: 'var(--a-gold)' }} />
        <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
          Change Password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.key}>
            <label style={labelStyle}>{field.label}</label>
            <div style={inputWrapperStyle} className="relative">
              <input
                type={field.show ? 'text' : 'password'}
                value={form[field.key]}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                required
                autoComplete={
                  field.key === 'currentPassword' ? 'current-password' : 'new-password'
                }
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
              />
              <button
                type="button"
                onClick={field.toggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
              >
                {field.show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {field.hint && (
              <p className="font-body text-xs mt-1" style={{ color: 'var(--a-text-muted)' }}>
                {field.hint}
              </p>
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            disabled={
              saving || !form.currentPassword || !form.newPassword || !form.confirmPassword
            }
            className="w-full py-3 font-body text-sm font-semibold tracking-wide uppercase text-white transition-all disabled:opacity-40"
            style={{ background: 'var(--a-gold)' }}
          >
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
