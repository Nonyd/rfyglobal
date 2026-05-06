import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export const runtime = 'nodejs'

const UpdateSchema = z.object({
  whatsappChannelUrl: z.string().optional(),
  devotionalEmailTime: z.string().optional(),
  isDevotionalActive: z.boolean().optional(),
  isEventReminderActive: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const existing = await db.automationSettings.findFirst()
  const settings = existing
    ? await db.automationSettings.update({
        where: { id: existing.id },
        data,
      })
    : await db.automationSettings.create({
        data: {
          whatsappChannelUrl: data.whatsappChannelUrl ?? '',
          devotionalEmailTime: data.devotionalEmailTime ?? '07:00',
          isDevotionalActive: data.isDevotionalActive ?? true,
          isEventReminderActive: data.isEventReminderActive ?? true,
        },
      })

  return NextResponse.json(settings)
}
