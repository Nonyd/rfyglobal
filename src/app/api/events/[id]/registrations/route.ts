import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')

  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.id }, { id: params.id }] },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: 'desc' },
  })

  if (format === 'csv') {
    const headers = ['Name', 'Email', 'Phone', 'Location', 'Expectations', 'Registered At']
    const rows = registrations.map((r) =>
      [
        `"${r.name.replace(/"/g, '""')}"`,
        r.email,
        r.phone,
        `"${r.location.replace(/"/g, '""')}"`,
        `"${(r.expectations ?? '').replace(/"/g, '""')}"`,
        new Date(r.createdAt).toISOString(),
      ].join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
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
