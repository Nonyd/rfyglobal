import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { FormEntriesTable } from '@/components/admin/forms/FormEntriesTable'

export default async function FormEntriesPage({ params }: { params: { id: string } }) {
  const form = await db.form.findUnique({
    where: { id: params.id },
    include: {
      fields: { orderBy: { order: 'asc' } },
      submissions: {
        include: { values: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { submissions: true } },
    },
  })

  if (!form) notFound()

  return (
    <div>
      <Link
        href="/admin/forms"
        className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-gold font-body mb-6"
      >
        <ChevronLeft size={14} />
        All forms
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-white">{form.title}</h2>
          <p className="text-white/40 text-sm font-body mt-1">
            {form._count.submissions} total submissions
          </p>
        </div>
        <a
          href={`/api/forms/${form.id}/entries/export`}
          className="inline-flex justify-center px-5 py-2.5 border border-gold/50 text-gold text-sm font-body hover:bg-gold/10 transition-colors w-fit"
        >
          Export CSV
        </a>
      </div>

      <FormEntriesTable form={form} />
    </div>
  )
}
