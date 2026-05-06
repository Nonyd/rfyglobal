import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UpdateFormSchema } from '@/lib/validations/form'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await db.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(form)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.form.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { fields, ...formData } = parsed.data

  if (formData.slug && formData.slug !== existing.slug) {
    const slugTaken = await db.form.findUnique({ where: { slug: formData.slug } })
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }
  }

  await db.form.update({
    where: { id: params.id },
    data: {
      ...formData,
      notifyEmail:
        formData.notifyEmail === undefined
          ? undefined
          : formData.notifyEmail
            ? formData.notifyEmail
            : null,
    },
  })

  if (fields) {
    await db.formField.deleteMany({ where: { formId: params.id } })
    await db.formField.createMany({
      data: fields.map((f, i) => ({
        formId: params.id,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder ?? null,
        required: f.required,
        options: f.options ?? undefined,
        order: f.order ?? i,
      })),
    })
  }

  const updated = await db.form.findUnique({
    where: { id: params.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.form.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
