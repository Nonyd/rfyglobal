import { db } from '@/lib/db'
import { PartnerAdminClient } from '@/components/admin/partner/PartnerAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPartnerPage() {
  const [records, agg] = await Promise.all([
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

  const totalAmount = agg._sum.amount ?? 0
  const successCount = agg._count.id ?? 0
  const pendingFailedCount = records.filter((r) => r.status !== 'SUCCESS').length

  return (
    <PartnerAdminClient
      initialRecords={records}
      initialStats={{
        totalAmount,
        successCount,
        pendingFailedCount,
      }}
    />
  )
}
