'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useCallback, useEffect, useState } from 'react'
import type { GivingRecord } from '@prisma/client'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { useAdminSSE } from '@/hooks/useAdminSSE'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { LiveIndicator } from '@/components/admin/shared/LiveIndicator'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'

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
  const bulk = useBulkSelect(records)

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

  const deleteGiftRequest = async (id: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const res = await adminFetch(`/api/admin/partner/gifts/${id}`, { method: 'DELETE' })
      if (res.ok) return { ok: true }
      const data = (await res.json().catch(() => ({}))) as { error?: unknown }
      const msg = typeof data.error === 'string' ? data.error : 'Failed to delete record'
      return { ok: false, error: msg }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  const deleteOne = async (r: PartnerGiftRow) => {
    if (!confirm(`Delete this partnership record${r.donorName ? ` (${r.donorName})` : ''}?`)) return
    const result = await deleteGiftRequest(r.id)
    if (result.ok) {
      toast.success('Record deleted')
      bulk.reset()
      await reloadPartnerData(false)
    } else {
      toast.error(result.error)
    }
  }

  const bulkDelete = async () => {
    if (!bulk.selectedCount) return
    if (
      !confirm(
        `Delete ${bulk.selectedCount} partnership record${bulk.selectedCount > 1 ? 's' : ''}? This cannot be undone.`,
      )
    ) {
      return
    }
    const ids = [...bulk.selectedArray]
    let deleted = 0
    for (const id of ids) {
      const result = await deleteGiftRequest(id)
      if (result.ok) deleted++
    }
    if (deleted > 0) {
      toast.success(`${deleted} record${deleted > 1 ? 's' : ''} deleted`)
      await reloadPartnerData(false)
    }
    if (deleted < ids.length) toast.error('Some records failed to delete')
    bulk.reset()
  }

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
                <th className="w-10 px-4 py-3">
                  <SelectCheckbox
                    checked={bulk.isAllSelected}
                    onChange={(v) => (v ? bulk.selectAll() : bulk.deselectAll())}
                  />
                </th>
                {['Date', 'Name', 'Email', 'Amount', 'Gateway', 'Frequency', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs uppercase tracking-widest ${h === 'Actions' ? 'text-right' : 'text-left'}`}
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
                  <td className="px-4 py-3 align-middle">
                    <SelectCheckbox checked={bulk.isSelected(r.id)} onChange={() => bulk.toggle(r.id)} />
                  </td>
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
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void deleteOne(r)}
                      className="inline-flex p-1.5 rounded transition-colors text-[var(--a-text-muted)] hover:text-[var(--a-red)]"
                      title="Delete record"
                    >
                      <Trash2 size={16} />
                    </button>
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

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={records.length}
        actions={[
          {
            label: 'Delete',
            icon: <Trash2 size={12} />,
            onClick: () => void bulkDelete(),
            variant: 'danger',
          },
        ]}
      />
    </div>
  )
}
