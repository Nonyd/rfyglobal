'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, Copy, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      className={cn(
        'border p-5 transition-all duration-200',
        isActive ? 'border-gold/30 bg-gold/5' : 'border-white/10 bg-white/[0.02]'
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-lg text-white">{form.title}</h3>
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 font-body tracking-widest uppercase',
                isActive ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/40'
              )}
            >
              {isActive ? 'Live' : 'Draft'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-white/40 font-body">
            <span className="font-mono text-gold/60">/forms/{form.slug}</span>
            <span>{form._count.fields} fields</span>
            <span>{form._count.submissions} submissions</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={toggleActive}
            disabled={loading}
            className="p-2 text-white/40 hover:text-gold transition-colors disabled:opacity-50"
            title={isActive ? 'Deactivate' : 'Activate'}
          >
            {isActive ? <ToggleRight size={18} className="text-gold" /> : <ToggleLeft size={18} />}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="p-2 text-white/40 hover:text-gold transition-colors"
            title="Copy public link"
          >
            <Copy size={16} />
          </button>
          <Link
            href={`/forms/${form.slug}`}
            target="_blank"
            className="p-2 text-white/40 hover:text-gold transition-colors inline-flex"
            title="Preview form"
          >
            <ExternalLink size={16} />
          </Link>
          <Link
            href={`/admin/forms/${form.id}/entries`}
            className="p-2 text-white/40 hover:text-gold transition-colors inline-flex"
            title="View entries"
          >
            <Eye size={16} />
          </Link>
          <Link
            href={`/admin/forms/${form.id}/edit`}
            className="p-2 text-white/40 hover:text-white transition-colors inline-flex"
            title="Edit form"
          >
            <Edit size={16} />
          </Link>
          <button
            type="button"
            onClick={deleteForm}
            className="p-2 text-white/40 hover:text-red-brand transition-colors"
            title="Delete form"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
