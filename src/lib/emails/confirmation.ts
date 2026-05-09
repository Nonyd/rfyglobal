import { sendEmail, getTemplateHtml, getTemplateSubject } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import type { CommunityMember } from '@prisma/client'

interface ConfirmationEmailParams {
  member: CommunityMember
  whatsappUrl: string
}

function escapeHtmlAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildDefaultWelcomeHtml(member: CommunityMember, whatsappUrl: string) {
  const firstName = member.name.split(' ')[0]
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">

        <div style="background:#0F0F0F;padding:40px 40px 0;text-align:center;border-bottom:1px solid #C9A84C;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 16px;">
            Room For You
          </p>
          <h1 style="color:#F8F8F8;font-size:36px;font-weight:700;margin:0 0 8px;line-height:1.1;">
            Welcome, ${firstName}.
          </h1>
          <p style="color:#C9A84C;font-size:14px;font-style:italic;margin:0 0 40px;">
            There is room for you here.
          </p>
        </div>

        <div style="padding:40px;">
          <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
            You have just taken a step that matters. Welcome to the Room For You community —
            a community of young men and women who sing songs of salvation, study the Word,
            pray, and get others saved.
          </p>

          <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
            You are not alone in your faith anymore. You are surrounded by people running the same race.
          </p>

          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:0 0 32px;"></div>

          <h2 style="color:#F8F8F8;font-size:18px;font-weight:600;margin:0 0 16px;">
            What happens next
          </h2>

          <div style="margin:0 0 16px;">
            <div style="display:flex;align-items:flex-start;margin:0 0 12px;">
              <span style="color:#C9A84C;font-size:18px;margin-right:12px;line-height:1.4;">01</span>
              <p style="color:#A0A0A0;font-size:14px;line-height:1.6;margin:0;">
                <strong style="color:#F8F8F8;">Join our WhatsApp community</strong> —
                stay connected, get announcements, and meet other members.
              </p>
            </div>
            <div style="display:flex;align-items:flex-start;margin:0 0 12px;">
              <span style="color:#C9A84C;font-size:18px;margin-right:12px;line-height:1.4;">02</span>
              <p style="color:#A0A0A0;font-size:14px;line-height:1.6;margin:0;">
                <strong style="color:#F8F8F8;">Expect daily scriptures</strong> —
                every morning, the Word comes to you.
              </p>
            </div>
            <div style="display:flex;align-items:flex-start;">
              <span style="color:#C9A84C;font-size:18px;margin-right:12px;line-height:1.4;">03</span>
              <p style="color:#A0A0A0;font-size:14px;line-height:1.6;margin:0;">
                <strong style="color:#F8F8F8;">Watch for event reminders</strong> —
                we will notify you before every Room For You gathering near you.
              </p>
            </div>
          </div>

          ${
            whatsappUrl
              ? `
          <div style="text-align:center;margin:32px 0;">
            <a href="${escapeHtmlAttr(whatsappUrl)}"
              style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              Join the WhatsApp Community →
            </a>
          </div>
          `
              : ''
          }

          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:32px 0;"></div>

          <div style="text-align:center;padding:24px 0;">
            <p style="color:#C9A84C;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">
              A Word For You
            </p>
            <p style="color:#F8F8F8;font-size:20px;font-style:italic;font-weight:400;line-height:1.6;margin:0 0 8px;">
              "Therefore, if anyone is in Christ, the new creation has come:
              The old has gone, the new is here!"
            </p>
            <p style="color:#C9A84C;font-size:13px;margin:0;">— 2 Corinthians 5:17</p>
          </div>
        </div>

        <div style="padding:24px 40px;border-top:1px solid #1A1A1A;text-align:center;">
          <p style="color:#585858;font-size:11px;margin:0 0 4px;">
            Room For You · rfyglobal.org · A SonsHub Media Initiative
          </p>
          <p style="color:#585858;font-size:11px;margin:0;">
            Jesus to Nations — 2 Cor 5:17-21
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendConfirmationEmail({ member, whatsappUrl }: ConfirmationEmailParams) {
  const firstName = member.name.split(' ')[0]
  const whatsappBlock =
    whatsappUrl.trim().length > 0
      ? `<div style="text-align:center;margin:32px 0;"><a href="${escapeHtmlAttr(whatsappUrl)}"
              style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              Join the WhatsApp Community →
            </a></div>`
      : ''

  const vars = { first_name: firstName, whatsapp_block: whatsappBlock }
  const savedHtml = await getTemplateHtml('welcome', vars)
  const html = savedHtml ?? buildDefaultWelcomeHtml(member, whatsappUrl)

  const subject =
    (await getTemplateSubject('welcome', vars)) ?? 'Welcome to Room For You 🏠'

  await sendEmail({
    to: member.email,
    subject,
    html,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
    throwOnError: true,
  })
}
