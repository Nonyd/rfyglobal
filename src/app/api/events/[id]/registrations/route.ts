import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [registrations, formFieldsAll] = await Promise.all([
    db.eventRegistration.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'desc' },
    }),
    db.eventFormField.findMany({
      where: { eventId: event.id, isActive: true },
      orderBy: { order: 'asc' },
    }),
  ])

  /** Core mapped columns already cover seeded fields — extra columns only for non-core custom fields */
  const formFields = formFieldsAll.filter((f) => !f.isCore)

  if (format === 'csv') {
    const baseHeaders = ['Name', 'Email', 'Phone', 'Location', 'Expectations']
    const customHeaders = formFields.map((f) => f.label)
    const headers = [...baseHeaders, ...customHeaders, 'Registered At']

    const rows = registrations.map((r) => {
      const extra = (r.extraFields as Record<string, string> | null) ?? {}
      const customCells = formFields.map((f) => csvEscape((extra[f.id] ?? '').toString()))
      return [
        csvEscape(r.name),
        csvEscape(r.email),
        csvEscape(r.phone),
        csvEscape(r.location),
        csvEscape(r.expectations ?? ''),
        ...customCells,
        csvEscape(new Date(r.createdAt).toISOString()),
      ].join(',')
    })

    const csv = [headers.map(csvEscape).join(','), ...rows].join('\n')
    const filename = `${event.slug ?? event.id}-registrations.csv`
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  return NextResponse.json({ registrations, total: registrations.length, event })
}
