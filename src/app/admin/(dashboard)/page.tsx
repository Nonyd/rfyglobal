import Link from 'next/link'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function AdminHomePage() {
  const [formCount, submissionCount, activeEvents, publishedPosts, recentSubmissions] =
    await Promise.all([
      db.form.count(),
      db.formSubmission.count(),
      db.event.count({ where: { isActive: true } }),
      db.post.count({ where: { isPublished: true } }),
      db.formSubmission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          form: { select: { title: true } },
          values: { take: 4 },
        },
      }),
    ])

  const modules = [
    { label: 'Forms', href: '/admin/forms', hint: 'Form builder' },
    { label: 'Scripture', href: '/admin/scripture', hint: 'Daily scripture' },
    { label: 'Blog', href: '/admin/blog', hint: 'Posts & devotionals' },
    { label: 'Study', href: '/admin/study', hint: 'Study portal' },
    { label: 'Events', href: '/admin/events', hint: 'Events calendar' },
    { label: 'Partnership', href: '/admin/partner', hint: 'Giving & partners' },
  ]

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl text-white">{greeting()}, Admin.</h1>
        <p className="font-body text-white/50 mt-2 text-sm">
          Here is a snapshot of your Room For You content.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Forms', value: formCount },
          { label: 'Total Submissions', value: submissionCount },
          { label: 'Active Events', value: activeEvents },
          { label: 'Published Posts', value: publishedPosts },
        ].map((card) => (
          <div
            key={card.label}
            className="border border-white/10 bg-white/[0.02] p-5"
          >
            <p className="text-[10px] uppercase tracking-widest text-white/35 font-body mb-2">
              {card.label}
            </p>
            <p className="font-display text-3xl text-gold">{card.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg text-white mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="px-4 py-2 text-xs font-body border border-gold/25 text-white/70 hover:border-gold/50 hover:text-gold transition-colors"
            >
              {m.label}
              <span className="text-white/30"> · {m.hint}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg text-white mb-4">Recent form submissions</h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-white/35 text-sm font-body">No submissions yet.</p>
        ) : (
          <ul className="space-y-3">
            {recentSubmissions.map((s) => {
              const preview = s.values
                .map((v) => `${v.fieldLabel}: ${v.value}`)
                .join(' · ')
              return (
                <li
                  key={s.id}
                  className="border border-white/10 bg-white/[0.02] p-4 text-sm font-body"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-white font-medium">{s.form.title}</span>
                    <time className="text-white/35 text-xs">{formatDate(s.createdAt)}</time>
                  </div>
                  <p className="text-white/45 text-xs mt-2 line-clamp-2">{preview || '—'}</p>
                  <Link
                    href={`/admin/forms/${s.formId}/entries`}
                    className="inline-block mt-3 text-xs text-gold hover:text-gold-light"
                  >
                    View entries
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
