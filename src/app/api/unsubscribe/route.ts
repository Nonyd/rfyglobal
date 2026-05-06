import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  await db.communityMember.updateMany({
    where: { email },
    data: { isSubscribed: false },
  })

  return NextResponse.redirect(new URL('/unsubscribed', req.url))
}
