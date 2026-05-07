import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email || !email.includes('@')) {
    return NextResponse.json({ exists: false })
  }

  const member = await db.communityMember.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!member })
}
