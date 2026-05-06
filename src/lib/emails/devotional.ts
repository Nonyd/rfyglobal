import { sendEmail } from '@/lib/brevo'
import { db } from '@/lib/db'
import type { Scripture } from '@prisma/client'

export async function sendDailyDevotionalEmails() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let scripture: Scripture | null = await db.scripture.findFirst({
    where: {
      scheduledAt: { gte: today, lt: tomorrow },
      isActive: true,
    },
  })

  if (!scripture) {
    const pool = await db.scripture.findMany({ where: { scheduledAt: null, isActive: true } })
    if (pool.length > 0) {
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      scripture = pool[seed % pool.length] ?? null
    }
  }

  if (!scripture) {
    console.log('[Devotional] No scripture found for today — skipping')
    return { sent: 0, skipped: true as const }
  }

  const members = await db.communityMember.findMany({
    where: { isSubscribed: true },
    select: { id: true, name: true, email: true },
  })

  if (members.length === 0) {
    console.log('[Devotional] No subscribed members — skipping')
    return { sent: 0 }
  }

  const subject = `Today's Word: ${scripture.reference}`
  const dateStr = today.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })

  let sent = 0
  let failed = 0

  const BATCH_SIZE = 50
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (member) => {
        try {
          const html = buildDevotionalEmail({ member, scripture: scripture!, dateStr })
          await sendEmail({ to: member.email, subject, html, throwOnError: true })
          await db.emailLog.create({
            data: {
              memberId: member.id,
              type: 'DAILY_DEVOTIONAL',
              subject,
              status: 'sent',
              meta: { scriptureId: scripture!.id, reference: scripture!.reference },
            },
          })
          sent++
        } catch (err) {
          console.error(`[Devotional] Failed to send to ${member.email}:`, err)
          await db.emailLog.create({
            data: {
              memberId: member.id,
              type: 'DAILY_DEVOTIONAL',
              subject,
              status: 'failed',
            },
          })
          failed++
        }
      }),
    )
  }

  console.log(`[Devotional] Sent: ${sent}, Failed: ${failed}`)
  return { sent, failed }
}

function buildDevotionalEmail({
  member,
  scripture,
  dateStr,
}: {
  member: { name: string; email: string }
  scripture: { reference: string; text: string; translation: string }
  dateStr: string
}) {
  const unsub = `https://rfyglobal.org/unsubscribe?email=${encodeURIComponent(member.email)}`
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">
        <div style="padding:40px;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Daily Word
          </p>
          <p style="color:#585858;font-size:12px;margin:0 0 32px;">${dateStr}</p>

          <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:0 0 32px;"></div>

          <p style="color:#585858;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px;">
            ${scripture.translation}
          </p>
          <h1 style="color:#C9A84C;font-size:28px;font-weight:600;margin:0 0 20px;">
            ${scripture.reference}
          </h1>
          <blockquote style="color:#F8F8F8;font-size:20px;font-style:italic;line-height:1.7;margin:0 0 32px;padding:0 0 0 20px;border-left:3px solid #C9A84C;">
            "${scripture.text}"
          </blockquote>

          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:0 0 32px;"></div>

          <p style="color:#585858;font-size:12px;text-align:center;margin:0;">
            <a href="https://rfyglobal.org/word" style="color:#C9A84C;text-decoration:none;">
              Read more on rfyglobal.org →
            </a>
          </p>
        </div>

        <div style="padding:20px 40px;border-top:1px solid #1A1A1A;text-align:center;">
          <p style="color:#585858;font-size:11px;margin:0;">
            Room For You · rfyglobal.org ·
            <a href="${unsub}"
              style="color:#585858;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
