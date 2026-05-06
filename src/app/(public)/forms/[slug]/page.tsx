import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { PublicFormRenderer } from '@/components/forms/PublicFormRenderer'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const form = await db.form.findUnique({ where: { slug: params.slug, isActive: true } })
  return {
    title: form ? `${form.title} — Room For You` : 'Form',
    description: form?.description ?? undefined,
  }
}

export default async function PublicFormPage({ params }: { params: { slug: string } }) {
  const form = await db.form.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) notFound()

  const { notifyEmail, ...publicForm } = form
  void notifyEmail

  return (
    <PublicPageShell mainClassName="pb-16 pt-6 md:pb-20">
      <div className="mx-auto max-w-2xl px-6 pt-20 md:pt-24">
        <div className="mb-10 text-center">
          <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Room For You</p>
          <h1 className="mb-4 font-display text-3xl text-text-primary lg:text-4xl">{publicForm.title}</h1>
          {publicForm.description ? (
            <p className="font-body leading-relaxed text-text-secondary">{publicForm.description}</p>
          ) : null}
          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <PublicFormRenderer form={publicForm} />
      </div>
    </PublicPageShell>
  )
}
