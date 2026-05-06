import { getEbulkSMSCredentials } from '@/lib/credentials'

const EBULKSMS_BASE = 'https://api.ebulksms.com'

export async function sendSMS({
  to,
  message,
}: {
  to: string | string[]
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const creds = await getEbulkSMSCredentials()
  if (!creds?.isActive) {
    console.warn('[EbulkSMS] SMS is not configured or inactive')
    return { success: false, error: 'SMS not configured' }
  }

  const recipients = Array.isArray(to) ? to : [to]
  const normalized = recipients.map((num) => {
    const clean = num.replace(/\D/g, '')
    if (clean.startsWith('0')) return `234${clean.slice(1)}`
    if (clean.startsWith('234')) return clean
    return `234${clean}`
  })

  try {
    const res = await fetch(`${EBULKSMS_BASE}/sendsms/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        SMS: {
          auth: {
            username: creds.username,
            apikey: creds.apiKey,
          },
          message: {
            sender: creds.senderId,
            messagetext: message,
            flash: '0',
          },
          recipients: {
            gsm: normalized.map((num) => ({ msidn: num })),
          },
        },
      }),
    })

    const data = (await res.json()) as {
      response?: { status?: string; statusdesc?: string }
    }

    if (data.response?.status === 'SUCCESS') return { success: true }
    return { success: false, error: data.response?.statusdesc ?? 'SMS sending failed' }
  } catch (err: unknown) {
    console.error('[EbulkSMS] Error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'SMS sending failed',
    }
  }
}

export async function sendBulkSMS({
  recipients,
  message,
  batchSize = 100,
}: {
  recipients: string[]
  message: string
  batchSize?: number
}): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    const result = await sendSMS({ to: batch, message })
    if (result.success) sent += batch.length
    else failed += batch.length
  }

  return { sent, failed }
}
