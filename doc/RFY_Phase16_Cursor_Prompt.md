# ROOM FOR YOU — Phase 16 Cursor Prompt
## Admin Change Password

---

## CONTEXT

Admin users need the ability to change their own password from within the dashboard. This is a simple self-service feature — every admin role can change their own password. SUPER_ADMIN can also reset any other user's password from the Users management page.

---

## TASK 1 — Change Password API Route

Create `src/app/api/admin/change-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

export const runtime = 'nodejs'

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ChangePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  // Fetch user with current password hash
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, password: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    return NextResponse.json({
      error: 'Current password is incorrect',
    }, { status: 400 })
  }

  // Hash and update new password
  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  // Log activity
  await logActivity({
    userId: session.user.id,
    action: 'Changed their password',
    module: 'Users',
    targetId: session.user.id,
    targetTitle: user.email,
  })

  return NextResponse.json({ success: true })
}
```

---

## TASK 2 — Change Password Page

Create `src/app/admin/(dashboard)/settings/page.tsx`:

```typescript
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm'
import { auth } from '@/lib/auth'

export default async function SettingsPage() {
  const session = await auth()

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold"
          style={{ color: 'var(--a-text)' }}>
          Account Settings
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Manage your admin account
        </p>
      </div>

      {/* Account info */}
      <div className="p-5 border mb-8"
        style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}>
        <p className="font-body text-xs uppercase tracking-widest mb-3"
          style={{ color: 'var(--a-text-muted)' }}>
          Account Info
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
              Email
            </span>
            <span className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
              {session?.user?.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
              Role
            </span>
            <span className="text-[11px] px-2 py-0.5 font-body tracking-widest uppercase"
              style={{
                background: 'var(--a-gold-light)',
                color: 'var(--a-gold)',
                border: '1px solid var(--a-gold-border)',
              }}>
              {session?.user?.role}
            </span>
          </div>
        </div>
      </div>

      <ChangePasswordForm />
    </div>
  )
}
```

---

## TASK 3 — ChangePasswordForm Component

Create `src/components/admin/ChangePasswordForm.tsx`:

```typescript
'use client'

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
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = typeof data.error === 'string'
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
      toggle: () => setShowCurrent(p => !p),
    },
    {
      key: 'newPassword' as const,
      label: 'New Password',
      show: showNew,
      toggle: () => setShowNew(p => !p),
      hint: 'Minimum 8 characters',
    },
    {
      key: 'confirmPassword' as const,
      label: 'Confirm New Password',
      show: showConfirm,
      toggle: () => setShowConfirm(p => !p),
    },
  ]

  return (
    <div className="p-6 border"
      style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}>
      <div className="flex items-center gap-2 mb-6">
        <Lock size={16} style={{ color: 'var(--a-gold)' }} />
        <p className="font-body text-sm font-medium" style={{ color: 'var(--a-text)' }}>
          Change Password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map(field => (
          <div key={field.key}>
            <label style={labelStyle}>{field.label}</label>
            <div style={inputWrapperStyle}>
              <input
                type={field.show ? 'text' : 'password'}
                value={form[field.key]}
                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                required
                autoComplete={field.key === 'currentPassword' ? 'current-password' : 'new-password'}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
                onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
              />
              <button
                type="button"
                onClick={field.toggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--a-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
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
            disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
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
```

---

## TASK 4 — Add Settings to Admin Sidebar

Open `src/components/admin/AdminSidebar.tsx`.

Add a Settings item to the bottom of the sidebar, just above the sign out button — visible to ALL roles:

```typescript
// Import Settings icon
import { Settings } from 'lucide-react'

// Add to NAV_GROUPS under a new group or at the bottom of SETTINGS:
// Or better — add as a standalone link above the sign-out area:

// In the bottom user area, add before sign out:
<Link
  href="/admin/settings"
  className="flex items-center gap-2 px-3 py-2 text-sm font-body transition-all mb-1"
  style={{
    color: pathname === '/admin/settings' ? 'var(--a-gold)' : 'var(--a-text-muted)',
    background: pathname === '/admin/settings' ? 'var(--a-gold-active)' : 'transparent',
  }}
  onMouseEnter={e => {
    if (pathname !== '/admin/settings') {
      e.currentTarget.style.color = 'var(--a-text)'
    }
  }}
  onMouseLeave={e => {
    if (pathname !== '/admin/settings') {
      e.currentTarget.style.color = 'var(--a-text-muted)'
    }
  }}
>
  <Settings size={14} />
  Account Settings
</Link>
```

---

## TASK 5 — SUPER_ADMIN: Reset Any User's Password

Open `src/components/admin/users/UsersManager.tsx`.

In the edit user panel, add an optional "Reset Password" field that SUPER_ADMIN can fill in to set a new password for any user:

```typescript
// In the edit panel form, add:
<div>
  <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
    style={{ color: 'var(--a-text-secondary)' }}>
    Reset Password (optional)
  </label>
  <input
    type="password"
    value={editForm.password ?? ''}
    onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
    placeholder="Leave blank to keep current password"
    className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
    style={{
      background: 'var(--a-bg)',
      borderColor: 'var(--a-border)',
      color: 'var(--a-text)',
    }}
    onFocus={e => (e.target.style.borderColor = 'var(--a-gold)')}
    onBlur={e => (e.target.style.borderColor = 'var(--a-border)')}
  />
  <p className="font-body text-xs mt-1" style={{ color: 'var(--a-text-muted)' }}>
    Minimum 8 characters if setting a new password
  </p>
</div>
```

The existing PATCH `/api/admin/users/[id]` route already handles password updates when `body.password` is provided — no API changes needed.

---

## PHASE 16 COMPLETION CHECKLIST

- [ ] `POST /api/admin/change-password` validates current password correctly
- [ ] Wrong current password returns clear error message
- [ ] New password must be at least 8 characters
- [ ] Passwords must match — mismatch shows error
- [ ] Password changed successfully — success toast shown
- [ ] Form clears after successful change
- [ ] `/admin/settings` page loads for all admin roles
- [ ] Account info section shows email and role
- [ ] Show/hide password toggles work on all three fields
- [ ] "Account Settings" link in sidebar bottom area
- [ ] SUPER_ADMIN can reset other users' passwords from `/admin/users`
- [ ] Password change logged in activity log
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `ChangePasswordForm` is `'use client'` — the page itself is a server component that fetches the session for the account info display.
- The API route uses `session.user.id` to find the user — it always changes the currently logged-in user's own password, never anyone else's. SUPER_ADMIN resetting other users' passwords goes through the existing `/api/admin/users/[id]` PATCH route.
- The show/hide password toggle uses `type="text"` vs `type="password"` switching — this is intentional and accessible.
- Do not add "Account Settings" to the role-based nav filtering — it should always be visible to every role since every admin needs to be able to change their own password.
