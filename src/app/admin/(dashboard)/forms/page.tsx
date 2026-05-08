import Link from 'next/link'
import { db } from '@/lib/db'
import { FormsManager } from '@/components/admin/forms/FormsManager'
import { Plus } from 'lucide-react'

export default async function FormsPage() {
  const forms = await db.form.findMany({
    include: { _count: { select: { submissions: true, fields: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>Forms</h2>
          <p className="text-sm font-body mt-1" style={{ color: 'var(--a-text-muted)' }}>
            Create and manage all community forms
          </p>
        </div>
        <Link
          href="/admin/forms/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-body font-medium tracking-wide transition-colors w-fit"
          style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
        >
          <Plus size={16} />
          New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div
          className="text-center py-24 border border-dashed"
          style={{ borderColor: 'var(--a-gold-border)' }}
        >
          <p className="font-display text-2xl italic" style={{ color: 'var(--a-text-muted)' }}>No forms yet</p>
          <p className="text-sm mt-2 font-body" style={{ color: 'var(--a-text-muted)' }}>Create your first form to get started</p>
        </div>
      ) : (
        <FormsManager initialForms={forms} />
      )}
    </div>
  )
}
