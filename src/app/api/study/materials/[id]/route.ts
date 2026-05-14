import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.studyMaterial.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  if (req.headers.get('X-HTTP-Method-Override') === 'DELETE') {
    return DELETE(req, ctx)
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
