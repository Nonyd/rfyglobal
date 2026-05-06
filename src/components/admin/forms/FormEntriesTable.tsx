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
        row[f.label] = map[f.label] ?? ''
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
            return v ? <span className="text-white/60">{v}</span> : <span className="text-white/25">—</span>
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
      <div
        className="border border-dashed py-16 text-center text-white/30 text-sm font-body"
        style={{ borderColor: 'rgba(201,168,76,0.2)' }}
      >
        No submissions yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded border border-white/10">
      <table className="w-full min-w-[640px] text-left text-sm font-body">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-black border-b border-gold/20">
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="px-4 py-3 text-xs uppercase tracking-widest text-gold font-body whitespace-nowrap"
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
              className="border-b border-white/5"
              style={{ background: i % 2 === 0 ? '#0A0A0A' : '#111111' }}
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
