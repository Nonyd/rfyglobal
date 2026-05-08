import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await db.faqCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      faqs: { orderBy: { order: 'asc' } },
      _count: { select: { faqs: true } },
    },
  })

  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.type === 'category') {
    const maxOrder = await db.faqCategory.count()
    const category = await db.faqCategory.create({
      data: { title: body.title, order: maxOrder },
    })
    return NextResponse.json(category, { status: 201 })
  }

  if (body.type === 'faq') {
    const maxOrder = await db.faq.count({ where: { categoryId: body.categoryId } })
    const faq = await db.faq.create({
      data: {
        question: body.question,
        answer: body.answer,
        categoryId: body.categoryId,
        order: maxOrder,
      },
    })
    return NextResponse.json(faq, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
