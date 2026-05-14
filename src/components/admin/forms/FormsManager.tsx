'use client'

import { adminFetch } from '@/lib/admin-fetch'
import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, ExternalLink, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminToggle } from '@/components/shared/Toggle'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'

type FormRow = {
  id: string
  title: string
  slug: string
  isActive: boolean
  _count: { submissions: number; fields: number }
}

export function FormsManager({ initialForms }: { initialForms: FormRow[] }) {
  const [forms, setForms] = useState(initialForms)
  const bulk = useBulkSelect(forms)

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await adminFetch(`/api/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    if (!res.ok) return false
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, isActive } : f)))
    return true
  }

  const deleteFormRequest = async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const res = await adminFetch(`/api/forms/${id}`, { method: 'DELETE' })
      if (res.ok) return { ok: true }
      const data = (await res.json().catch(() => ({}))) as { error?: unknown }
      const msg =
        typeof data.error === 'string' ? data.error : 'Failed to delete form'
      return { ok: false, error: msg }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  const deleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return
    const result = await deleteFormRequest(id)
    if (result.ok) {
      toast.success('Form deleted')
      setForms((prev) => prev.filter((f) => f.id !== id))
    } else {
      toast.error(result.error)
    }
  }

  const bulkDelete = async () => {
    if (!bulk.selectedCount) return
    if (!confirm(`Delete ${bulk.selectedCount} form${bulk.selectedCount > 1 ? 's' : ''}?`)) return
    const ids = [...bulk.selectedArray]
    let deleted = 0
    for (const id of ids) {
      const result = await deleteFormRequest(id)
      if (result.ok) {
        deleted++
        setForms((prev) => prev.filter((f) => f.id !== id))
      }
    }
    if (deleted > 0) toast.success(`${deleted} form${deleted > 1 ? 's' : ''} deleted`)
    if (deleted < ids.length) toast.error('Some forms failed to delete')
    bulk.reset()
  }

  return (
    <div className="grid gap-4">
      {forms.map((form) => (
        <div
          key={form.id}
          className="group relative border p-5 pl-12"
          style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
        >
          <div className="absolute left-4 top-4">
            <div
              className={bulk.isSelected(form.id) ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100'}
            >
              <SelectCheckbox checked={bulk.isSelected(form.id)} onChange={() => bulk.toggle(form.id)} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>{form.title}</h3>
              <p className="mt-2 text-xs font-body" style={{ color: 'var(--a-text-muted)' }}>
                /forms/{form.slug} · {form._count.fields} fields · {form._count.submissions} submissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AdminToggle checked={form.isActive} onChange={() => void toggleActive(form.id, !form.isActive)} size="sm" />
              <Link href={`/forms/${form.slug}`} target="_blank"><ExternalLink size={16} /></Link>
              <Link href={`/admin/forms/${form.id}/entries`}><Eye size={16} /></Link>
              <Link href={`/admin/forms/${form.id}/edit`}><Edit size={16} /></Link>
              <button type="button" onClick={() => void deleteForm(form.id)} title="Delete form">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={forms.length}
        actions={[{ label: 'Delete', icon: <Trash2 size={12} />, onClick: () => void bulkDelete(), variant: 'danger' }]}
      />
    </div>
  )
}
