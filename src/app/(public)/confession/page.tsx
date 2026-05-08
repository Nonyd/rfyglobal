import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/layout/PublicPageShell'

const ConfessionPageClient = dynamic(
  () => import('@/components/confession/ConfessionPageClient').then((m) => m.ConfessionPageClient),
  { ssr: false, loading: () => <div className="min-h-screen bg-bg" aria-hidden /> },
)

export const metadata: Metadata = {
  title: 'The Confession — Room For You',
  description:
    'The declaration of every member of Room For You. I am saved by grace through faith. Jesus to Nations. Read the full confession.',
  alternates: { canonical: 'https://rfyglobal.org/confession' },
}

export default function ConfessionPage() {
  return (
    <PublicPageShell hideFooter mainClassName="pb-0">
      <ConfessionPageClient />
    </PublicPageShell>
  )
}
