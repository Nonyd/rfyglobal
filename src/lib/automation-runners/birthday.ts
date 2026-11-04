import { buildBirthdayEmail } from '@/lib/automation-email-html'
import { db } from '@/lib/db'
import { getTemplateHtml, getTemplateSubject, sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { automationToday, claimDailyRun } from '@/lib/automations'

export { buildBirthdayEmail }

export async function runBirthdayAutomation(): Promise<string> {
  try {
    const { month: todayMonth, day: todayDay } = automationToday()
    if (!(await claimDailyRun('birthday'))) {
      return 'Birthday wishes already sent today — skipped'
    }

    const submissions = await db.formSubmission.findMany({
      include: { values: true },
    })

    const fieldIds = Array.from(
      new Set(submissions.flatMap((s) => s.values.map((v) => v.fieldId))),
    )
    const fields = await db.formField.findMany({
      where: { id: { in: fieldIds } },
    })
    const fieldMap = new Map(fields.map((f) => [f.id, f]))

    let sent = 0
    const emailsSent = new Set<string>()

    for (const submission of submissions) {
      const monthValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        return field?.type === 'BIRTHDAY_MONTH'
      })
      const dayValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        return field?.type === 'BIRTHDAY_DAY'
      })

      const dobValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        if (!field || field.type !== 'DATE') return false
        const label = field.label.toLowerCase()
        return label.includes('birth') || label.includes('dob')
      })

      let isBirthday = false

      if (monthValue?.value && dayValue?.value) {
        const month = parseInt(monthValue.value, 10)
        const day = parseInt(dayValue.value, 10)
        if (month === todayMonth && day === todayDay) {
          isBirthday = true
        }
      }

      if (!isBirthday && dobValue?.value) {
        const dob = new Date(dobValue.value)
        if (!isNaN(dob.getTime())) {
          // Date-only values ("1998-05-14") parse as UTC midnight; read them back in UTC so the server
          // timezone can't shift the day.
          if (dob.getUTCMonth() + 1 === todayMonth && dob.getUTCDate() === todayDay) {
            isBirthday = true
          }
        }
      }

      if (!isBirthday) continue

      const nameValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        const label = (field?.label ?? v.fieldLabel).toLowerCase()
        return label.includes('name') && !label.includes('last') && field?.type !== 'EMAIL'
      })
      const emailValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        return field?.type === 'EMAIL' || v.fieldLabel.toLowerCase().includes('email')
      })

      if (!emailValue?.value) continue

      const emailKey = emailValue.value.toLowerCase()
      if (emailsSent.has(emailKey)) continue

      const name = nameValue?.value?.split(' ')[0] ?? 'Friend'
      const vars = { first_name: name }
      const html = (await getTemplateHtml('birthday', vars)) ?? buildBirthdayEmail(name)
      const subject =
        (await getTemplateSubject('birthday', vars)) ?? `Happy Birthday, ${name}! 🎂`

      await sendEmail({
        to: emailValue.value,
        subject,
        html,
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })

      emailsSent.add(emailKey)
      sent++
    }

    return `${sent} birthday wishes sent`
  } catch (error) {
    console.error('[automation:birthday]', error)
    return `Error: ${error}`
  }
}
