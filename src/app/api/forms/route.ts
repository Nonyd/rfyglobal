import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { CreateFormSchema } from '@/lib/validations/form'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const forms = await db.form.findMany({
    include: { _count: { select: { submissions: true, fields: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(forms)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, description, slug, notifyEmail, fields, isActive } = parsed.data

  const existing = await db.form.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const form = await db.form.create({
    data: {
      title,
      description,
      slug,
      isActive: isActive ?? false,
      notifyEmail: notifyEmail || null,
      fields: {
        create: fields.map((f, i) => ({
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options ?? undefined,
          order: f.order ?? i,
        })),
      },
    },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  await logActivity({
    userId: session.user.id,
    action: `Created form: ${title}`,
    module: 'Forms',
    targetId: form.id,
    targetTitle: title,
  })

  return NextResponse.json(form, { status: 201 })
}
