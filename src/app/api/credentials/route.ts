import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { decrypt, encrypt, maskSecret } from '@/lib/encryption'

export const runtime = 'nodejs'

const NON_SECRET_KEYS = new Set([
  'fromEmail',
  'fromName',
  'senderId',
  'bankName',
  'accountName',
  'contactEmail',
  'minimumGiftAmount',
])

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const records = await db.credential.findMany({ orderBy: { service: 'asc' } })

  const masked = records.map((record) => {
    try {
      const data = JSON.parse(decrypt(record.data)) as Record<string, unknown>
      const maskedData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => {
          if (typeof v === 'string' && v.length > 6 && !NON_SECRET_KEYS.has(k)) {
            return [k, maskSecret(v)]
          }
          return [k, v]
        })
      )
      return { service: record.service, isActive: record.isActive, data: maskedData }
    } catch {
      return { service: record.service, isActive: record.isActive, data: {} }
    }
  })

  return NextResponse.json(masked)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    service?: string
    data?: Record<string, unknown>
    isActive?: boolean
  }

  const { service, data, isActive } = body
  if (!service || !data) {
    return NextResponse.json({ error: 'service and data required' }, { status: 400 })
  }

  let mergedData = { ...data }
  const existing = await db.credential.findUnique({ where: { service } })
  if (existing) {
    try {
      const currentData = JSON.parse(decrypt(existing.data)) as Record<string, unknown>
      mergedData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => {
          if (typeof v === 'string' && v.includes('•')) return [k, currentData[k] ?? v]
          return [k, v]
        })
      )
    } catch {
      // keep submitted data when existing decrypt fails
    }
  }

  const encrypted = encrypt(JSON.stringify(mergedData))
  const record = await db.credential.upsert({
    where: { service },
    update: { data: encrypted, isActive: isActive ?? true },
    create: { service, data: encrypted, isActive: isActive ?? true },
  })

  return NextResponse.json({ service: record.service, isActive: record.isActive })
}
