import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { paramId } from '@/lib/api-route-params'
import { UpdateFormSchema } from '@/lib/validations/form'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = await paramId(ctx.params)
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const form = await db.form.findUnique({
    where: { id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(form)
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = await paramId(ctx.params)
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const existing = await db.form.findUnique({ where: { id } })
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
    where: { id },
    data: {
      ...formData,
      notifyEmail:
        formData.notifyEmail === undefined
          ? undefined
          : formData.notifyEmail
            ? formData.notifyEmail
            : null,
      redirectUrl:
        formData.redirectUrl === undefined
          ? undefined
          : formData.redirectUrl
            ? formData.redirectUrl
            : null,
    },
  })

  if (fields) {
    await db.formField.deleteMany({ where: { formId: id } })
    await db.formField.createMany({
      data: fields.map((f, i) => ({
        formId: id,
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
    where: { id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const existing = await db.form.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.formSubmission.deleteMany({ where: { formId: id } })
    await db.form.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[forms DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const methodOverride = req.headers.get('X-HTTP-Method-Override')
  if (methodOverride === 'DELETE') return DELETE(req, ctx)
  if (methodOverride === 'PATCH') return PATCH(req, ctx)
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
