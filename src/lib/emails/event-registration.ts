import { sendEmail, getTemplateHtml, getTemplateSubject } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { format } from 'date-fns'
import type { Event } from '@prisma/client'

export async function sendEventRegistrationEmail({
  name,
  email,
  event,
}: {
  name: string
  email: string
  event: Event
}) {
  const dateStr = format(new Date(event.date), 'EEEE, MMMM do yyyy')
  const firstName = name.split(' ')[0]

  const subjectVars = {
    event_title: event.title,
    first_name: firstName,
  }
  const subject =
    (await getTemplateSubject('event_registration', subjectVars)) ??
    `You're registered for ${event.title}`

  const htmlVars = {
    event_title: event.title,
    first_name: firstName,
    date_str: dateStr,
    event_time: event.time ?? '',
    event_venue: event.venue,
    event_city: event.city,
  }

  const savedHtml = await getTemplateHtml('event_registration', htmlVars)
  const html =
    savedHtml ??
    buildDefaultEventRegistrationHtml({
      firstName,
      dateStr,
      event,
    })

  await sendEmail({
    to: email,
    subject,
    html,
    fromName: EMAIL_SENDERS.events.name,
    fromEmail: EMAIL_SENDERS.events.email,
  })
}

function buildDefaultEventRegistrationHtml({
  firstName,
  dateStr,
  event,
}: {
  firstName: string
  dateStr: string
  event: Event
}) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0F0F0F;font-family:'General Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#0F0F0F;">

        <div style="padding:40px;">
          <p style="color:#8B0000;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Event Registration
          </p>

          <h1 style="color:#F8F8F8;font-size:32px;font-weight:700;margin:0 0 8px;line-height:1.1;">
            You're registered, ${firstName}!
          </h1>
          <p style="color:#A0A0A0;font-size:14px;margin:0 0 32px;">
            We'll see you there.
          </p>

          <div style="height:1px;background:linear-gradient(90deg,#8B0000,transparent);margin:0 0 32px;"></div>

          <!-- Event details -->
          <h2 style="color:#8B0000;font-size:16px;font-weight:600;margin:0 0 20px;letter-spacing:0.05em;">
            ${event.title}
          </h2>

          <table style="width:100%;border-collapse:collapse;margin:0 0 32px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;width:100px;">
                Date
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${dateStr}
              </td>
            </tr>
            ${
              event.time
                ? `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
                Time
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${event.time}
              </td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
                Venue
              </td>
              <td style="padding:10px 0;border-bottom:1px solid #1A1A1A;color:#F8F8F8;font-size:14px;">
                ${event.venue}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#585858;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
                City
              </td>
              <td style="padding:10px 0;color:#F8F8F8;font-size:14px;">
                ${event.city}
              </td>
            </tr>
          </table>

          <div style="height:1px;background:linear-gradient(90deg,transparent,#8B0000,transparent);margin:0 0 32px;"></div>

          <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0 0 24px;">
            We are looking forward to seeing you. Come ready to worship, pray,
            study the Word, and connect with other believers.
            <strong style="color:#F8F8F8;">There is room for you.</strong>
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="https://rfyglobal.org/events"
              style="display:inline-block;background:#8B0000;color:#0F0F0F;padding:14px 32px;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
              View All Events →
            </a>
          </div>
        </div>

        <div style="padding:20px 40px;border-top:1px solid #1A1A1A;text-align:center;">
          <p style="color:#585858;font-size:11px;margin:0;">
            Room For You · rfyglobal.org · A SonsHub Media Initiative
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
