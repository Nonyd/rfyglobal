import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { getBroadcastRecipients } from '@/lib/broadcast-recipients'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'messages')
  if (denied) return denied

  const group = req.nextUrl.searchParams.get('group')
  const groupFilter = req.nextUrl.searchParams.get('groupFilter') ?? undefined

  if (!group) return NextResponse.json({ count: 0 })

  const recipients = await getBroadcastRecipients(group, groupFilter)
  return NextResponse.json({ count: recipients.length })
}
