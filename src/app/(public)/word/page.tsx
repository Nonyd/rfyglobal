import { db } from '@/lib/db'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { WordClientPage } from '@/components/word/WordClientPage'
import { getContentMany } from '@/lib/content'
import { getPageMetadata, pageHeaderFromContent } from '@/lib/cms-metadata'
import type { Metadata } from 'next'
import type { Scripture } from '@prisma/client'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Daily Word — Scripture from Room For You',
    'One scripture every day with audio commentary from Minister Yadah and the Room For You team. Rooted in the Word. Grounded in grace.',
    '/word',
  )
}

export const dynamic = 'force-dynamic'

export default async function WordPage() {
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [todayRes, scriptures, cms] = await Promise.all([
    db.scripture.findFirst({
      where: {
        scheduledAt: { gte: dayStart, lt: dayEnd },
        isActive: true,
        isDraft: false,
      },
    }),
    db.scripture.findMany({
      where: { isActive: true, isDraft: false },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    }),
    getContentMany(['pages.word.eyebrow', 'pages.word.title', 'pages.word.subtitle']),
  ])

  const header = pageHeaderFromContent(cms, 'word', {
    title: 'The Word',
    subtitle: 'One scripture. Every day. With audio to bring it alive.',
  })

  let today: Scripture | null = todayRes
  if (!today) {
    const pool = scriptures.filter((s) => !s.scheduledAt)
    if (pool.length > 0) {
      const d = new Date()
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
      today = pool[seed % pool.length] ?? null
    }
  }

  return (
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader {...header} />

      <WordClientPage today={today} allScriptures={scriptures} />
    </PublicPageShell>
  )
}
