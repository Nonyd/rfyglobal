import type { Scripture } from '@prisma/client'
import { db } from '@/lib/db'
import { getTemplateHtml, getTemplateSubject, sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

function buildDailyScriptureEmail(firstName: string, scripture: Scripture): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Daily Word</p>
      <p style="font-size:14px;color:#A0A0A0;margin:0 0 24px;">Good morning, ${firstName} 🌅</p>
      <div style="background:#1A1A1A;border-left:4px solid #E8001C;padding:24px;margin-bottom:24px;">
        <p style="font-size:18px;line-height:1.7;font-style:italic;margin:0 0 12px;">"${scripture.text}"</p>
        <p style="color:#E8001C;font-size:13px;font-weight:bold;margin:0;">${scripture.reference} · ${scripture.translation}</p>
      </div>
      <a href="https://rfyglobal.org/word" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
        Read More on the Word Page →
      </a>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · <a href="https://rfyglobal.org/unsubscribe" style="color:#585858;">Unsubscribe</a></p>
      </div>
    </div>
  `
}

export async function runDailyScriptureAutomation(): Promise<string> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const scripture = await db.scripture.findFirst({
      where: {
        isActive: true,
        isDraft: false,
        scheduledAt: { gte: today, lt: tomorrow },
      },
    })

    if (!scripture) return 'No scripture published for today'

    const members = await db.communityMember.findMany({
      where: { isSubscribed: true, email: { not: '' } },
      select: { email: true, name: true },
    })

    let sent = 0
    for (const member of members) {
      if (!member.email) continue
      const firstName = member.name?.split(' ')[0] ?? 'Friend'
      const vars = {
        first_name: firstName,
        scripture_verse: scripture.text,
        scripture_reference: scripture.reference,
        scripture_reflection: '',
      }
      const html =
        (await getTemplateHtml('daily_scripture', vars)) ??
        buildDailyScriptureEmail(firstName, scripture)
      const subject =
        (await getTemplateSubject('daily_scripture', vars)) ??
        `Today's Word — ${scripture.reference}`

      await sendEmail({
        to: member.email,
        subject,
        html,
        fromName: EMAIL_SENDERS.word.name,
        fromEmail: EMAIL_SENDERS.word.email,
      })
      sent++
    }

    return `Daily scripture sent to ${sent} members`
  } catch (error) {
    console.error('[automation:daily_scripture]', error)
    return `Error: ${error}`
  }
}
