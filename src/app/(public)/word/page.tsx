import { db } from '@/lib/db'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { WordClientPage } from '@/components/word/WordClientPage'
import type { Metadata } from 'next'
import type { Scripture } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Daily Word — Scripture from Room For You',
  description:
    'One scripture every day with audio commentary from Minister Yadah and the Room For You team. Rooted in the Word. Grounded in grace.',
  alternates: { canonical: 'https://rfyglobal.org/word' },
}

export const dynamic = 'force-dynamic'

export default async function WordPage() {
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const [todayRes, scriptures] = await Promise.all([
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
  ])

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
      <PublicPageHeader
        eyebrow="Room For You"
        title="The Word"
        subtitle="One scripture. Every day. With audio to bring it alive."
      />

      <WordClientPage today={today} allScriptures={scriptures} />
    </PublicPageShell>
  )
}
