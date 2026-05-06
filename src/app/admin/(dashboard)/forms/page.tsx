import Link from 'next/link'
import { db } from '@/lib/db'
import { FormCard } from '@/components/admin/forms/FormCard'
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
          <h2 className="font-display text-2xl text-white">Forms</h2>
          <p className="text-white/40 text-sm font-body mt-1">
            Create and manage all community forms
          </p>
        </div>
        <Link
          href="/admin/forms/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold text-black text-sm font-body font-medium tracking-wide hover:bg-gold-light transition-colors w-fit"
        >
          <Plus size={16} />
          New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div
          className="text-center py-24 border border-dashed"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}
        >
          <p className="font-display text-2xl text-white/30 italic">No forms yet</p>
          <p className="text-white/20 text-sm mt-2 font-body">Create your first form to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </div>
      )}
    </div>
  )
}
