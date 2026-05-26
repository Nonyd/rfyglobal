import type { Event, EventRegistration } from '@prisma/client'
import { db } from '@/lib/db'
import { getTemplateHtml, getTemplateSubject, sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

type EventWithRegistrations = Event & { registrations: EventRegistration[] }

function buildEventReminderEmail(
  firstName: string,
  event: EventWithRegistrations,
  formattedDate: string,
  formattedTime: string,
): string {
  const location = [event.venue, event.city].filter(Boolean).join(', ')
  const eventUrl = event.slug
    ? `https://rfyglobal.org/events/${event.slug}`
    : 'https://rfyglobal.org/events'

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Event Reminder</p>
      <h1 style="font-size:24px;margin:0 0 8px;">See you tomorrow, ${firstName}!</h1>
      <h2 style="font-size:20px;color:#E8001C;margin:0 0 24px;">${event.title}</h2>
      <div style="background:#1A1A1A;padding:20px;margin-bottom:24px;border-left:3px solid #E8001C;">
        <p style="margin:0 0 8px;font-size:14px;"><strong>Date:</strong> ${formattedDate}</p>
        <p style="margin:0 0 8px;font-size:14px;"><strong>Time:</strong> ${formattedTime}</p>
        ${location ? `<p style="margin:0;font-size:14px;"><strong>Location:</strong> ${location}</p>` : ''}
      </div>
      ${event.description ? `<p style="color:#A0A0A0;font-size:14px;line-height:1.7;margin:0 0 24px;">${event.description}</p>` : ''}
      <a href="${eventUrl}" style="display:inline-block;background:#E8001C;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;margin-bottom:32px;">
        View Event Details →
      </a>
      <p style="color:#F8F8F8;font-size:14px;">See you there,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org</p>
      </div>
    </div>
  `
}

export async function runEventReminderAutomation(): Promise<string> {
  try {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000)

    const events = await db.event.findMany({
      where: {
        date: { gte: in23Hours, lte: in24Hours },
        isActive: true,
      },
      include: {
        registrations: true,
      },
    })

    let sent = 0

    for (const event of events) {
      for (const registration of event.registrations) {
        if (!registration.email) continue

        const firstName = registration.name?.split(' ')[0] ?? 'Friend'
        const eventDate = new Date(event.date)
        const formattedDate = eventDate.toLocaleDateString('en-NG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        const formattedTime =
          event.time ??
          eventDate.toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
          })
        const location = [event.venue, event.city].filter(Boolean).join(', ')
        const eventUrl = event.slug
          ? `https://rfyglobal.org/events/${event.slug}`
          : 'https://rfyglobal.org/events'
        const vars = {
          first_name: firstName,
          event_title: event.title,
          event_date: formattedDate,
          event_time: formattedTime,
          event_location: location,
          event_url: eventUrl,
        }
        const html =
          (await getTemplateHtml('event_reminder', vars)) ??
          buildEventReminderEmail(firstName, event, formattedDate, formattedTime)
        const subject =
          (await getTemplateSubject('event_reminder', vars)) ??
          `Reminder: ${event.title} is tomorrow! 🙏`

        await sendEmail({
          to: registration.email,
          subject,
          html,
          fromName: EMAIL_SENDERS.events.name,
          fromEmail: EMAIL_SENDERS.events.email,
        })

        sent++
      }
    }

    return `${sent} event reminders sent for ${events.length} events`
  } catch (error) {
    console.error('[automation:event_reminder]', error)
    return `Error: ${error}`
  }
}
