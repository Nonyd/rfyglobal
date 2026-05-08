'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, Copy, Trash2, ExternalLink } from 'lucide-react'
import { AdminToggle } from '@/components/shared/Toggle'
import toast from 'react-hot-toast'

interface FormCardProps {
  form: {
    id: string
    title: string
    slug: string
    isActive: boolean
    _count: { submissions: number; fields: number }
  }
}

export function FormCard({ form }: FormCardProps) {
  const [isActive, setIsActive] = useState(form.isActive)
  const [loading, setLoading] = useState(false)

  const toggleActive = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) {
        setIsActive(!isActive)
        toast.success(isActive ? 'Form deactivated' : 'Form is now live')
      } else {
        toast.error('Failed to update form')
      }
    } catch {
      toast.error('Failed to update form')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/forms/${form.slug}`
    void navigator.clipboard.writeText(url)
    toast.success('Form link copied!')
  }

  const deleteForm = async () => {
    if (!confirm(`Delete "${form.title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/forms/${form.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Form deleted')
      window.location.reload()
    } else {
      toast.error('Failed to delete form')
    }
  }

  return (
    <div
      className="border p-5 transition-all duration-200"
      style={{
        borderColor: isActive ? 'var(--a-gold-border)' : 'var(--a-border)',
        background: isActive ? 'var(--a-gold-light)' : 'var(--a-surface)',
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>{form.title}</h3>
            <span
              className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase"
              style={{
                background: isActive ? 'var(--a-gold-light)' : 'var(--a-sidebar-hover)',
                color: isActive ? 'var(--a-gold)' : 'var(--a-text-muted)',
              }}
            >
              {isActive ? 'Live' : 'Draft'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-body" style={{ color: 'var(--a-text-muted)' }}>
            <span className="font-mono" style={{ color: 'var(--a-gold)' }}>/forms/{form.slug}</span>
            <span>{form._count.fields} fields</span>
            <span>{form._count.submissions} submissions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <AdminToggle
            checked={isActive}
            disabled={loading}
            onChange={() => void toggleActive()}
            size="sm"
            aria-label={isActive ? 'Deactivate form' : 'Activate form'}
          />
          <button
            type="button"
            onClick={copyLink}
            className="p-2 transition-colors"
            style={{ color: 'var(--a-text-muted)' }}
            title="Copy public link"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
          >
            <Copy size={16} />
          </button>
          <Link
            href={`/forms/${form.slug}`}
            target="_blank"
            className="p-2 transition-colors inline-flex"
            style={{ color: 'var(--a-text-muted)' }}
            title="Preview form"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
          >
            <ExternalLink size={16} />
          </Link>
          <Link
            href={`/admin/forms/${form.id}/entries`}
            className="p-2 transition-colors inline-flex"
            style={{ color: 'var(--a-text-muted)' }}
            title="View entries"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
          >
            <Eye size={16} />
          </Link>
          <Link
            href={`/admin/forms/${form.id}/edit`}
            className="p-2 transition-colors inline-flex"
            style={{ color: 'var(--a-text-muted)' }}
            title="Edit form"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
          >
            <Edit size={16} />
          </Link>
          <button
            type="button"
            onClick={deleteForm}
            className="p-2 transition-colors"
            style={{ color: 'var(--a-text-muted)' }}
            title="Delete form"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
