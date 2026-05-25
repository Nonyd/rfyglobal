import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export function buildBirthdayEmail(firstName: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:40px;">
      <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:32px;display:block;" />
      <p style="color:#E8001C;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 16px;">Happy Birthday</p>
      <h1 style="font-size:32px;margin:0 0 16px;line-height:1.2;">
        🎂 Happy Birthday, ${firstName}!
      </h1>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 24px;">
        On your special day, the entire Room For You family celebrates you. 
        May this year be filled with God's grace, joy, and every good thing He has promised you.
      </p>
      <p style="color:#A0A0A0;font-size:15px;line-height:1.8;margin:0 0 32px;">
        <em>"This is the day the Lord has made; let us rejoice and be glad in it."</em><br/>
        <span style="color:#585858;font-size:13px;">— Psalm 118:24</span>
      </p>
      <p style="color:#F8F8F8;font-size:14px;">With love,<br/>The Room For You Team 🙏</p>
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#585858;font-size:11px;text-align:center;">Room For You · rfyglobal.org · Jesus to Nations</p>
      </div>
    </div>
  `
}

export async function runBirthdayAutomation(): Promise<string> {
  try {
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

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

    for (const submission of submissions) {
      const dobValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        if (!field || field.type !== 'DATE') return false
        const label = field.label.toLowerCase()
        return label.includes('birth') || label.includes('dob')
      })

      if (!dobValue?.value) continue

      const dob = new Date(dobValue.value)
      if (isNaN(dob.getTime())) continue

      if (dob.getMonth() + 1 !== todayMonth || dob.getDate() !== todayDay) continue

      const nameValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        const label = (field?.label ?? v.fieldLabel).toLowerCase()
        return label.includes('name') && field?.type !== 'EMAIL'
      })
      const emailValue = submission.values.find((v) => {
        const field = fieldMap.get(v.fieldId)
        return field?.type === 'EMAIL' || v.fieldLabel.toLowerCase().includes('email')
      })

      if (!emailValue?.value) continue

      const name = nameValue?.value?.split(' ')[0] ?? 'Friend'

      await sendEmail({
        to: emailValue.value,
        subject: `Happy Birthday, ${name}! 🎂`,
        html: buildBirthdayEmail(name),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })

      sent++
    }

    return `${sent} birthday wishes sent`
  } catch (error) {
    console.error('[automation:birthday]', error)
    return `Error: ${error}`
  }
}
