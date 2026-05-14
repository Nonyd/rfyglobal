'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useCallback, useEffect, useState } from 'react'
import type { GivingRecord } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { LiveIndicator } from '@/components/admin/shared/LiveIndicator'

type PartnerGiftRow = Pick<
  GivingRecord,
  'id' | 'donorName' | 'donorEmail' | 'amount' | 'gateway' | 'status' | 'meta' | 'createdAt'
>

interface PartnerAdminClientProps {
  initialRecords: PartnerGiftRow[]
  initialStats: {
    totalAmount: number
    successCount: number
    pendingFailedCount: number
  }
}

export function PartnerAdminClient({ initialRecords, initialStats }: PartnerAdminClientProps) {
  const [records, setRecords] = useState<PartnerGiftRow[]>(initialRecords)
  const [stats, setStats] = useState(initialStats)

  const reloadPartnerData = useCallback(async (showToast: boolean) => {
    try {
      const res = await adminFetch('/api/admin/partner/gifts', { cache: 'no-store' })
      if (!res.ok) throw new Error('fail')
      const data = (await res.json()) as {
        records: PartnerGiftRow[]
        stats: typeof initialStats
      }
      setRecords(data.records)
      setStats(data.stats)
      if (showToast) {
        toast('New gift received', {
          icon: '💛',
          style: {
            background: 'var(--a-surface)',
            color: 'var(--a-text)',
            border: '1px solid rgba(201,168,76,0.3)',
          },
          duration: 3000,
        })
      }
    } catch {
      toast.error('Could not refresh partnership records')
    }
  }, [])

  useEffect(() => {
    setRecords(initialRecords)
    setStats(initialStats)
  }, [initialRecords, initialStats])

  const onPartnerSSE = useCallback(() => {
    void reloadPartnerData(true)
  }, [reloadPartnerData])

  useAdminSSE({
    events: ['new_partner'],
    onEvent: onPartnerSSE,
  })

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>
            Partnership Records
          </h2>
          <LiveIndicator />
        </div>
        <p className="mt-1 text-sm font-body" style={{ color: 'var(--a-text-muted)' }}>
          All giving records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total Confirmed Gifts', value: stats.successCount.toLocaleString() },
          { label: 'Total Amount (NGN)', value: `₦${stats.totalAmount.toLocaleString()}` },
          {
            label: 'Pending / Failed',
            value: stats.pendingFailedCount.toString(),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border p-5"
            style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-surface)' }}
          >
            <p className="text-xs uppercase tracking-widest font-body mb-2" style={{ color: 'var(--a-text-muted)' }}>
              {stat.label}
            </p>
            <p className="font-display text-3xl" style={{ color: 'var(--a-text)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="border overflow-hidden" style={{ borderColor: 'var(--a-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}>
                {['Date', 'Name', 'Email', 'Amount', 'Gateway', 'Frequency', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs uppercase tracking-widest"
                    style={{ color: 'var(--a-gold)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b transition-colors" style={{ borderColor: 'var(--a-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-muted)' }}>
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text)' }}>
                    {r.donorName ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {r.donorEmail ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--a-text)' }}>
                    ₦{r.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--a-text-secondary)' }}>
                    {r.gateway}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--a-text-muted)' }}>
                    {String((r.meta as { frequency?: string } | null)?.frequency ?? '—')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 uppercase tracking-widest ${
                        r.status === 'SUCCESS' ? '' : r.status === 'PENDING' ? '' : 'bg-red-brand/20 text-red-brand'
                      }`}
                      style={
                        r.status === 'SUCCESS'
                          ? { background: 'var(--a-gold-light)', color: 'var(--a-gold)' }
                          : r.status === 'PENDING'
                            ? { background: 'var(--a-sidebar-hover)', color: 'var(--a-text-secondary)' }
                            : undefined
                      }
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
            <p className="font-display text-xl italic" style={{ color: 'var(--a-text-muted)' }}>
              No giving records yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
