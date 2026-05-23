import type { Metadata } from 'next'
import { FileText, CheckSquare, Download } from 'lucide-react'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/db'
import { getContentMany } from '@/lib/content'
import { getPageMetadata, pageHeaderFromContent } from '@/lib/cms-metadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(
    'Study Portal — Room For You',
    'Free Bible study materials, tasks, and resources from Room For You. Identity in Christ, the discipline of prayer, and more. Open to everyone.',
    '/study',
  )
}

export default async function StudyPage() {
  const [series, cms] = await Promise.all([
    db.studySeries.findMany({
    orderBy: { order: 'asc' },
    include: {
      materials: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  }),
    getContentMany(['pages.study.eyebrow', 'pages.study.title', 'pages.study.subtitle']),
  ])

  const header = pageHeaderFromContent(cms, 'study')

  return (
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader {...header} />

      <div className="mx-auto max-w-5xl space-y-12 px-6">
        {series.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl italic text-text-muted">Study materials coming soon.</p>
          </div>
        ) : (
          series.map((s) => (
            <div key={s.id} className="border-l-4 border-crimson/50 pl-6 md:pl-8">
              <h2 className="mb-2 font-display text-2xl text-text-primary lg:text-3xl">{s.title}</h2>
              {s.description && <p className="mb-6 font-body text-text-secondary">{s.description}</p>}

              {s.materials.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-crimson/80">Materials</h3>
                  <div className="space-y-2">
                    {s.materials.map((m) => (
                      <a
                        key={m.id}
                        href={m.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rfy-focus group flex items-center gap-3 border border-theme bg-surface/50 p-4 transition-colors hover:border-crimson/40"
                      >
                        <FileText size={16} className="shrink-0 text-crimson/70" />
                        <span className="flex-1 font-body text-sm text-text-primary transition-colors group-hover:text-crimson">
                          {m.title}
                        </span>
                        <Download size={14} className="text-text-muted transition-colors group-hover:text-crimson" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {s.tasks.length > 0 && (
                <div>
                  <h3 className="mb-4 font-body text-xs uppercase tracking-[0.2em] text-crimson/80">Tasks</h3>
                  <div className="space-y-3">
                    {s.tasks.map((t) => (
                      <div key={t.id} className="rfy-card flex items-start gap-3 p-4">
                        <CheckSquare size={16} className="mt-0.5 shrink-0 text-crimson/70" />
                        <div>
                          <p className="font-body text-sm font-medium text-text-primary">{t.title}</p>
                          {t.description && (
                            <p className="mt-1 font-body text-sm text-text-secondary">{t.description}</p>
                          )}
                          {t.dueDate && (
                            <p className="mt-1 font-body text-xs text-crimson/60">Due: {formatDate(t.dueDate)}</p>
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
    </PublicPageShell>
  )
}
