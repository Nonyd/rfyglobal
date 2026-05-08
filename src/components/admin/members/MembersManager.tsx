'use client'

import { useState } from 'react'
import { Plus, Download, X, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FieldType, type CommunityMember, type JoinFormField } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { AdminToggle } from '@/components/shared/Toggle'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'

interface MembersManagerProps {
  initialMembers: CommunityMember[]
  total: number
  extraFields: JoinFormField[]
}

export function MembersManager({ initialMembers, total, extraFields: initialFields }: MembersManagerProps) {
  const [members, setMembers] = useState(initialMembers)
  const [extraFields, setExtraFields] = useState(initialFields)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [newField, setNewField] = useState<{
    label: string
    type: FieldType
    placeholder: string
    required: boolean
    order: number
  }>({
    label: '',
    type: FieldType.SHORT_TEXT,
    placeholder: '',
    required: false,
    order: initialFields.length,
  })
  const [savingField, setSavingField] = useState(false)
  const bulk = useBulkSelect(members)

  const loadMore = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/join/members?page=${page + 1}`)
      const data = await res.json()
      setMembers((prev) => [...prev, ...data.members])
      setPage((p) => p + 1)
    } catch {
      toast.error('Failed to load more')
    } finally {
      setLoading(false)
    }
  }

  const toggleSubscribed = async (m: CommunityMember) => {
    setTogglingId(m.id)
    try {
      const res = await fetch(`/api/join/members/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSubscribed: !m.isSubscribed }),
      })
      if (!res.ok) throw new Error('Failed')
      setMembers((prev) =>
        prev.map((row) => (row.id === m.id ? { ...row, isSubscribed: !row.isSubscribed } : row)),
      )
      toast.success(m.isSubscribed ? 'Member unsubscribed' : 'Member subscribed')
    } catch {
      toast.error('Could not update subscription')
    } finally {
      setTogglingId(null)
    }
  }

  const saveField = async () => {
    if (!newField.label.trim()) {
      toast.error('Label is required')
      return
    }
    setSavingField(true)
    try {
      const res = await fetch('/api/join/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newField,
          order: extraFields.length,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const field = (await res.json()) as JoinFormField
      setExtraFields((prev) => [...prev, field])
      toast.success('Field added to join form')
      setAddFieldOpen(false)
      setNewField({
        label: '',
        type: FieldType.SHORT_TEXT,
        placeholder: '',
        required: false,
        order: extraFields.length + 1,
      })
    } catch {
      toast.error('Failed to add field')
    } finally {
      setSavingField(false)
    }
  }

  const bulkDelete = async () => {
    if (!bulk.selectedCount) return
    if (!confirm(`Delete ${bulk.selectedCount} member${bulk.selectedCount > 1 ? 's' : ''}? This cannot be undone.`)) return
    const res = await fetch('/api/join/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: bulk.selectedArray }),
    })
    if (!res.ok) {
      toast.error('Failed to delete members')
      return
    }
    toast.success(`${bulk.selectedCount} members deleted`)
    bulk.reset()
    const deletedSet = new Set(bulk.selectedArray)
    setMembers((prev) => prev.filter((m) => !deletedSet.has(m.id)))
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
            Community Members
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
            {total.toLocaleString()} registered members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/join/members?format=csv"
            className="flex items-center gap-2 px-4 py-2.5 font-body text-sm border transition-all"
            style={{
              borderColor: 'var(--a-border)',
              color: 'var(--a-text-secondary)',
              background: 'var(--a-surface)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--a-gold-border)'
              e.currentTarget.style.color = 'var(--a-gold)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--a-border)'
              e.currentTarget.style.color = 'var(--a-text-secondary)'
            }}
          >
            <Download size={14} /> Export CSV
          </a>
          <button
            type="button"
            onClick={() => setAddFieldOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 font-body text-sm font-medium text-white transition-all"
            style={{ background: 'var(--a-gold)' }}
          >
            <Plus size={14} /> Add Field
          </button>
        </div>
      </div>

      {extraFields.length > 0 && (
        <div
          className="mb-6 p-4 border rounded-sm"
          style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}
        >
          <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--a-gold)' }}>
            Custom Fields on Join Form
          </p>
          <div className="flex flex-wrap gap-2">
            {extraFields.map((f) => (
              <span
                key={f.id}
                className="font-body text-xs px-3 py-1 border"
                style={{
                  borderColor: 'var(--a-border)',
                  color: 'var(--a-text-secondary)',
                  background: 'var(--a-surface)',
                }}
              >
                {f.label} {f.required ? '*' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr style={{ background: 'var(--a-sidebar)', borderBottom: `1px solid var(--a-border)` }}>
                <th className="px-4 py-3" style={{ width: '40px' }}>
                  <SelectCheckbox
                    checked={bulk.isAllSelected}
                    onChange={(v) => (v ? bulk.selectAll() : bulk.deselectAll())}
                  />
                </th>
                {['Name', 'Email', 'Phone', 'Location', 'Joined', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: `1px solid var(--a-border)`,
                    background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)',
                  }}
                >
                  <td className="px-4 py-3">
                    <SelectCheckbox checked={bulk.isSelected(m.id)} onChange={() => bulk.toggle(m.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--a-text)' }}>
                    {m.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {m.email}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {m.phone}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {m.state ? `${m.state}, ${m.country}` : m.city ? `${m.city}, ${m.country}` : m.country}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-muted)' }}>
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={togglingId === m.id}
                      onClick={() => toggleSubscribed(m)}
                      className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase transition-opacity disabled:opacity-40"
                      style={{
                        background: m.isSubscribed ? 'var(--a-gold-light)' : 'var(--a-sidebar)',
                        color: m.isSubscribed ? 'var(--a-gold)' : 'var(--a-text-muted)',
                        border: `1px solid ${m.isSubscribed ? 'var(--a-gold-border)' : 'var(--a-border)'}`,
                      }}
                    >
                      {togglingId === m.id ? '…' : m.isSubscribed ? 'Active' : 'Unsubscribed'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length < total && (
          <div className="p-4 text-center border-t" style={{ borderColor: 'var(--a-border)' }}>
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="font-body text-sm transition-colors disabled:opacity-40"
              style={{ color: 'var(--a-gold)' }}
            >
              {loading ? 'Loading…' : `Load more (${total - members.length} remaining)`}
            </button>
          </div>
        )}
      </div>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={members.length}
        actions={[
          {
            label: 'Delete',
            icon: <Trash2 size={12} />,
            onClick: () => void bulkDelete(),
            variant: 'danger',
          },
        ]}
      />

      <AnimatePresence>
        {addFieldOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddFieldOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
              style={{ background: 'var(--a-surface)', borderLeft: '1px solid var(--a-border)' }}
            >
              <div className="p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
                    Add Field to Join Form
                  </h3>
                  <button type="button" onClick={() => setAddFieldOpen(false)} style={{ color: 'var(--a-text-muted)' }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="h-px" style={{ background: 'var(--a-border)' }} />

                <div>
                  <label
                    className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
                    style={{ color: 'var(--a-text-secondary)' }}
                  >
                    Field Label *
                  </label>
                  <input
                    value={newField.label}
                    onChange={(e) => setNewField((p) => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. What are your expectations?"
                    className="w-full border px-4 py-3 font-body text-sm focus:outline-none transition-colors"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
                  />
                </div>

                <div>
                  <label
                    className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
                    style={{ color: 'var(--a-text-secondary)' }}
                  >
                    Field Type
                  </label>
                  <select
                    value={newField.type}
                    onChange={(e) => setNewField((p) => ({ ...p, type: e.target.value as FieldType }))}
                    className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                  >
                    <option value={FieldType.SHORT_TEXT}>Short Text</option>
                    <option value={FieldType.LONG_TEXT}>Long Text</option>
                    <option value={FieldType.EMAIL}>Email</option>
                    <option value={FieldType.PHONE}>Phone</option>
                    <option value={FieldType.NUMBER}>Number</option>
                    <option value={FieldType.DROPDOWN}>Dropdown</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
                    style={{ color: 'var(--a-text-secondary)' }}
                  >
                    Placeholder
                  </label>
                  <input
                    value={newField.placeholder}
                    onChange={(e) => setNewField((p) => ({ ...p, placeholder: e.target.value }))}
                    placeholder="Optional placeholder text"
                    className="w-full border px-4 py-3 font-body text-sm focus:outline-none"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--a-gold)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--a-border)')}
                  />
                </div>

                <AdminToggle
                  checked={newField.required}
                  onChange={(val) => setNewField((p) => ({ ...p, required: val }))}
                  label="Required"
                />

                <button
                  type="button"
                  onClick={saveField}
                  disabled={savingField}
                  className="w-full py-3 font-body font-medium text-sm tracking-widest uppercase text-white transition-colors disabled:opacity-40"
                  style={{ background: 'var(--a-gold)' }}
                >
                  {savingField ? 'Adding…' : 'Add to Join Form'}
                </button>

                <p className="text-xs font-body" style={{ color: 'var(--a-text-muted)' }}>
                  This field will immediately appear on the public /join page for new registrations. For dropdowns, add options via the database or a future editor — use JSON array for now if needed.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
