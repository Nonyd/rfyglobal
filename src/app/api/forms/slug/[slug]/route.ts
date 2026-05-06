import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const form = await db.form.findUnique({
    where: { slug: params.slug, isActive: true },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  const { notifyEmail, ...publicForm } = form
  void notifyEmail
  return NextResponse.json(publicForm)
}
