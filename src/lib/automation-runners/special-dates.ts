import {
  buildChristmasEmail,
  buildEasterEmail,
  buildNewYearEmail,
} from '@/lib/automation-email-html'
import { db } from '@/lib/db'
import { getTemplateHtml, getTemplateSubject, sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export { buildChristmasEmail, buildEasterEmail, buildNewYearEmail }

async function getAllMemberEmails(): Promise<{ email: string; name: string }[]> {
  const members = await db.communityMember.findMany({
    where: { email: { not: '' } },
    select: { email: true, name: true },
  })
  return members.filter((m) => m.email?.trim())
}

export async function runChristmasAutomation(): Promise<string> {
  try {
    const today = new Date()
    if (today.getMonth() + 1 !== 12 || today.getDate() !== 25) {
      return 'Not Christmas today — skipped'
    }

    const members = await getAllMemberEmails()
    let sent = 0

    for (const member of members) {
      const firstName = member.name?.split(' ')[0] ?? 'Friend'
      const vars = { first_name: firstName }
      const html = (await getTemplateHtml('christmas', vars)) ?? buildChristmasEmail(firstName)
      const subject =
        (await getTemplateSubject('christmas', vars)) ?? `Merry Christmas, ${firstName}! 🎄`

      await sendEmail({
        to: member.email,
        subject,
        html,
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
      sent++
    }

    return `Christmas greetings sent to ${sent} members`
  } catch (error) {
    console.error('[automation:christmas]', error)
    return `Error: ${error}`
  }
}

export async function runNewYearAutomation(): Promise<string> {
  try {
    const today = new Date()
    if (today.getMonth() + 1 !== 1 || today.getDate() !== 1) {
      return 'Not New Year today — skipped'
    }

    const members = await getAllMemberEmails()
    const year = String(new Date().getFullYear())
    let sent = 0

    for (const member of members) {
      const firstName = member.name?.split(' ')[0] ?? 'Friend'
      const vars = { first_name: firstName, year }
      const html = (await getTemplateHtml('new_year', vars)) ?? buildNewYearEmail(firstName)
      const subject =
        (await getTemplateSubject('new_year', vars)) ?? `Happy New Year, ${firstName}! 🎉`

      await sendEmail({
        to: member.email,
        subject,
        html,
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
      sent++
    }

    return `New Year greetings sent to ${sent} members`
  } catch (error) {
    console.error('[automation:new_year]', error)
    return `Error: ${error}`
  }
}

export async function runEasterAutomation(): Promise<string> {
  try {
    const setting = await db.automationSetting.findUnique({
      where: { key: 'easter' },
    })

    const config = setting?.config as { easterDate?: string } | null
    if (!config?.easterDate) {
      return 'Easter date not set — go to Admin → Automation → Easter to set the date'
    }

    const easterDate = new Date(config.easterDate)
    const today = new Date()

    if (easterDate.getMonth() !== today.getMonth() || easterDate.getDate() !== today.getDate()) {
      return 'Not Easter today — skipped'
    }

    const members = await getAllMemberEmails()
    let sent = 0

    for (const member of members) {
      const firstName = member.name?.split(' ')[0] ?? 'Friend'
      const vars = { first_name: firstName }
      const html = (await getTemplateHtml('easter', vars)) ?? buildEasterEmail(firstName)
      const subject =
        (await getTemplateSubject('easter', vars)) ?? `Happy Easter, ${firstName}! ✝️`

      await sendEmail({
        to: member.email,
        subject,
        html,
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
      sent++
    }

    return `Easter greetings sent to ${sent} members`
  } catch (error) {
    console.error('[automation:easter]', error)
    return `Error: ${error}`
  }
}
