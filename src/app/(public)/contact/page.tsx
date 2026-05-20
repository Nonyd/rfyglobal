import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ContactClient } from '@/components/contact/ContactClient'
import { getContentMany } from '@/lib/content'
import { CONTACT_CMS_KEYS } from '@/lib/cms-keys'
import { getPageMetadata } from '@/lib/cms-metadata'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Contact — Room For You',
    'Get in touch with the Room For You team. Questions about membership, events, partnership, or prayer — we read every message.',
    '/contact',
  )
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const content = await getContentMany([...CONTACT_CMS_KEYS])

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
