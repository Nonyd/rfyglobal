import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const categories = await db.faqCategory.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      faqs: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  return NextResponse.json(categories)
}
