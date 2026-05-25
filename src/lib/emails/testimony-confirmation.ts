import { sendEmail, getTemplateHtml, getTemplateSubject } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const TESTIMONY_JOIN_CTA_BLOCK = `
<div style="text-align:center;margin:32px 0;padding:24px;background:#1A1A1A;border-top:2px solid #8B0000;">
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#A0A0A0;margin:0 0 16px;">
    Want to be part of the Room For You community?
  </p>
  <a
    href="https://rfyglobal.org/join"
    style="display:inline-block;background:#8B0000;color:#ffffff;padding:12px 32px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;"
  >
    Join the Community →
  </a>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#585858;margin:12px 0 0;">
    rfyglobal.org/join
  </p>
</div>
`

function buildDefaultTestimonyConfirmationHtml(firstName: string, isNewVisitor: boolean) {
  const safeName = escapeHtml(firstName)
  const joinBlock = isNewVisitor ? TESTIMONY_JOIN_CTA_BLOCK : ''
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;padding:40px;">
        <p style="color:#8B0000;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
          Room For You · Testimonies
        </p>
        <h1 style="color:#F8F8F8;font-size:24px;font-weight:600;margin:0 0 16px;">
          Thank you, ${safeName}.
        </h1>
        <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
          Your testimony has been received. Our team will review it before it appears on the public page.
          We are grateful you took the time to share what God has done.
        </p>
        ${joinBlock}
        <p style="color:#585858;font-size:11px;text-align:center;margin:0;">
          Room For You · rfyglobal.org
        </p>
      </div>
    </body>
    </html>
  `
}

export async function sendTestimonyConfirmationEmail({
  email,
  name,
  isNewVisitor,
}: {
  email: string
  name?: string | null
  isNewVisitor: boolean
}) {
  const firstName = (name?.trim() || email.split('@')[0] || 'Friend').split(' ')[0]
  const safeName = escapeHtml(firstName)

  const vars = {
    first_name: safeName,
    join_cta_block: isNewVisitor ? TESTIMONY_JOIN_CTA_BLOCK : '',
  }

  const html =
    (await getTemplateHtml('testimony_confirmation', vars)) ??
    buildDefaultTestimonyConfirmationHtml(firstName, isNewVisitor)

  const subject =
    (await getTemplateSubject('testimony_confirmation', vars)) ??
    'We received your testimony — Room For You'

  await sendEmail({
    to: email,
    subject,
    html,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  })
}
