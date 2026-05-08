import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FaqClient } from '@/components/faq/FaqClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { db } from '@/lib/db'
import { getContentMany } from '@/lib/content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs — Room For You',
  description:
    'Frequently asked questions about Room For You — joining, events, prayer, giving, testimonies, and more.',
  alternates: { canonical: 'https://rfyglobal.org/faq' },
}

export const dynamic = 'force-dynamic'

export default async function FaqPage() {
  const [categories, content] = await Promise.all([
    db.faqCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        faqs: { where: { isActive: true }, orderBy: { order: 'asc' } },
      },
    }),
    getContentMany(['faq.heading', 'faq.subheading']),
  ])
  const faqSchema =
    categories.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: categories.flatMap((cat) =>
            cat.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          ),
        }
      : null

  return (
    <>
      <Navbar />
      {faqSchema && <JsonLd data={faqSchema} />}
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="label-text mb-4">Help & Support</p>
          <h1 className="font-display text-snow font-bold mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            {content['faq.heading'] || 'Frequently Asked\nQuestions.'}
          </h1>
          <div className="gold-line-left w-12 mb-6 opacity-50" />
          <p className="font-body text-mist max-w-lg leading-relaxed mb-16">
            {content['faq.subheading'] || "Can't find what you're looking for? Reach out via our contact page."}
          </p>
          <FaqClient categories={categories} />
        </div>
      </main>
      <Footer />
    </>
  )
}
