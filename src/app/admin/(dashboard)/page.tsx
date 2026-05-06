import { db } from '@/lib/db'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [memberCount, formCount, submissionCount, postCount, eventCount, giftStats, todayScripture, recentSubmissions, recentGifts] = await Promise.all([
    db.formSubmission.count({ where: { form: { slug: { contains: 'join' } } } }),
    db.form.count({ where: { isActive: true } }),
    db.formSubmission.count(),
    db.post.count({ where: { isPublished: true } }),
    db.event.count({ where: { isActive: true, date: { gte: now } } }),
    db.givingRecord.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true }, _count: { id: true } }),
    db.scripture.findFirst({
      where: {
        scheduledAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
        isActive: true,
      },
    }),
    db.formSubmission.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { form: { select: { title: true } } } }),
    db.givingRecord.findMany({ take: 5, where: { status: 'SUCCESS' }, orderBy: { createdAt: 'desc' } }),
  ])

  const stats = [
    { label: 'Community Members', value: memberCount.toLocaleString(), trend: '+12%', trendUp: true },
    { label: 'Active Forms', value: formCount.toLocaleString(), trend: null, trendUp: true },
    { label: 'Form Submissions', value: submissionCount.toLocaleString(), trend: '+8%', trendUp: true },
    { label: 'Published Posts', value: postCount.toLocaleString(), trend: null, trendUp: true },
    { label: 'Upcoming Events', value: eventCount.toLocaleString(), trend: null, trendUp: true },
    { label: 'Total Gifts (₦)', value: `₦${(giftStats._sum.amount ?? 0).toLocaleString()}`, trend: `${giftStats._count.id} gifts`, trendUp: true },
  ]

  const activity = [
    ...recentSubmissions.map((s) => ({ type: 'submission' as const, label: `New submission on "${s.form.title}"`, time: s.createdAt })),
    ...recentGifts.map((g) => ({ type: 'gift' as const, label: `₦${g.amount.toLocaleString()} gift via ${g.gateway}`, time: g.createdAt })),
  ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--admin-text)' }}>
          {greeting}, Nony.
        </h1>
        <p className="mt-1 font-body text-sm" style={{ color: 'var(--admin-text-muted)' }}>
          {now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="shadow-sm border-l-4 p-5"
            style={{
              background: 'var(--admin-surface)',
              borderLeftColor: 'var(--admin-gold)',
              borderTop: '1px solid var(--admin-border)',
              borderRight: '1px solid var(--admin-border)',
              borderBottom: '1px solid var(--admin-border)',
            }}
          >
            <p className="mb-3 font-body text-xs uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>
              {stat.label}
            </p>
            <p className="font-display text-3xl font-bold" style={{ color: 'var(--admin-text)' }}>
              {stat.value}
            </p>
            {stat.trend ? (
              <p className={`mt-2 font-body text-xs ${stat.trendUp ? 'text-green-600' : 'text-red-500'}`}>
                {stat.trendUp ? '↑' : '↓'} {stat.trend}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <p className="font-body text-xs uppercase tracking-[0.15em] font-semibold mb-4" style={{ color: 'var(--admin-text-muted)' }}>
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '+ New Scripture', href: '/admin/scripture' },
            { label: '+ New Post', href: '/admin/blog/new' },
            { label: '+ New Event', href: '/admin/events' },
            { label: '+ Upload Photos', href: '/admin/gallery' },
            { label: '+ New Form', href: '/admin/forms/new' },
            { label: 'View Partners', href: '/admin/partner' },
          ].map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="px-4 py-2.5 font-body text-sm font-medium border transition-all"
              style={{
                background: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--admin-gold)'
                e.currentTarget.style.color = 'var(--admin-gold)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--admin-border)'
                e.currentTarget.style.color = 'var(--admin-text-secondary)'
              }}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      {todayScripture ? (
        <div
          className="admin-card border-l-4 p-6"
          style={{ borderLeftColor: 'var(--admin-gold)', background: 'var(--admin-sidebar)' }}
        >
          <p className="mb-3 font-body text-xs uppercase tracking-widest" style={{ color: 'var(--admin-gold)' }}>
            Today&apos;s Word
          </p>
          <p className="mb-2 font-display text-xl" style={{ color: 'var(--admin-text)' }}>
            {todayScripture.reference}
          </p>
          <p className="font-body text-sm italic leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
            &ldquo;{todayScripture.text}&rdquo;
          </p>
        </div>
      ) : null}

      <div>
        <p className="mb-4 font-body text-xs uppercase tracking-widest" style={{ color: 'var(--admin-text-muted)' }}>
          Recent Activity
        </p>
        <div className="space-y-2">
          {activity.length === 0 ? (
            <p className="font-body text-sm" style={{ color: 'var(--admin-text-muted)' }}>
              No recent activity yet.
            </p>
          ) : (
            activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.type === 'gift' ? 'var(--admin-gold)' : 'var(--admin-border)' }} />
                <p className="flex-1 font-body text-sm" style={{ color: 'var(--admin-text)' }}>
                  {item.label}
                </p>
                <p className="font-body text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                  {formatDistanceToNow(item.time, { addSuffix: true })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
