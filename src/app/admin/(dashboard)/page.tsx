import { db } from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { QuickActions } from '@/components/admin/QuickActions'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  let memberCount = 0
  let formCount = 0
  let submissionCount = 0
  let postCount = 0
  let eventCount = 0
  let giftStats: { _sum: { amount: number | null }; _count: { id: number } } = {
    _sum: { amount: 0 },
    _count: { id: 0 },
  }
  let todayScripture: { reference: string; text: string } | null = null
  let recentSubmissions: Array<{ form: { title: string }; createdAt: Date }> = []
  let recentGifts: Array<{ amount: number; gateway: string; createdAt: Date }> = []

  try {
    ;[
      memberCount,
      formCount,
      submissionCount,
      postCount,
      eventCount,
      giftStats,
      todayScripture,
      recentSubmissions,
      recentGifts,
    ] = await Promise.all([
      db.communityMember.count(),
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
  } catch (error) {
    console.error('Admin dashboard data load failed:', error)
  }

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
        <h1 className="font-display text-3xl font-semibold" style={{ color: 'var(--a-text)' }}>
          {greeting}, Nony.
        </h1>
        <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          {now.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 border-l-4 rounded-sm"
            style={{
              background: 'var(--a-surface)',
              borderLeftColor: 'var(--a-gold)',
              border: '1px solid var(--a-border)',
              borderLeftWidth: '4px',
              boxShadow: 'var(--a-shadow)',
            }}
          >
            <p className="mb-3 font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
              {stat.label}
            </p>
            <p className="font-display text-3xl font-bold" style={{ color: 'var(--a-text)' }}>
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
        <p className="font-body text-xs uppercase tracking-[0.15em] font-semibold mb-4" style={{ color: 'var(--a-text-muted)' }}>
          Quick Actions
        </p>
        <QuickActions />
      </div>

      {todayScripture ? (
        <div
          className="admin-card border-l-4 p-6"
          style={{
            background: 'var(--a-surface)',
            borderLeftColor: 'var(--a-gold)',
            border: '1px solid var(--a-border)',
          }}
        >
          <p className="mb-3 font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-gold)' }}>
            Today&apos;s Word
          </p>
          <p className="mb-2 font-display text-xl" style={{ color: 'var(--a-text)' }}>
            {todayScripture.reference}
          </p>
          <p className="font-body text-sm italic leading-relaxed" style={{ color: 'var(--a-text-secondary)' }}>
            &ldquo;{todayScripture.text}&rdquo;
          </p>
        </div>
      ) : null}

      <div>
        <p className="mb-4 font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
          Recent Activity
        </p>
        <div className="space-y-2">
          {activity.length === 0 ? (
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              No recent activity yet.
            </p>
          ) : (
            activity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-sm border" style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}>
                <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.type === 'gift' ? 'var(--a-gold)' : 'var(--a-border)' }} />
                <p className="flex-1 font-body text-sm" style={{ color: 'var(--a-text)' }}>
                  {item.label}
                </p>
                <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
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
