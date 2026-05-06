import { BrevoClient } from '@getbrevo/brevo'

let client: BrevoClient | null = null

function getClient(): BrevoClient {
  if (!client) {
    client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? '' })
  }
  return client
}

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  if (!process.env.BREVO_API_KEY) {
    console.error('[Brevo] BREVO_API_KEY is not set')
    return
  }

  const recipients = Array.isArray(to) ? to.map((email) => ({ email })) : [{ email: to }]

  try {
    await getClient().transactionalEmails.sendTransacEmail({
      sender: {
        email: process.env.BREVO_FROM_EMAIL!,
        name: process.env.BREVO_FROM_NAME!,
      },
      to: recipients,
      subject,
      htmlContent: html,
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    })
  } catch (error) {
    // Log but never throw — email failure should never break a user action
    console.error('[Brevo] Failed to send email:', error)
  }
}
