import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await db.form.findUnique({
    where: { id: params.id },
    include: {
      fields: { orderBy: { order: 'asc' } },
      submissions: {
        include: { values: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const headers = ['Submitted At', ...form.fields.map((f) => f.label)]
  const rows = form.submissions.map((sub) => {
    const valueMap = Object.fromEntries(sub.values.map((v) => [v.fieldLabel, v.value]))
    return [
      new Date(sub.createdAt).toISOString(),
      ...form.fields.map((f) => `"${(valueMap[f.label] ?? '').replace(/"/g, '""')}"`),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const filename = `${form.slug}-entries-${Date.now()}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
