import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { PartnershipClientPage } from '@/components/partnership/PartnershipClientPage'
import { getContentMany } from '@/lib/content'
import {
  getBankTransferCredentials,
  getFlutterwaveCredentials,
  getPayazaCredentials,
  getMinimumGiftSettings,
  getPaystackCredentials,
} from '@/lib/credentials'
import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Partner — Support the Room For You Mission',
  description:
    'Partner with Room For You to fuel the Gospel mission. Every gift supports community gatherings, Bible study resources, and evangelical outreach. Give today.',
  alternates: { canonical: 'https://rfyglobal.org/partner' },
  openGraph: {
    title: 'Partner — Support the Room For You Mission',
    description:
      'Partner with Room For You to fuel the Gospel mission. Every gift supports community gatherings, Bible study resources, and evangelical outreach. Give today.',
    url: 'https://rfyglobal.org/partner',
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

export default async function PartnerPage() {
  const [content, paystack, flutterwave, payaza, bank, settings] = await Promise.all([
    getContentMany([
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
    ]),
    getPaystackCredentials(),
    getFlutterwaveCredentials(),
    getPayazaCredentials(),
    getBankTransferCredentials(),
    getMinimumGiftSettings(),
  ])
  const isTestMode =
    (paystack?.isActive && paystack?.mode === 'test') ||
    (flutterwave?.isActive && flutterwave?.mode === 'test') ||
    (payaza?.isActive && payaza?.mode === 'test')

  return (
    <PublicPageShell mainClassName="pb-0">
      <PartnershipClientPage
        content={content}
        gateways={{
          paystack: paystack?.isActive ?? false,
          flutterwave: flutterwave?.isActive ?? false,
          payaza: payaza?.isActive ?? false,
        }}
        bankDetails={bank ?? null}
        minimumAmount={settings?.minimumGiftAmount ?? 100}
        isTestMode={Boolean(isTestMode)}
      />
    </PublicPageShell>
  )
}
