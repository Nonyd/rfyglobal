import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPartnerPage() {
  const [records, stats] = await Promise.all([
    db.givingRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.givingRecord.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const total = stats._sum.amount ?? 0
  const count = stats._count.id ?? 0

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-white">Partnership Records</h2>
        <p className="text-white/40 text-sm font-body mt-1">All giving records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Confirmed Gifts', value: count.toLocaleString() },
          { label: 'Total Amount (NGN)', value: `₦${total.toLocaleString()}` },
          {
            label: 'Pending / Failed',
            value: records.filter((r) => r.status !== 'SUCCESS').length.toString(),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border p-5"
            style={{ borderColor: 'rgba(201,168,76,0.2)' }}
          >
            <p className="text-xs uppercase tracking-widest text-white/40 font-body mb-2">{stat.label}</p>
            <p className="font-display text-3xl text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="border overflow-hidden" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: 'rgba(201,168,76,0.15)', background: '#111' }}
              >
                {['Date', 'Name', 'Email', 'Amount', 'Gateway', 'Frequency', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold/70">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-white/2 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <td className="px-4 py-3 text-white/50">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-white">{r.donorName ?? '—'}</td>
                  <td className="px-4 py-3 text-white/60">{r.donorEmail ?? '—'}</td>
                  <td className="px-4 py-3 text-white font-medium">₦{r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/60">{r.gateway}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {String((r.meta as { frequency?: string } | null)?.frequency ?? '—')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 uppercase tracking-widest ${
                        r.status === 'SUCCESS'
                          ? 'bg-gold/20 text-gold'
                          : r.status === 'PENDING'
                            ? 'bg-white/10 text-white/50'
                            : 'bg-red-brand/20 text-red-brand'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-xl text-white/30 italic">No giving records yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
