import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const fieldId = searchParams.get('fieldId')

  if (!email || !email.includes('@') || !fieldId) {
    return NextResponse.json({ exists: false })
  }

  const form = await db.form.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })

  if (!form) return NextResponse.json({ exists: false })

  const existing = await db.formSubmissionValue.findFirst({
    where: {
      fieldId,
      value: { equals: email.trim(), mode: 'insensitive' },
      submission: { formId: form.id },
    },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!existing })
}
