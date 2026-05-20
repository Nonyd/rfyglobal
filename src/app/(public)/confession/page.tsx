import nextDynamic from 'next/dynamic'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { getContentMany } from '@/lib/content'
import { CONFESSION_CMS_KEYS } from '@/lib/cms-keys'
import { getPageMetadata } from '@/lib/cms-metadata'
import type { Metadata } from 'next'

const ConfessionPageClient = nextDynamic(
  () => import('@/components/confession/ConfessionPageClient').then((m) => m.ConfessionPageClient),
  { ssr: false, loading: () => <div className="min-h-screen bg-bg" aria-hidden /> },
)

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'The Confession — Room For You',
    'The declaration of every member of Room For You. I am saved by grace through faith. Jesus to Nations. Read the full confession.',
    '/confession',
  )
}

export const dynamic = 'force-dynamic'

export default async function ConfessionPage() {
  const content = await getContentMany([...CONFESSION_CMS_KEYS])

  return (
    <PublicPageShell hideFooter mainClassName="pb-0">
      <ConfessionPageClient content={content} />
    </PublicPageShell>
  )
}
