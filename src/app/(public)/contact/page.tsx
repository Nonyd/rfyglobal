import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ContactClient } from '@/components/contact/ContactClient'
import { getContentMany } from '@/lib/content'
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Contact — Room For You',
  description:
    'Get in touch with the Room For You team. Questions about membership, events, partnership, or prayer — we read every message.',
  alternates: { canonical: 'https://rfyglobal.org/contact' },
  openGraph: {
    title: 'Contact — Room For You',
    description:
      'Get in touch with the Room For You team. Questions about membership, events, partnership, or prayer — we read every message.',
    url: 'https://rfyglobal.org/contact',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Room For You — A Christian Community with Minister Yadah',
      },
    ],
  },
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const content = await getContentMany([
    'contact.heading',
    'contact.subheading',
    'contact.email',
    'contact.whatsapp',
    'contact.instagram',
    'contact.youtube',
    'contact.twitter',
    'contact.address',
  ])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24">
        <ContactClient content={content} />
      </main>
      <Footer />
    </>
  )
}
