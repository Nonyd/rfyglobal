import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { PartnershipClientPage } from '@/components/partnership/PartnershipClientPage'
import { getContentMany } from '@/lib/content'
import {
  getBankTransferCredentials,
  getFlutterwaveCredentials,
  getPayazaCredentials,
  getPaymentSettings,
  getPaystackCredentials,
} from '@/lib/credentials'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Partner With Us — Room For You',
  description: 'Support the vision of Room For You. Your giving fuels the mission of Jesus to Nations.',
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
    getPaymentSettings(),
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
