import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
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

  const unsubHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;padding:40px;">
        <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 16px;">
          Room For You
        </p>
        <p style="color:#F8F8F8;font-size:16px;line-height:1.6;margin:0 0 16px;">
          You have been unsubscribed from Room For You emails. You will no longer receive devotionals or updates from us at this address.
        </p>
        <p style="color:#585858;font-size:12px;margin:0;">
          If this was a mistake, you can re-join anytime at rfyglobal.org.
        </p>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: 'You have been unsubscribed',
    html: unsubHtml,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  })

  return NextResponse.redirect(new URL('/unsubscribed', req.url))
}
