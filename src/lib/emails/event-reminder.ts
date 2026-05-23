import { sendEmail, getTemplateHtml, getTemplateSubject } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { db } from '@/lib/db'
import { format } from 'date-fns'

export async function sendEventReminderEmails(type: 'WEEK' | 'DAY') {
  const now = new Date()
  const targetDate = new Date(now)

  if (type === 'WEEK') {
    targetDate.setDate(targetDate.getDate() + 7)
  } else {
    targetDate.setDate(targetDate.getDate() + 1)
  }

  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  const events = await db.event.findMany({
    where: {
      isActive: true,
      date: { gte: startOfDay, lte: endOfDay },
    },
  })

  if (events.length === 0) {
    console.log(`[EventReminder] No events in ${type === 'WEEK' ? '7 days' : '24 hours'}`)
    return { sent: 0 }
  }

  let sent = 0

  for (const event of events) {
    const members = await db.communityMember.findMany({
      where: {
        isSubscribed: true,
        createdAt: { lt: event.date },
      },
      select: { id: true, name: true, email: true },
    })

    const emailType = type === 'WEEK' ? 'EVENT_REMINDER_WEEK' : 'EVENT_REMINDER_DAY'

    for (const member of members) {
      const subjectVars = {
        event_title: event.title,
        event_city: event.city,
      }
      const defaultSubject =
        type === 'WEEK'
          ? `Room For You is coming to ${event.city} in 1 week 🙌`
          : `Room For You is tomorrow in ${event.city}! 🙌`
      const subject = (await getTemplateSubject('event_reminder', subjectVars)) ?? defaultSubject

      try {
        const htmlVars = buildReminderTemplateVars(member, event, type)
        const savedHtml = await getTemplateHtml('event_reminder', htmlVars)
        const html = savedHtml ?? buildEventReminderEmail({ member, event, type })

        await sendEmail({
          to: member.email,
          subject,
          html,
          fromName: EMAIL_SENDERS.events.name,
          fromEmail: EMAIL_SENDERS.events.email,
          throwOnError: true,
        })
        await db.emailLog.create({
          data: {
            memberId: member.id,
            type: emailType,
            subject,
            status: 'sent',
            meta: { eventId: event.id, eventCity: event.city },
          },
        })
        sent++
      } catch (err) {
        console.error(`[EventReminder] Failed for ${member.email}:`, err)
        await db.emailLog.create({
          data: {
            memberId: member.id,
            type: emailType,
            subject,
            status: 'failed',
          },
        })
      }
    }
  }

  return { sent, events: events.length }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildReminderTemplateVars(
  member: { name: string; email: string },
  event: {
    title: string
    city: string
    venue: string
    date: Date
    time?: string | null
    description?: string | null
  },
  type: 'WEEK' | 'DAY',
) {
  const dateStr = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const urgency = type === 'DAY' ? 'TOMORROW' : 'NEXT WEEK'
  const unsub = `https://rfyglobal.org/unsubscribe?email=${encodeURIComponent(member.email)}`
  return {
    first_name: escapeHtml(member.name.split(' ')[0]),
    event_title: escapeHtml(event.title),
    event_city: escapeHtml(event.city),
    event_venue: escapeHtml(event.venue),
    date_str: escapeHtml(dateStr),
    event_time: event.time ? escapeHtml(event.time) : '',
    reminder_badge: urgency,
    event_description: event.description ? escapeHtml(event.description) : '',
    unsubscribe_url: unsub,
  }
}

function buildEventReminderEmail({
  member,
  event,
  type,
}: {
  member: { name: string; email: string }
  event: {
    title: string
    city: string
    venue: string
    date: Date
    time?: string | null
    description?: string | null
  }
  type: 'WEEK' | 'DAY'
}) {
  const dateStr = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const urgency = type === 'DAY' ? 'TOMORROW' : 'NEXT WEEK'
  const unsub = `https://rfyglobal.org/unsubscribe?email=${encodeURIComponent(member.email)}`

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">
        <div style="padding:40px;">
          <p style="color:#8B0000;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Event Reminder
          </p>

          <div style="background:#8B0000;display:inline-block;padding:4px 12px;margin:0 0 24px;">
            <p style="color:#0F0F0F;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0;">
              ${urgency}
            </p>
          </div>

          <h1 style="color:#F8F8F8;font-size:28px;font-weight:700;margin:0 0 8px;line-height:1.2;">
            ${event.title}
          </h1>

          <div style="height:1px;background:linear-gradient(90deg,#8B0000,transparent);margin:24px 0;"></div>

          <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:12px;width:100px;">
                DATE
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${dateStr}
              </td>
            </tr>
            ${
              event.time
                ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:12px;">TIME</td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">${event.time}</td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:12px;">CITY</td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">${event.city}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#585858;font-size:12px;">VENUE</td>
              <td style="padding:10px 0;color:#F8F8F8;font-size:14px;">${event.venue}</td>
            </tr>
          </table>

          ${
            event.description
              ? `
          <p style="color:#A0A0A0;font-size:14px;line-height:1.7;margin:0 0 32px;">
            ${event.description}
          </p>
          `
              : ''
          }

          <div style="text-align:center;margin:32px 0;">
            <a href="https://rfyglobal.org/events"
              style="display:inline-block;background:#8B0000;color:#0F0F0F;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              View Event Details →
            </a>
          </div>
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
