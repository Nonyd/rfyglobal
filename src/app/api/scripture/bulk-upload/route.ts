import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface ParsedScripture {
  reference: string
  text: string
  translation: string
}

function parseTxtFile(content: string): { parsed: ParsedScripture[]; errors: string[] } {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const parsed: ParsedScripture[] = []
  const errors: string[] = []

  lines.forEach((line, index) => {
    const lineNum = index + 1
    if (line.startsWith('#')) return

    const parts = line.split(' | ')
    if (parts.length < 2) {
      errors.push(
        `Line ${lineNum}: Not enough parts - expected "REFERENCE | TEXT | TRANSLATION" (got: "${line.slice(0, 60)}...")`,
      )
      return
    }

    const reference = parts[0]?.trim() ?? ''
    const text = parts[1]?.trim() ?? ''
    const translation = parts[2]?.trim() || 'NIV'

    if (!reference) {
      errors.push(`Line ${lineNum}: Missing reference`)
      return
    }

    if (!text || text.length < 5) {
      errors.push(`Line ${lineNum}: Scripture text too short`)
      return
    }

    parsed.push({ reference, text, translation })
  })

  return { parsed, errors }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!file.name.endsWith('.txt')) {
    return NextResponse.json({ error: 'File must be a .txt file' }, { status: 400 })
  }
  if (file.size > 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 1MB)' }, { status: 400 })
  }

  const content = await file.text()
  const { parsed, errors } = parseTxtFile(content)

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No valid scriptures found in file', errors }, { status: 400 })
  }

  const existingRefs = await db.scripture.findMany({ select: { reference: true } })
  const existingSet = new Set(existingRefs.map((item) => item.reference.toLowerCase().trim()))

  const duplicates: string[] = []
  const toInsert = parsed.filter((item) => {
    const normalizedRef = item.reference.toLowerCase().trim()
    if (existingSet.has(normalizedRef)) {
      duplicates.push(item.reference)
      return false
    }
    existingSet.add(normalizedRef)
    return true
  })

  let created = 0
  if (toInsert.length > 0) {
    const result = await db.scripture.createMany({
      data: toInsert.map((item) => ({
        reference: item.reference,
        text: item.text,
        translation: item.translation,
        isDraft: true,
        isActive: false,
        scheduledAt: null,
      })),
    })
    created = result.count
  }

  return NextResponse.json({
    success: true,
    created,
    duplicates: duplicates.length,
    duplicateRefs: duplicates,
    errors,
    total: parsed.length,
  })
}
