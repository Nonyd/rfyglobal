'use client'

import { useState } from 'react'
import type { Role, User } from '@prisma/client'
import toast from 'react-hot-toast'
import { Plus, Pencil, X } from 'lucide-react'

type UserRow = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'isActive' | 'lastLoginAt' | 'createdAt'
>

const ROLE_OPTIONS: Role[] = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MEDIA_ADMIN']

function roleBadgeStyle(role: Role): React.CSSProperties {
  switch (role) {
    case 'SUPER_ADMIN':
      return { background: 'rgba(201, 168, 76, 0.2)', color: 'var(--a-gold)' }
    case 'ADMIN':
      return { background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }
    case 'EDITOR':
      return { background: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }
    case 'MEDIA_ADMIN':
      return { background: 'rgba(168, 85, 247, 0.2)', color: '#A855F7' }
    default:
      return { background: 'var(--a-border)', color: 'var(--a-text)' }
  }
}

interface UsersManagerProps {
  initialUsers: UserRow[]
  currentUserId: string
}

export function UsersManager({ initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('EDITOR')

  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<Role>('ADMIN')
  const [editActive, setEditActive] = useState(true)
  const [editPassword, setEditPassword] = useState('')

  const openEdit = (u: UserRow) => {
    setEditUser(u)
    setEditName(u.name ?? '')
    setEditRole(u.role)
    setEditActive(u.isActive)
    setEditPassword('')
  }

  const createUser = async () => {
    if (!inviteEmail.trim() || !invitePassword) {
      toast.error('Email and password required')
      return
    }
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        password: invitePassword,
        role: inviteRole,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create user')
      return
    }
    toast.success('User created')
    setUsers((prev) => [data as UserRow, ...prev])
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInvitePassword('')
    setInviteRole('EDITOR')
  }

  const saveEdit = async () => {
    if (!editUser) return
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim() || null,
        role: editRole,
        isActive: editActive,
        ...(editPassword ? { password: editPassword } : {}),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Update failed')
      return
    }
    toast.success('User updated')
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...data } : u)))
    setEditUser(null)
  }

  const toggleActive = async (u: UserRow) => {
    if (u.id === currentUserId) {
      toast.error('Use edit panel to change your own status')
      return
    }
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    })
    if (!res.ok) {
      toast.error('Failed to update')
      return
    }
    setUsers((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x))
    )
    toast.success(u.isActive ? 'User deactivated' : 'User activated')
  }

  const deleteUser = async (u: UserRow) => {
    if (u.id === currentUserId) return
    if (!confirm(`Delete user ${u.email}?`)) return
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Delete failed')
      return
    }
    setUsers((prev) => prev.filter((x) => x.id !== u.id))
    toast.success('User deleted')
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
            Admin Users
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
            Create and manage dashboard accounts
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 font-body text-sm font-medium rounded-sm transition-colors"
          style={{ background: 'var(--a-gold)', color: '#0f0f0f' }}
        >
          <Plus size={16} /> Invite User
        </button>
      </div>

      <div className="border rounded-sm overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr style={{ background: 'var(--a-sidebar)', borderBottom: `1px solid var(--a-border)` }}>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                  Name / Email
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                  Last login
                </th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                  Created
                </th>
                <th className="text-right px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u.id === currentUserId
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: `1px solid var(--a-border)`,
                      background:
                        isSelf
                          ? 'rgba(201, 168, 76, 0.06)'
                          : i % 2 === 0
                            ? 'var(--a-surface)'
                            : 'var(--a-bg)',
                    }}
                  >
                    <td className="px-4 py-3">
                      <p style={{ color: 'var(--a-text)' }}>{u.name ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--a-text-muted)' }}>
                        {u.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] px-2 py-0.5 font-body uppercase tracking-wider rounded-sm"
                        style={roleBadgeStyle(u.role)}
                      >
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--a-text-muted)' }}>
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--a-text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: 'var(--a-gold)' }}
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(u)}
                        disabled={isSelf}
                        className="text-xs disabled:opacity-30"
                        style={{ color: 'var(--a-text-secondary)' }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteUser(u)}
                        disabled={isSelf}
                        className="text-xs disabled:opacity-30"
                        style={{ color: 'var(--a-red)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            aria-label="Close"
            onClick={() => setInviteOpen(false)}
          />
          <div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l p-6 shadow-xl"
            style={{
              background: 'var(--a-surface)',
              borderColor: 'var(--a-border)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>
                Invite User
              </h3>
              <button type="button" onClick={() => setInviteOpen(false)} style={{ color: 'var(--a-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Name">
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full border px-3 py-2 font-body text-sm"
                  style={inputStyle}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border px-3 py-2 font-body text-sm"
                  style={inputStyle}
                />
              </Field>
              <Field label="Role">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full border px-3 py-2 font-body text-sm"
                  style={inputStyle}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Temporary password">
                <input
                  type="password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full border px-3 py-2 font-body text-sm"
                  style={inputStyle}
                />
              </Field>
              <button
                type="button"
                onClick={() => void createUser()}
                className="w-full py-2.5 font-body text-sm font-medium"
                style={{ background: 'var(--a-gold)', color: '#0f0f0f' }}
              >
                Create User
              </button>
            </div>
          </div>
        </>
      )}

      {editUser && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50"
            aria-label="Close"
            onClick={() => setEditUser(null)}
          />
          <div
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l p-6 shadow-xl"
            style={{
              background: 'var(--a-surface)',
              borderColor: 'var(--a-border)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>
                Edit User
              </h3>
              <button type="button" onClick={() => setEditUser(null)} style={{ color: 'var(--a-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <p className="font-body text-xs mb-4" style={{ color: 'var(--a-text-muted)' }}>
              {editUser.email}
            </p>
            <div className="space-y-4">
              <Field label="Name">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border px-3 py-2 font-body text-sm"
                  style={inputStyle}
                />
              </Field>
              <Field label="Role">
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  disabled={editUser.id === currentUserId}
                  className="w-full border px-3 py-2 font-body text-sm disabled:opacity-50"
                  style={inputStyle}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  disabled={editUser.id === currentUserId}
                />
                Active
              </label>
              <Field label="New password (optional)">
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full border px-3 py-2 font-body text-sm"
                  style={inputStyle}
                />
              </Field>
              <button
                type="button"
                onClick={() => void saveEdit()}
                className="w-full py-2.5 font-body text-sm font-medium"
                style={{ background: 'var(--a-gold)', color: '#0f0f0f' }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--a-bg)',
  borderColor: 'var(--a-border)',
  color: 'var(--a-text)',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--a-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
