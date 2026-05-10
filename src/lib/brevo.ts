import { BrevoClient } from '@getbrevo/brevo'
import { getBrevoCredentials } from '@/lib/credentials'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { db } from '@/lib/db'

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function applyEmailTemplateVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [k, v] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{\\s*${escapeRegExp(k)}\\s*}}`, 'g'), v)
  }
  return result
}

export async function getTemplateHtml(
  key: string,
  variables: Record<string, string> = {},
): Promise<string | null> {
  try {
    const template = await db.emailTemplate.findUnique({ where: { key } })
    if (!template?.html) return null

    return applyEmailTemplateVariables(template.html, variables)
  } catch {
    return null
  }
}

export async function getTemplateSubject(
  key: string,
  variables: Record<string, string> = {},
): Promise<string | null> {
  try {
    const template = await db.emailTemplate.findUnique({ where: { key } })
    if (!template?.subject) return null
    return applyEmailTemplateVariables(template.subject, variables)
  } catch {
    return null
  }
}

let client: BrevoClient | null = null

function getClient(): BrevoClient {
  if (!client) {
    client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? '' })
  }
  return client
}

export type SendEmailResult = { ok: true } | { ok: false; error: string }

function sendErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : 'Failed to send email'
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
}: SendEmailOptions): Promise<SendEmailResult> {
  const creds = await getBrevoCredentials()
  const apiKey = creds?.apiKey || process.env.BREVO_API_KEY

  if (!apiKey) {
    console.error('[Brevo] BREVO_API_KEY is not set')
    if (throwOnError) throw new Error('Brevo API key is not configured')
    return {
      ok: false,
      error: 'Email is not configured. Add a Brevo API key in Integrations or set BREVO_API_KEY.',
    }
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
    return { ok: true }
  } catch (error) {
    console.error('[Brevo] Failed to send email:', error)
    if (throwOnError) throw error
    return { ok: false, error: sendErrorMessage(error) }
  }
}
