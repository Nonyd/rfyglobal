import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { db } from '@/lib/db'
import { paramId } from '@/lib/api-route-params'

export const runtime = 'nodejs'

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'partnership')
  if (denied) return denied

  const id = await paramId(ctx.params)
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  try {
    await db.givingRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[admin partner gifts DELETE]', e)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  if (req.headers.get('X-HTTP-Method-Override') === 'DELETE') {
    return DELETE(req, ctx)
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
