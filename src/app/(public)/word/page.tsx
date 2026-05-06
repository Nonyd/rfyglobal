import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WordClientPage } from '@/components/word/WordClientPage'
import type { Metadata } from 'next'
import type { Scripture } from '@prisma/client'

export const metadata: Metadata = {
  title: 'The Word — Room For You',
  description: 'Daily scriptures and audio devotionals from Room For You.',
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
      },
    }),
    db.scripture.findMany({
      where: { isActive: true },
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
    <>
      <Navbar />
      <main className="min-h-screen bg-black pb-16 pt-24">
        <div className="mx-auto mb-16 max-w-4xl px-6 text-center">
          <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Room For You</p>
          <h1 className="mb-4 font-display text-5xl leading-none text-white lg:text-7xl">The Word</h1>
          <p className="mx-auto max-w-md font-body text-white/50">
            One scripture. Every day. With audio to bring it alive.
          </p>
          <div className="mx-auto mt-8 h-px max-w-xs bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <WordClientPage today={today} allScriptures={scriptures} />
      </main>
      <Footer />
    </>
  )
}
