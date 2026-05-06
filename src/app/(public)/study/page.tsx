import type { Metadata } from 'next'
import { FileText, CheckSquare, Download } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Study Portal — Room For You',
  description: 'Bible study materials, tasks, and resources from Room For You.',
}

export default async function StudyPage() {
  const series = await db.studySeries.findMany({
    orderBy: { order: 'asc' },
    include: {
      materials: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pb-16 pt-24">
        <div className="mx-auto mb-16 max-w-7xl px-6 text-center">
          <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Room For You</p>
          <h1 className="mb-4 font-display text-4xl text-white lg:text-6xl">Study Portal</h1>
          <p className="mx-auto max-w-xl font-body text-white/50">
            Materials, resources, and tasks to help you grow in the Word. Open to everyone — no account
            required.
          </p>
          <div className="mx-auto mt-8 h-px max-w-xs bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <div className="mx-auto max-w-5xl space-y-12 px-6">
          {series.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl italic text-white/30">Study materials coming soon.</p>
            </div>
          ) : (
            series.map((s) => (
              <div key={s.id} className="border-l-2 border-gold/40 pl-8">
                <h2 className="mb-2 font-display text-2xl text-white lg:text-3xl">{s.title}</h2>
                {s.description && <p className="mb-6 font-body text-white/50">{s.description}</p>}

                {s.materials.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-4 font-body text-xs uppercase tracking-widest text-gold/70">
                      Materials
                    </h3>
                    <div className="space-y-2">
                      {s.materials.map((m) => (
                        <a
                          key={m.id}
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 border border-white/10 p-4 transition-colors hover:border-gold/30"
                        >
                          <FileText size={16} className="shrink-0 text-gold/60" />
                          <span className="flex-1 font-body text-sm text-white/80 transition-colors group-hover:text-white">
                            {m.title}
                          </span>
                          <Download
                            size={14}
                            className="text-white/30 transition-colors group-hover:text-gold"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {s.tasks.length > 0 && (
                  <div>
                    <h3 className="mb-4 font-body text-xs uppercase tracking-widest text-gold/70">
                      Tasks
                    </h3>
                    <div className="space-y-3">
                      {s.tasks.map((t) => (
                        <div key={t.id} className="flex items-start gap-3 border border-white/10 p-4">
                          <CheckSquare size={16} className="mt-0.5 shrink-0 text-gold/60" />
                          <div>
                            <p className="font-body text-sm font-medium text-white">{t.title}</p>
                            {t.description && (
                              <p className="mt-1 font-body text-sm text-white/50">{t.description}</p>
                            )}
                            {t.dueDate && (
                              <p className="mt-1 font-body text-xs text-gold/50">
                                Due: {formatDate(t.dueDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
