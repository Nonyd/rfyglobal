import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await db.emailTemplate.findMany({
    orderBy: { key: 'asc' },
  })

  return NextResponse.json(templates)
}
