import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'email-templates')
  if (denied) return denied

  const { to, subject, html } = (await req.json()) as {
    to?: string
    subject?: string
    html?: string
  }

  if (!to || !html) {
    return NextResponse.json({ error: 'to and html are required' }, { status: 400 })
  }

  const result = await sendEmail({
    to,
    subject: subject ? `[TEST] ${subject}` : '[TEST] Email Template Preview',
    html,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
