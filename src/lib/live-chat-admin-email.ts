import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

function adminEmailTo(): string {
  return process.env.ADMIN_EMAIL ?? 'admin@rfyglobal.org'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendLiveChatMessageAlert(params: {
  name: string
  email: string
  body: string
}): Promise<void> {
  const safeBody = escapeHtml(params.body.trim()).replace(/\n/g, '<br>')

  await sendEmail({
    to: adminEmailTo(),
    subject: `💬 New chat message from ${params.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;">
        <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:40px;margin-bottom:24px;display:block;" />
        <p style="color:#E8001C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">New Live Chat</p>
        <p style="font-size:15px;margin:0 0 8px;"><strong>${escapeHtml(params.name)}</strong> (${escapeHtml(params.email)}) sent a message:</p>
        <div style="background:#1A1A1A;border-left:3px solid #E8001C;padding:16px 20px;margin:16px 0 24px;">
          <p style="margin:0;font-size:14px;line-height:1.7;">${safeBody}</p>
        </div>
        <a href="https://rfyglobal.org/admin/live-chat" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
          Reply Now →
        </a>
        <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You Admin · rfyglobal.org</p>
      </div>
    `,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  })
}

export async function sendLiveChatSessionAlert(params: {
  name: string
  email: string
}): Promise<void> {
  await sendEmail({
    to: adminEmailTo(),
    subject: `💬 New chat started by ${params.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;">
        <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:40px;margin-bottom:24px;display:block;" />
        <p style="color:#E8001C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">New Live Chat</p>
        <p style="font-size:15px;margin:0 0 8px;"><strong>${escapeHtml(params.name)}</strong> (${escapeHtml(params.email)}) started a chat.</p>
        <a href="https://rfyglobal.org/admin/live-chat" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;margin-top:16px;">
          Reply Now →
        </a>
        <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You Admin · rfyglobal.org</p>
      </div>
    `,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
  })
}
