import { BrevoClient } from '@getbrevo/brevo'
import { getBrevoCredentials } from '@/lib/credentials'

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
  /** When true, missing credentials or API errors propagate (for automation / logging). */
  throwOnError?: boolean
}

export async function sendEmail({ to, subject, html, replyTo, throwOnError }: SendEmailOptions) {
  const creds = await getBrevoCredentials()
  const apiKey = creds?.apiKey || process.env.BREVO_API_KEY
  const fromEmail = creds?.fromEmail || process.env.BREVO_FROM_EMAIL || 'noreply@rfyglobal.org'
  const fromName = creds?.fromName || process.env.BREVO_FROM_NAME || 'Room For You'

  if (!apiKey) {
    console.error('[Brevo] BREVO_API_KEY is not set')
    if (throwOnError) throw new Error('Brevo API key is not configured')
    return
  }

  const recipients = Array.isArray(to) ? to.map((email) => ({ email })) : [{ email: to }]

  try {
    client = new BrevoClient({ apiKey })
    await getClient().transactionalEmails.sendTransacEmail({
      sender: {
        email: fromEmail,
        name: fromName,
      },
      to: recipients,
      subject,
      htmlContent: html,
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    })
  } catch (error) {
    console.error('[Brevo] Failed to send email:', error)
    if (throwOnError) throw error
  }
}
