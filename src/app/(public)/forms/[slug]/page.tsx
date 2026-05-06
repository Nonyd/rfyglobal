import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { PublicFormRenderer } from '@/components/forms/PublicFormRenderer'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

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
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-4">
              Room For You
            </p>
            <h1 className="font-display text-3xl lg:text-4xl text-white mb-4">{publicForm.title}</h1>
            {publicForm.description ? (
              <p className="text-white/50 font-body leading-relaxed">{publicForm.description}</p>
            ) : null}
            <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mt-8" />
          </div>

          <PublicFormRenderer form={publicForm} />
        </div>
      </main>
      <Footer />
    </>
  )
}
