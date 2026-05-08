import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const q = searchParams.get('q')?.trim()

  const memberWhere =
    q && q.length > 0
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

  if (format === 'csv') {
    const members = await db.communityMember.findMany({
      where: memberWhere,
      orderBy: { createdAt: 'desc' },
    })

    const headers = ['Name', 'Email', 'Phone', 'Country', 'State/City', 'Joined', 'Subscribed']
    const rows = members.map((m) =>
      [
        `"${m.name.replace(/"/g, '""')}"`,
        m.email,
        m.phone,
        m.country,
        m.state ?? m.city ?? '',
        new Date(m.createdAt).toISOString(),
        m.isSubscribed ? 'Yes' : 'No',
      ].join(','),
    )

    const csv = [headers.join(','), ...rows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="rfy-members-${Date.now()}.csv"`,
      },
    })
  }

  const [members, total] = await Promise.all([
    db.communityMember.findMany({
      where: memberWhere,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.communityMember.count({ where: memberWhere }),
  ])

  return NextResponse.json({ members, total, page, totalPages: Math.ceil(total / limit) })
}
