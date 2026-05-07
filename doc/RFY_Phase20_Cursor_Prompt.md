# ROOM FOR YOU — Phase 20 Cursor Prompt
## Scripture Share Card · WhatsApp Share · Bulk TXT Upload · Draft System

---

## CONTEXT

Phase 20 improves the daily scripture system with three features:

1. **Scripture share card** — downloadable image with RFY logo, cream/white background, scripture text and reference. Works for WhatsApp sharing.
2. **WhatsApp share** — pre-fills a WhatsApp message with the scripture text, reference, and a link to rfyglobal.org/word
3. **Bulk scripture upload** — admin uploads a .txt file, scriptures are parsed and saved as drafts. Admin then adds audio to each and publishes individually.

---

## TASK 1 — Install Dependencies

```bash
npm install html2canvas
```

`html2canvas` renders a DOM element to a canvas which can then be downloaded as an image. This is simpler than server-side image generation and works entirely client-side.

---

## TASK 2 — Scripture Share Card Component

Create `src/components/word/ScriptureShareCard.tsx`:

This component renders a beautifully designed scripture card that:
- Is rendered off-screen (positioned outside viewport)
- Gets captured by html2canvas when download is triggered
- Has a cream/white background, RFY logo, scripture text, reference, and site URL

```typescript
'use client'

import { forwardRef } from 'react'

interface ScriptureShareCardProps {
  reference: string
  text: string
  translation: string
}

export const ScriptureShareCard = forwardRef<HTMLDivElement, ScriptureShareCardProps>(
  ({ reference, text, translation }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1080px',
          height: '1080px',
          background: '#F5F0E8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          boxSizing: 'border-box',
        }}
      >
        {/* Top border accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)',
        }} />

        {/* RFY Logo text (use text since image loading in html2canvas can be tricky) */}
        <div style={{
          position: 'absolute',
          top: '48px',
          left: '80px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22px',
              fontWeight: '700',
              color: '#1A1714',
              letterSpacing: '0.1em',
              margin: 0,
              lineHeight: 1,
            }}>
              ROOM FOR YOU
            </p>
            <p style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '11px',
              color: '#C9A84C',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              margin: '4px 0 0 0',
            }}>
              rfyglobal.org
            </p>
          </div>
          <p style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#9A8F84',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Daily Word
          </p>
        </div>

        {/* Center content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '860px',
        }}>
          {/* Translation badge */}
          <p style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#C9A84C',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: '0 0 24px 0',
          }}>
            {translation}
          </p>

          {/* Reference */}
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '48px',
            fontWeight: '700',
            color: '#1A1714',
            margin: '0 0 32px 0',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            {reference}
          </p>

          {/* Gold divider */}
          <div style={{
            width: '60px',
            height: '2px',
            background: '#C9A84C',
            margin: '0 0 40px 0',
          }} />

          {/* Scripture text */}
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: text.length > 200 ? '26px' : text.length > 120 ? '30px' : '36px',
            fontStyle: 'italic',
            color: '#2C2520',
            lineHeight: 1.7,
            margin: 0,
          }}>
            "{text}"
          </p>
        </div>

        {/* Bottom */}
        <div style={{
          position: 'absolute',
          bottom: '48px',
          left: '80px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#C9A84C',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Jesus to Nations — 2 Cor 5:17-21
          </p>
        </div>

        {/* Bottom border accent */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)',
        }} />
      </div>
    )
  }
)

ScriptureShareCard.displayName = 'ScriptureShareCard'
```

---

## TASK 3 — Scripture Share Button with Download + WhatsApp

Create `src/components/word/ScriptureShareButton.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, MessageCircle, Link2, X, Loader2 } from 'lucide-react'
import { ScriptureShareCard } from './ScriptureShareCard'
import toast from 'react-hot-toast'

interface ScriptureShareButtonProps {
  scriptureId: string
  reference: string
  text: string
  translation: string
}

export function ScriptureShareButton({
  scriptureId,
  reference,
  text,
  translation,
}: ScriptureShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadCard = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    setOpen(false)

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(cardRef.current, {
        scale: 1,
        useCORS: true,
        backgroundColor: '#F5F0E8',
        width: 1080,
        height: 1080,
        logging: false,
      })

      const link = document.createElement('a')
      link.download = `rfy-word-${reference.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Scripture card downloaded!')
    } catch (err) {
      console.error('Download failed:', err)
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const shareToWhatsApp = () => {
    const message = `*${reference}*\n\n"${text}"\n\n— ${translation}\n\n📖 Daily Word from Room For You\n🔗 rfyglobal.org/word`
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
    setOpen(false)
  }

  const copyLink = () => {
    const url = `${window.location.origin}/word`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
    setOpen(false)
  }

  return (
    <>
      {/* Off-screen share card for html2canvas */}
      <ScriptureShareCard
        ref={cardRef}
        reference={reference}
        text={text}
        translation={translation}
      />

      {/* Share button */}
      <div className="relative">
        <button
          onClick={() => setOpen(p => !p)}
          disabled={downloading}
          className="flex items-center gap-2 px-6 py-3 font-body text-xs tracking-widest uppercase border transition-all duration-300"
          style={{
            borderColor: 'rgba(201,168,76,0.4)',
            color: '#C9A84C',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {downloading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Share2 size={13} />
              Share
            </>
          )}
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 overflow-hidden"
                style={{
                  background: '#1A1A1A',
                  border: '1px solid rgba(201,168,76,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
              >
                {[
                  {
                    icon: <MessageCircle size={14} />,
                    label: 'WhatsApp',
                    sublabel: 'Share text to group',
                    action: shareToWhatsApp,
                    color: '#25D366',
                  },
                  {
                    icon: <Download size={14} />,
                    label: 'Download Card',
                    sublabel: 'Save as image (1080×1080)',
                    action: downloadCard,
                    color: '#C9A84C',
                  },
                  {
                    icon: <Link2 size={14} />,
                    label: 'Copy Link',
                    sublabel: 'rfyglobal.org/word',
                    action: copyLink,
                    color: 'rgba(248,248,248,0.6)',
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <div>
                      <p className="font-body text-xs font-medium" style={{ color: '#F8F8F8' }}>
                        {item.label}
                      </p>
                      <p className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {item.sublabel}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
```

---

## TASK 4 — Replace Old ShareButton on Word Page

Open `src/app/(public)/word/page.tsx` or `src/components/word/WordClient.tsx`.

Replace the existing `<ShareButton>` with the new `<ScriptureShareButton>`:

```typescript
import { ScriptureShareButton } from '@/components/word/ScriptureShareButton'

// Replace:
<ShareButton scriptureId={scripture.id} reference={scripture.reference} />

// With:
<ScriptureShareButton
  scriptureId={scripture.id}
  reference={scripture.reference}
  text={scripture.text}
  translation={scripture.translation}
/>
```

---

## TASK 5 — Prisma Schema: Add Draft Status to Scripture

Update `prisma/schema.prisma` — add `isDraft` field to Scripture:

```prisma
model Scripture {
  id          String    @id @default(cuid())
  reference   String
  text        String    @db.Text
  translation String    @default("NIV")
  audioUrl    String?
  scheduledAt DateTime?
  isActive    Boolean   @default(true)
  isDraft     Boolean   @default(false)  // ADD THIS
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

Run: `npx prisma db push`

---

## TASK 6 — Bulk Scripture Upload API

Create `src/app/api/scripture/bulk-upload/route.ts`:

```typescript
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
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const parsed: ParsedScripture[] = []
  const errors: string[] = []

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Skip comment lines starting with #
    if (line.startsWith('#')) return

    const parts = line.split(' | ')

    if (parts.length < 2) {
      errors.push(`Line ${lineNum}: Not enough parts — expected "REFERENCE | TEXT | TRANSLATION" (got: "${line.slice(0, 60)}…")`)
      return
    }

    const reference = parts[0].trim()
    const text = parts[1].trim()
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

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!file.name.endsWith('.txt')) {
    return NextResponse.json({ error: 'File must be a .txt file' }, { status: 400 })
  }

  if (file.size > 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 1MB)' }, { status: 400 })
  }

  const content = await file.text()
  const { parsed, errors } = parseTxtFile(content)

  if (parsed.length === 0) {
    return NextResponse.json({
      error: 'No valid scriptures found in file',
      errors,
    }, { status: 400 })
  }

  // Check for duplicates against existing scriptures
  const existingRefs = await db.scripture.findMany({
    select: { reference: true },
  })
  const existingSet = new Set(existingRefs.map(s => s.reference.toLowerCase().trim()))

  const duplicates: string[] = []
  const toInsert = parsed.filter(s => {
    if (existingSet.has(s.reference.toLowerCase().trim())) {
      duplicates.push(s.reference)
      return false
    }
    return true
  })

  // Insert all as drafts
  let created = 0
  if (toInsert.length > 0) {
    const result = await db.scripture.createMany({
      data: toInsert.map(s => ({
        reference: s.reference,
        text: s.text,
        translation: s.translation,
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
```

---

## TASK 7 — Admin ScriptureManager: Bulk Upload UI + Draft System

Open `src/components/admin/scripture/ScriptureManager.tsx`.

**Add two new UI sections:**

### A — Bulk Upload Panel

Add a "Bulk Upload" button in the header that opens a slide-in panel:

```typescript
// Add state:
const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
const [bulkFile, setBulkFile] = useState<File | null>(null)
const [bulkUploading, setBulkUploading] = useState(false)
const [bulkResult, setBulkResult] = useState<{
  created: number
  duplicates: number
  duplicateRefs: string[]
  errors: string[]
  total: number
} | null>(null)

const handleBulkUpload = async () => {
  if (!bulkFile) return
  setBulkUploading(true)
  setBulkResult(null)

  try {
    const formData = new FormData()
    formData.append('file', bulkFile)

    const res = await fetch('/api/scripture/bulk-upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error ?? 'Upload failed')
    }

    setBulkResult(data)
    if (data.created > 0) {
      toast.success(`${data.created} scriptures added as drafts`)
      await loadScriptures() // refresh the list
    }
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Upload failed')
  } finally {
    setBulkUploading(false)
  }
}
```

Bulk upload panel content:

```typescript
<div className="p-8 space-y-6">
  <div className="flex items-center justify-between">
    <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--a-text)' }}>
      Bulk Upload Scriptures
    </h3>
    <button onClick={() => setBulkUploadOpen(false)} style={{ color: 'var(--a-text-muted)' }}>
      <X size={20} />
    </button>
  </div>

  {/* Format instructions */}
  <div className="p-4 border" style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}>
    <p className="font-body text-xs font-medium mb-2" style={{ color: 'var(--a-gold)' }}>
      File Format (.txt)
    </p>
    <p className="font-body text-xs mb-3" style={{ color: 'var(--a-text-secondary)' }}>
      One scripture per line. Three parts separated by <code style={{ background: 'var(--a-bg)', padding: '1px 4px' }}> | </code> (space-pipe-space):
    </p>
    <div className="p-3 font-mono text-xs" style={{ background: 'var(--a-bg)', color: 'var(--a-text-secondary)' }}>
      <p>John 3:16 | For God so loved the world... | NIV</p>
      <p>Romans 8:1 | There is now no condemnation... | NIV</p>
      <p>Psalm 23:1 | The LORD is my shepherd... | KJV</p>
    </div>
    <p className="font-body text-xs mt-2" style={{ color: 'var(--a-text-muted)' }}>
      Lines starting with # are ignored. Translation defaults to NIV if omitted.
      All uploads are saved as <strong>drafts</strong> — publish after adding audio.
    </p>
  </div>

  {/* File input */}
  <div>
    <label className="block text-xs uppercase tracking-widest font-body font-medium mb-2"
      style={{ color: 'var(--a-text-secondary)' }}>
      Select .txt File
    </label>
    <input
      type="file"
      accept=".txt"
      onChange={e => setBulkFile(e.target.files?.[0] ?? null)}
      className="w-full font-body text-sm"
      style={{ color: 'var(--a-text)' }}
    />
    {bulkFile && (
      <p className="font-body text-xs mt-1" style={{ color: 'var(--a-text-muted)' }}>
        {bulkFile.name} · {(bulkFile.size / 1024).toFixed(1)}KB
      </p>
    )}
  </div>

  {/* Upload button */}
  <button
    onClick={handleBulkUpload}
    disabled={!bulkFile || bulkUploading}
    className="w-full py-3 font-body text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
    style={{ background: 'var(--a-gold)' }}
  >
    {bulkUploading ? 'Uploading…' : 'Upload & Create Drafts'}
  </button>

  {/* Results */}
  {bulkResult && (
    <div className="space-y-3">
      {/* Summary */}
      <div className="p-4 border" style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--a-gold)' }}>
              {bulkResult.created}
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>Created</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--a-text)' }}>
              {bulkResult.duplicates}
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>Duplicates</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold" style={{ color: bulkResult.errors.length > 0 ? 'var(--a-red)' : 'var(--a-text)' }}>
              {bulkResult.errors.length}
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>Errors</p>
          </div>
        </div>
      </div>

      {/* Duplicate refs */}
      {bulkResult.duplicateRefs.length > 0 && (
        <div className="p-3 border" style={{ borderColor: 'var(--a-border)' }}>
          <p className="font-body text-xs font-medium mb-2" style={{ color: 'var(--a-text-secondary)' }}>
            Skipped (already exist):
          </p>
          {bulkResult.duplicateRefs.map((ref, i) => (
            <p key={i} className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
              — {ref}
            </p>
          ))}
        </div>
      )}

      {/* Parse errors */}
      {bulkResult.errors.length > 0 && (
        <div className="p-3 border" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <p className="font-body text-xs font-medium mb-2" style={{ color: '#FCA5A5' }}>
            Parse errors:
          </p>
          {bulkResult.errors.map((err, i) => (
            <p key={i} className="font-body text-xs" style={{ color: 'rgba(252,165,165,0.8)' }}>
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  )}
</div>
```

### B — Draft/Published Filter Tabs

Add tabs above the scripture list to filter between Published and Drafts:

```typescript
// Add state:
const [tab, setTab] = useState<'published' | 'drafts'>('published')

// Filter displayed scriptures by tab:
const displayedScriptures = scriptures.filter(s =>
  tab === 'drafts' ? s.isDraft : !s.isDraft
)

// Tab UI above the list:
<div className="flex border-b mb-4" style={{ borderColor: 'var(--a-border)' }}>
  {(['published', 'drafts'] as const).map(t => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className="px-5 py-2.5 font-body text-sm font-medium capitalize transition-all border-b-2"
      style={{
        borderBottomColor: tab === t ? 'var(--a-gold)' : 'transparent',
        color: tab === t ? 'var(--a-gold)' : 'var(--a-text-muted)',
        marginBottom: '-1px',
      }}
    >
      {t}
      <span className="ml-2 text-xs opacity-60">
        ({scriptures.filter(s => t === 'drafts' ? s.isDraft : !s.isDraft).length})
      </span>
    </button>
  ))}
</div>
```

### C — Publish Draft Action

On each draft scripture card, add a "Publish" button that:
1. Clears `isDraft: false`
2. Sets `isActive: true`
3. Moves it to the Published tab

```typescript
const publishDraft = async (scriptureId: string) => {
  const res = await fetch(`/api/scripture/${scriptureId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isDraft: false, isActive: true }),
  })
  if (res.ok) {
    toast.success('Scripture published')
    await loadScriptures()
  } else {
    toast.error('Failed to publish')
  }
}

// Add to draft scripture card actions:
<button
  onClick={() => publishDraft(scripture.id)}
  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-body font-medium text-white transition-all"
  style={{ background: 'var(--a-gold)' }}
>
  Publish
</button>
```

### D — Update Scripture API to Handle isDraft

Open `src/app/api/scripture/[id]/route.ts`.

Ensure the PATCH handler accepts `isDraft`:

```typescript
const updateData: Record<string, unknown> = {}
if (body.reference !== undefined) updateData.reference = body.reference
if (body.text !== undefined) updateData.text = body.text
if (body.translation !== undefined) updateData.translation = body.translation
if (body.audioUrl !== undefined) updateData.audioUrl = body.audioUrl
if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
if (body.isActive !== undefined) updateData.isActive = body.isActive
if (body.isDraft !== undefined) updateData.isDraft = body.isDraft  // ADD THIS
```

Also update the scripture list query to include `isDraft`:

```typescript
const scriptures = await db.scripture.findMany({
  orderBy: { createdAt: 'desc' },
  // Return all including drafts for admin
})
```

---

## TASK 8 — Update Scripture Loading in Admin

The `ScriptureManager` currently loads scriptures via `GET /api/scripture` (admin version). Ensure it returns all scriptures including drafts:

Open `src/app/api/scripture/route.ts`.

In the admin GET handler (authenticated), include drafts:

```typescript
// Admin — return all including drafts
if (session) {
  const scriptures = await db.scripture.findMany({
    orderBy: { createdAt: 'desc' },
    // No isDraft filter — return everything
  })
  return NextResponse.json(scriptures)
}

// Public — only published, non-draft scriptures
const scriptures = await db.scripture.findMany({
  where: { isActive: true, isDraft: false },
  orderBy: { scheduledAt: 'desc' },
})
return NextResponse.json(scriptures)
```

---

## PHASE 20 COMPLETION CHECKLIST

**Scripture Share Card**
- [ ] `ScriptureShareCard` renders off-screen with cream background
- [ ] Card shows: RFY branding, reference, gold divider, italic scripture text, bottom tagline
- [ ] Font size scales based on text length (shorter text = larger font)
- [ ] Download generates a 1080×1080 PNG

**Share Button**
- [ ] Share dropdown shows: WhatsApp, Download Card, Copy Link
- [ ] WhatsApp opens wa.me with pre-filled message (reference + text + rfyglobal.org/word link)
- [ ] Download Card generates and saves PNG
- [ ] Copy Link copies rfyglobal.org/word to clipboard with toast
- [ ] Loading state shows during image generation

**Bulk Upload**
- [ ] `POST /api/scripture/bulk-upload` parses .txt file correctly
- [ ] Lines with correct format are parsed
- [ ] Lines starting with # are ignored
- [ ] Lines with wrong format show parse errors
- [ ] Duplicate references are detected and skipped
- [ ] All valid scriptures created as drafts (`isDraft: true`, `isActive: false`)
- [ ] Upload result shows: created / duplicates / errors counts

**Draft System**
- [ ] Admin scripture list has Published / Drafts tabs
- [ ] Draft scriptures show in Drafts tab
- [ ] Each draft has "Publish" button
- [ ] Publishing sets `isDraft: false` and `isActive: true`
- [ ] Draft scriptures do NOT appear on public /word page

**Schema**
- [ ] `isDraft` field added to Scripture model
- [ ] `npx prisma db push` succeeds

---

## NOTES FOR CURSOR

- `html2canvas` must be dynamically imported (`await import('html2canvas')`) to avoid SSR errors since it uses browser DOM APIs. Never import it at the top level.
- The `ScriptureShareCard` uses inline `style` props (not Tailwind) because html2canvas renders inline styles more reliably than CSS classes from external stylesheets.
- The share card is positioned at `left: -9999px` — not `display: none` or `visibility: hidden` — because html2canvas cannot capture hidden elements. The -9999px positioning keeps it off-screen but still in the DOM and renderable.
- Font size in the share card auto-scales: text over 200 chars → 26px, over 120 chars → 30px, otherwise → 36px. This prevents long verses from overflowing.
- The bulk upload `.txt` parser is strict about the ` | ` separator (space-pipe-space) to prevent accidental splits on pipe characters within scripture text.
- Draft scriptures have `isActive: false` by default — they will never appear in the daily scripture rotation or on the public /word page until explicitly published.
- The public scripture API already filters `isActive: true` — adding `isDraft: false` makes it doubly safe.
