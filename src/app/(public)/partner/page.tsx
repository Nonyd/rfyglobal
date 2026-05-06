import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PartnershipClientPage } from '@/components/partnership/PartnershipClientPage'
import { getContentMany } from '@/lib/content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner With Us — Room For You',
  description: 'Support the vision of Room For You. Your giving fuels the mission of Jesus to Nations.',
}

export const dynamic = 'force-dynamic'

export default async function PartnerPage() {
  const content = await getContentMany([
    'partnership.hero.headline',
    'partnership.hero.subtext',
    'partnership.hero.scripture',
    'partnership.card1.title',
    'partnership.card1.desc',
    'partnership.card2.title',
    'partnership.card2.desc',
    'partnership.card3.title',
    'partnership.card3.desc',
    'partnership.bank.bankName',
    'partnership.bank.accountName',
    'partnership.bank.accountNumber',
    'partnership.bank.contactEmail',
  ])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <PartnershipClientPage content={content} />
      </main>
      <Footer />
    </>
  )
}
