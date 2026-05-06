import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendEmail } from '@/lib/brevo'

export const runtime = 'nodejs'

function isEmptyRequired(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'

  const { success } = await strictRatelimit.limit(`form-submit:${ip}`)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait a moment.' },
      { status: 429 }
    )
  }

  const form = await db.form.findUnique({
    where: { id: params.id, isActive: true },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })

  const body = (await req.json()) as Record<string, unknown>

  for (const field of form.fields) {
    if (field.required && isEmptyRequired(body[field.id])) {
      return NextResponse.json({ error: `"${field.label}" is required.` }, { status: 400 })
    }
  }

  const submission = await db.formSubmission.create({
    data: {
      formId: form.id,
      ipAddress: ip,
      values: {
        create: form.fields.map((field) => ({
          fieldId: field.id,
          fieldLabel: field.label,
          value: Array.isArray(body[field.id])
            ? (body[field.id] as string[]).join(', ')
            : String(body[field.id] ?? ''),
        })),
      },
    },
    include: { values: true },
  })

  if (form.notifyEmail) {
    const tableRows = submission.values
      .map(
        (v) =>
          `<tr><td style="padding:8px;border:1px solid #333;color:#C9A84C;font-weight:600">${v.fieldLabel}</td><td style="padding:8px;border:1px solid #333;color:#FAFAFA">${v.value}</td></tr>`
      )
      .join('')

    await sendEmail({
      to: form.notifyEmail,
      subject: `New submission: ${form.title}`,
      html: `
        <div style="background:#0A0A0A;padding:32px;font-family:Inter,sans-serif;max-width:600px">
          <div style="border-bottom:1px solid #C9A84C;padding-bottom:16px;margin-bottom:24px">
            <h2 style="color:#C9A84C;margin:0;font-size:20px">New Form Submission</h2>
            <p style="color:#FAFAFA99;margin:4px 0 0;font-size:14px">${form.title}</p>
          </div>
          <table style="width:100%;border-collapse:collapse">
            ${tableRows}
          </table>
          <p style="color:#FAFAFA40;font-size:12px;margin-top:24px">
            Room For You · rfyglobal.org · A SonsHub Media Initiative
          </p>
        </div>
      `,
    })
  }

  return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 })
}
