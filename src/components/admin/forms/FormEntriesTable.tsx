'use client'

import { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table'
import type { FormField, FormSubmission, FormSubmissionValue } from '@prisma/client'

type FormWithEntries = {
  fields: FormField[]
  submissions: (FormSubmission & { values: FormSubmissionValue[] })[]
}

const columnHelper = createColumnHelper<Record<string, string>>()

const BIRTHDAY_MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function formatEntryValue(type: FormField['type'], value: string): string {
  if (!value) return ''
  switch (type) {
    case 'BIRTHDAY_MONTH': {
      const idx = parseInt(value, 10)
      return BIRTHDAY_MONTH_NAMES[idx] ?? value
    }
    case 'BIRTHDAY_DAY':
      return `Day ${value}`
    default:
      return value
  }
}

function formatSubmittedAt(iso: Date | string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FormEntriesTable({ form }: { form: FormWithEntries }) {
  const rows = useMemo(() => {
    return form.submissions.map((sub) => {
      const map = Object.fromEntries(sub.values.map((v) => [v.fieldLabel, v.value]))
      const row: Record<string, string> = { __submittedAt: formatSubmittedAt(sub.createdAt) }
      for (const f of form.fields) {
        const raw = map[f.label] ?? ''
        row[f.label] = formatEntryValue(f.type, raw)
      }
      return row
    })
  }, [form.fields, form.submissions])

  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor('__submittedAt', {
        header: 'Submitted At',
        cell: (info) => info.getValue(),
      }),
      ...form.fields.map((f) =>
        columnHelper.accessor(f.label, {
          header: f.label,
          cell: (info) => {
            const v = info.getValue()
            return v ? <span style={{ color: 'var(--a-text-secondary)' }}>{v}</span> : <span style={{ color: 'var(--a-text-muted)' }}>—</span>
          },
        })
      ),
    ]
    return cols
  }, [form.fields])

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (rows.length === 0) {
    return (
      <div className="border border-dashed py-16 text-center text-sm font-body" style={{ borderColor: 'var(--a-gold-border)', color: 'var(--a-text-muted)' }}>
        No submissions yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}>
      <table className="w-full min-w-[640px] text-left text-sm font-body">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b" style={{ background: 'var(--a-surface)', borderColor: 'var(--a-gold-border)' }}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-4 py-3 text-xs uppercase tracking-widest font-body whitespace-nowrap"
                  style={{ color: 'var(--a-gold)' }}
                >
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className="border-b"
              style={{ borderColor: 'var(--a-border)', background: i % 2 === 0 ? 'var(--a-surface)' : 'var(--a-bg)' }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 align-top whitespace-nowrap max-w-[280px] truncate">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
