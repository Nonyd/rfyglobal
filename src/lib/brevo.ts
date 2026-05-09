import { BrevoClient } from '@getbrevo/brevo'
import { getBrevoCredentials } from '@/lib/credentials'
import { EMAIL_SENDERS } from '@/lib/email-senders'

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
  fromName?: string
  fromEmail?: string
  replyTo?: string
  /** When true, missing credentials or API errors propagate (for automation / logging). */
  throwOnError?: boolean
}

export async function sendEmail({
  to,
  subject,
  html,
  fromName = EMAIL_SENDERS.hello.name,
  fromEmail = EMAIL_SENDERS.hello.email,
  replyTo,
  throwOnError,
}: SendEmailOptions) {
  const creds = await getBrevoCredentials()
  const apiKey = creds?.apiKey || process.env.BREVO_API_KEY

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
