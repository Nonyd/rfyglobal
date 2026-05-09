import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { DEFAULT_OG_IMAGE } from '@/lib/seo'

const ConfessionPageClient = dynamic(
  () => import('@/components/confession/ConfessionPageClient').then((m) => m.ConfessionPageClient),
  { ssr: false, loading: () => <div className="min-h-screen bg-bg" aria-hidden /> },
)

export const metadata: Metadata = {
  title: 'The Confession — Room For You',
  description:
    'The declaration of every member of Room For You. I am saved by grace through faith. Jesus to Nations. Read the full confession.',
  alternates: { canonical: 'https://rfyglobal.org/confession' },
  openGraph: {
    title: 'The Confession — Room For You',
    description:
      'The declaration of every member of Room For You. I am saved by grace through faith. Jesus to Nations. Read the full confession.',
    url: 'https://rfyglobal.org/confession',
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

export default function ConfessionPage() {
  return (
    <PublicPageShell hideFooter mainClassName="pb-0">
      <ConfessionPageClient />
    </PublicPageShell>
  )
}
