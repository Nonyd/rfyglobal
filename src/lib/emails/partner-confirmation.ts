import type { Prisma } from '@prisma/client'
import { sendEmail, getTemplateHtml, getTemplateSubject } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { db } from '@/lib/db'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function notifyPartnerGivingConfirmationIfNeeded(reference: string) {
  const record = await db.givingRecord.findUnique({ where: { reference } })
  if (!record || record.status !== 'SUCCESS' || !record.donorEmail) return

  const meta = (record.meta ?? {}) as Record<string, unknown>
  if (meta.partnerConfirmationSent) return

  const firstName = record.donorName?.split(' ')[0] ?? 'Friend'
  const amountStr = record.amount.toLocaleString('en-NG', { minimumFractionDigits: 0 })
  const safeName = escapeHtml(firstName)

  const vars = {
    first_name: safeName,
    amount_display: `${escapeHtml(record.currency)} ${escapeHtml(amountStr)}`,
  }

  const savedHtml = await getTemplateHtml('partner_confirmation', vars)
  const html =
    savedHtml ??
    `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;padding:40px;">
        <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
          Room For You · Partnership
        </p>
        <h1 style="color:#F8F8F8;font-size:24px;font-weight:600;margin:0 0 16px;">
          Thank you, ${safeName}.
        </h1>
        <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
          Your gift of <strong style="color:#F8F8F8;">${record.currency} ${amountStr}</strong> has been received.
          You are sowing into the Kingdom — we are grateful to partner with you.
        </p>
        <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:24px 0;"></div>
        <p style="color:#585858;font-size:11px;text-align:center;margin:0;">
          Room For You · rfyglobal.org
        </p>
      </div>
    </body>
    </html>
  `

  const subject =
    (await getTemplateSubject('partner_confirmation', vars)) ??
    'Thank you for partnering with Room For You'

  await sendEmail({
    to: record.donorEmail,
    subject,
    html,
    fromName: EMAIL_SENDERS.partner.name,
    fromEmail: EMAIL_SENDERS.partner.email,
  })

  await db.givingRecord.update({
    where: { reference },
    data: {
      meta: { ...meta, partnerConfirmationSent: true } as Prisma.InputJsonValue,
    },
  })
}
