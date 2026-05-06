# ROOM FOR YOU — Phase 5 Cursor Prompt
## Daily Scripture System + Animated Confession Page

---

## CONTEXT

Phases 1–4 are complete. The platform is now fully functional with landing page, form builder, blog, study portal, events, and partnership/payments.

Phase 5 builds two of the most spiritually intentional features on the entire site:

1. **Daily Scripture System** — Admin creates scriptures with uploaded MP3 audio, sets a scheduled date or adds to the random pool, and the site displays one scripture + audio per day. Features a custom audio player, a Satori-generated shareable card, and a full archive at `/word`.

2. **Animated Confession Page** — A full-screen, GSAP ScrollTrigger-driven experience at `/confession` where each line of the Room For You confession appears one by one as the visitor scrolls. The most sacred and intentional page on the site.

---

## NO NEW DEPENDENCIES

All dependencies are already installed:
- `gsap` + `@gsap/react` — for ScrollTrigger on confession page
- `satori` + `@resvg/resvg-js` — for shareable scripture card
- `uploadthing` + `@uploadthing/react` — for MP3 upload (add `scriptureAudio` endpoint was already defined in Phase 3's `src/lib/uploadthing.ts`)

Verify `scriptureAudio` endpoint exists in `src/lib/uploadthing.ts`. If not, add:

```typescript
scriptureAudio: f({ audio: { maxFileSize: '32MB', maxFileCount: 1 } })
  .middleware(async () => {
    const session = await auth()
    if (!session) throw new Error('Unauthorized')
    return { userId: session.user?.email }
  })
  .onUploadComplete(async ({ file }) => {
    return { url: file.url }
  }),
```

---

## ═══════════════════════════════════════
## MODULE 1 — DAILY SCRIPTURE SYSTEM
## ═══════════════════════════════════════

### TASK 1 — Scripture Zod Schemas

Create `src/lib/validations/scripture.ts`:

```typescript
import { z } from 'zod'

export const CreateScriptureSchema = z.object({
  reference: z.string().min(1, 'Reference is required').max(100),
  text: z.string().min(1, 'Scripture text is required').max(2000),
  translation: z.string().default('KJV'),
  audioUrl: z.string().url().optional().or(z.literal('')),
  scheduledAt: z.string().datetime().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

export const UpdateScriptureSchema = CreateScriptureSchema.partial()

export type CreateScriptureInput = z.infer<typeof CreateScriptureSchema>
export type UpdateScriptureInput = z.infer<typeof UpdateScriptureSchema>
```

---

### TASK 2 — Scripture Admin API Routes

#### `src/app/api/scripture/route.ts` — List & Create (Admin)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateScriptureSchema } from '@/lib/validations/scripture'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scriptures = await db.scripture.findMany({
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(scriptures)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateScriptureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { scheduledAt, audioUrl, ...rest } = parsed.data

  const scripture = await db.scripture.create({
    data: {
      ...rest,
      audioUrl: audioUrl || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  })

  return NextResponse.json(scripture, { status: 201 })
}
```

#### `src/app/api/scripture/[id]/route.ts` — Update & Delete (Admin)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UpdateScriptureSchema } from '@/lib/validations/scripture'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateScriptureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { scheduledAt, audioUrl, ...rest } = parsed.data

  const scripture = await db.scripture.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(audioUrl !== undefined && { audioUrl: audioUrl || null }),
      ...(scheduledAt !== undefined && {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      }),
    },
  })

  return NextResponse.json(scripture)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.scripture.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

#### `src/app/api/scripture/today/route.ts` — Public (already exists from Phase 1)

This route already exists. Verify it matches this logic and update if needed:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const revalidate = 3600 // revalidate every hour

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // First: check for a scripture scheduled specifically for today
    let scripture = await db.scripture.findFirst({
      where: {
        scheduledAt: { gte: today, lt: tomorrow },
        isActive: true,
      },
    })

    // Fallback: pick from random pool (scheduledAt is null)
    if (!scripture) {
      const pool = await db.scripture.findMany({
        where: { scheduledAt: null, isActive: true },
      })
      if (pool.length > 0) {
        // Date-seeded selection — consistent for the full calendar day
        const seed =
          today.getFullYear() * 10000 +
          (today.getMonth() + 1) * 100 +
          today.getDate()
        scripture = pool[seed % pool.length]
      }
    }

    if (!scripture) {
      return NextResponse.json({
        id: 'fallback',
        reference: '2 Corinthians 5:17',
        text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
        translation: 'NIV',
        audioUrl: null,
      })
    }

    return NextResponse.json(scripture)
  } catch {
    return NextResponse.json({
      id: 'fallback',
      reference: '2 Corinthians 5:17',
      text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
      translation: 'NIV',
      audioUrl: null,
    })
  }
}
```

#### `src/app/api/scripture/archive/route.ts` — Public archive

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const scriptures = await db.scripture.findMany({
    where: { isActive: true },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      reference: true,
      text: true,
      translation: true,
      audioUrl: true,
      scheduledAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json(scriptures)
}
```

---

### TASK 3 — OG Share Card Route (Satori)

Update `src/app/api/og/scripture/route.ts` to handle a `?id=` query param and generate a beautiful shareable card:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  let reference = '2 Corinthians 5:17'
  let text = 'Therefore, if anyone is in Christ, the new creation has come.'
  let translation = 'NIV'

  if (id && id !== 'fallback') {
    const scripture = await db.scripture.findUnique({ where: { id } })
    if (scripture) {
      reference = scripture.reference
      text = scripture.text
      translation = scripture.translation
    }
  }

  // Truncate text for card
  const displayText = text.length > 180 ? text.slice(0, 177) + '…' : text

  // Fetch Inter font for Satori
  const fontRes = await fetch(
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff'
  )
  const fontData = await fontRes.arrayBuffer()

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          position: 'relative',
        },
        children: [
          // Top: gold line
          {
            type: 'div',
            props: {
              style: {
                width: '80px',
                height: '3px',
                background: '#C9A84C',
                marginBottom: '40px',
              },
            },
          },
          // Scripture text
          {
            type: 'div',
            props: {
              style: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              },
              children: [
                {
                  type: 'p',
                  props: {
                    style: {
                      fontSize: '36px',
                      color: '#FAFAFA',
                      lineHeight: 1.6,
                      fontWeight: 300,
                      fontStyle: 'italic',
                      marginBottom: '32px',
                      fontFamily: 'Inter',
                    },
                    children: `"${displayText}"`,
                  },
                },
                {
                  type: 'p',
                  props: {
                    style: {
                      fontSize: '20px',
                      color: '#C9A84C',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      fontFamily: 'Inter',
                    },
                    children: `${reference} (${translation})`,
                  },
                },
              ],
            },
          },
          // Bottom: branding
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(201,168,76,0.3)',
                paddingTop: '24px',
              },
              children: [
                {
                  type: 'p',
                  props: {
                    style: {
                      fontSize: '14px',
                      color: 'rgba(201,168,76,0.6)',
                      letterSpacing: '0.2em',
                      fontFamily: 'Inter',
                      fontWeight: 600,
                    },
                    children: 'ROOM FOR YOU · WITH YADAH',
                  },
                },
                {
                  type: 'p',
                  props: {
                    style: {
                      fontSize: '12px',
                      color: 'rgba(201,168,76,0.4)',
                      letterSpacing: '0.15em',
                      fontFamily: 'Inter',
                    },
                    children: 'RFYGLOBAL.ORG',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: fontData, weight: 400, style: 'normal' }],
    }
  )

  const resvg = new Resvg(svg)
  const png = resvg.render().asPng()

  return new NextResponse(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // cache for 24 hours
    },
  })
}
```

---

### TASK 4 — Admin Scripture Page

Create `src/app/admin/(dashboard)/scripture/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { ScriptureManager } from '@/components/admin/scripture/ScriptureManager'

export const dynamic = 'force-dynamic'

export default async function ScripturePage() {
  const scriptures = await db.scripture.findMany({
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
  })

  return <ScriptureManager initialScriptures={scriptures} />
}
```

---

### TASK 5 — ScriptureManager Component

Create `src/components/admin/scripture/ScriptureManager.tsx`:

This is the full admin interface for managing scriptures. It must include:

**Header:**
- Title: "Daily Scripture"
- Subtitle: "One scripture + audio displayed per day"
- **"Add Scripture"** button (gold)

**Scripture List:**
Each scripture shown as a card with:
- Reference (gold, display font) + Translation badge
- First 100 chars of text (white/60)
- Schedule info: `"Scheduled: [date]"` in gold or `"Random Pool"` in white/40
- Active/Inactive toggle
- Edit button (opens slide-in panel)
- Delete button with confirmation
- Audio indicator: a small gold waveform icon if `audioUrl` exists

**Slide-in Panel (for Add/Edit):**
A right-side panel that slides in from the right using Framer Motion:
- Scripture Reference input (e.g. "John 3:16")
- Translation selector: KJV, NIV, ESV, NKJV, AMP, NLT
- Scripture Text textarea (large, at least 6 rows)
- Audio upload via Uploadthing `scriptureAudio` endpoint — shows filename + remove button if uploaded
- Schedule type toggle: **"Specific Date"** or **"Random Pool"**
  - If "Specific Date": date picker input appears
  - If "Random Pool": shows info text "This scripture will be randomly displayed when no scripture is scheduled for that day"
- Active toggle
- Save button

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Volume2, Calendar, Shuffle, X } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing-client'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Scripture } from '@prisma/client'

const TRANSLATIONS = ['KJV', 'NIV', 'ESV', 'NKJV', 'AMP', 'NLT']

interface ScriptureManagerProps {
  initialScriptures: Scripture[]
}

export function ScriptureManager({ initialScriptures }: ScriptureManagerProps) {
  const [scriptures, setScriptures] = useState(initialScriptures)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Scripture | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [reference, setReference] = useState('')
  const [translation, setTranslation] = useState('KJV')
  const [text, setText] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [scheduleType, setScheduleType] = useState<'DATE' | 'RANDOM'>('RANDOM')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isActive, setIsActive] = useState(true)

  const openNew = () => {
    setEditing(null)
    setReference(''); setTranslation('KJV'); setText('')
    setAudioUrl(''); setScheduleType('RANDOM'); setScheduledAt(''); setIsActive(true)
    setPanelOpen(true)
  }

  const openEdit = (s: Scripture) => {
    setEditing(s)
    setReference(s.reference); setTranslation(s.translation); setText(s.text)
    setAudioUrl(s.audioUrl ?? '')
    setScheduleType(s.scheduledAt ? 'DATE' : 'RANDOM')
    setScheduledAt(s.scheduledAt ? new Date(s.scheduledAt).toISOString().split('T')[0] : '')
    setIsActive(s.isActive)
    setPanelOpen(true)
  }

  const handleSave = async () => {
    if (!reference.trim()) { toast.error('Reference is required'); return }
    if (!text.trim()) { toast.error('Scripture text is required'); return }
    if (scheduleType === 'DATE' && !scheduledAt) { toast.error('Please select a date'); return }

    setSaving(true)
    try {
      const payload = {
        reference: reference.trim(),
        translation,
        text: text.trim(),
        audioUrl: audioUrl || '',
        scheduledAt: scheduleType === 'DATE' ? new Date(scheduledAt).toISOString() : '',
        isActive,
      }

      const url = editing ? `/api/scripture/${editing.id}` : '/api/scripture'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save scripture')

      const saved = await res.json()

      if (editing) {
        setScriptures((prev) => prev.map((s) => s.id === saved.id ? saved : s))
        toast.success('Scripture updated')
      } else {
        setScriptures((prev) => [saved, ...prev])
        toast.success('Scripture added')
      }

      setPanelOpen(false)
    } catch {
      toast.error('Failed to save scripture')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scripture?')) return
    const res = await fetch(`/api/scripture/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setScriptures((prev) => prev.filter((s) => s.id !== id))
      toast.success('Scripture deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  const toggleActive = async (s: Scripture) => {
    const res = await fetch(`/api/scripture/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !s.isActive }),
    })
    if (res.ok) {
      setScriptures((prev) => prev.map((x) => x.id === s.id ? { ...x, isActive: !x.isActive } : x))
    }
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-white">Daily Scripture</h2>
          <p className="text-white/40 text-sm font-body mt-1">
            One scripture + audio displayed per day · {scriptures.length} total
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors">
          <Plus size={16} /> Add Scripture
        </button>
      </div>

      {/* Scripture List */}
      {scriptures.length === 0 ? (
        <div className="text-center py-24 border border-dashed"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <p className="font-display text-2xl text-white/30 italic">No scriptures yet</p>
          <p className="text-white/20 text-sm mt-2 font-body">Add your first scripture to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scriptures.map((s) => (
            <div key={s.id}
              className={cn(
                'border p-5 transition-all',
                s.isActive ? 'border-gold/20 bg-gold/3' : 'border-white/8 opacity-60'
              )}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Reference + Translation */}
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-display text-lg text-gold">{s.reference}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white/40 font-body tracking-widest uppercase">
                      {s.translation}
                    </span>
                    {s.audioUrl && (
                      <span className="flex items-center gap-1 text-[10px] text-gold/60 font-body">
                        <Volume2 size={10} /> Audio
                      </span>
                    )}
                  </div>
                  {/* Text preview */}
                  <p className="text-white/60 text-sm font-body line-clamp-2 mb-2">
                    "{s.text.slice(0, 120)}{s.text.length > 120 ? '…' : ''}"
                  </p>
                  {/* Schedule */}
                  <div className="flex items-center gap-1 text-xs font-body">
                    {s.scheduledAt ? (
                      <>
                        <Calendar size={11} className="text-gold/60" />
                        <span className="text-gold/70">Scheduled: {formatDate(s.scheduledAt)}</span>
                      </>
                    ) : (
                      <>
                        <Shuffle size={11} className="text-white/30" />
                        <span className="text-white/30">Random Pool</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(s)}
                    className={cn('w-9 h-5 rounded-full transition-colors relative',
                      s.isActive ? 'bg-gold' : 'bg-white/10'
                    )}>
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                      s.isActive ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                  <button onClick={() => openEdit(s)}
                    className="p-2 text-white/40 hover:text-gold transition-colors">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="p-2 text-white/40 hover:text-red-brand transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-in Panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
              style={{ background: '#0A0A0A', borderLeft: '1px solid rgba(201,168,76,0.2)' }}
            >
              <div className="p-8 space-y-6">
                {/* Panel header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl text-white">
                    {editing ? 'Edit Scripture' : 'Add Scripture'}
                  </h3>
                  <button onClick={() => setPanelOpen(false)}
                    className="text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

                {/* Reference */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                    Scripture Reference *
                  </label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. John 3:16"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
                  />
                </div>

                {/* Translation */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                    Translation
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRANSLATIONS.map((t) => (
                      <button key={t} onClick={() => setTranslation(t)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-body border transition-colors',
                          translation === t
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-white/10 text-white/40 hover:border-gold/40'
                        )}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                    Scripture Text *
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste the scripture text here…"
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20 resize-none leading-relaxed"
                  />
                </div>

                {/* Audio Upload */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                    Audio Explanation (MP3)
                  </label>
                  {audioUrl ? (
                    <div className="flex items-center gap-3 p-3 border border-gold/20 bg-gold/5">
                      <Volume2 size={16} className="text-gold shrink-0" />
                      <span className="text-gold/80 text-sm font-body truncate flex-1">
                        Audio uploaded
                      </span>
                      <button onClick={() => setAudioUrl('')}
                        className="text-white/30 hover:text-red-brand transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <UploadButton
                      endpoint="scriptureAudio"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) setAudioUrl(res[0].url)
                        toast.success('Audio uploaded')
                      }}
                      onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
                      appearance={{
                        button: 'bg-white/5 text-white/60 border border-white/10 hover:border-gold/40 text-sm font-body px-4 py-2',
                        allowedContent: 'text-white/20 text-xs',
                      }}
                    />
                  )}
                </div>

                {/* Schedule Type */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-3">
                    Display Schedule
                  </label>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setScheduleType('RANDOM')}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-body border transition-all flex items-center justify-center gap-2',
                        scheduleType === 'RANDOM'
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-white/10 text-white/40 hover:border-gold/30'
                      )}>
                      <Shuffle size={14} /> Random Pool
                    </button>
                    <button
                      onClick={() => setScheduleType('DATE')}
                      className={cn(
                        'flex-1 py-2.5 text-sm font-body border transition-all flex items-center justify-center gap-2',
                        scheduleType === 'DATE'
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-white/10 text-white/40 hover:border-gold/30'
                      )}>
                      <Calendar size={14} /> Specific Date
                    </button>
                  </div>

                  {scheduleType === 'DATE' ? (
                    <input
                      type="date"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors"
                    />
                  ) : (
                    <p className="text-white/25 text-xs font-body leading-relaxed">
                      This scripture will be randomly selected on days when no scripture is specifically scheduled.
                    </p>
                  )}
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors',
                      isActive ? 'bg-gold' : 'bg-white/10'
                    )}>
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                      isActive ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </button>
                  <span className="text-sm text-white/60 font-body">
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-gold text-black font-body font-medium text-sm tracking-widest uppercase hover:bg-gold-light transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : editing ? 'Update Scripture' : 'Add Scripture'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### TASK 6 — Custom Audio Player Component

Create `src/components/shared/AudioPlayer.tsx`:

A beautiful, minimal custom audio player styled to match the Room For You design system. No default browser controls.

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  src: string
  className?: string
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100 || 0)
    }
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    audio.currentTime = pct * audio.duration
  }

  const formatTime = (t: number) => {
    if (isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 border',
      className
    )} style={{ borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.05)' }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full border border-gold flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all duration-200 shrink-0"
      >
        {playing ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
      </button>

      {/* Progress */}
      <div className="flex-1 space-y-1">
        <div
          onClick={seek}
          className="h-1 bg-white/10 cursor-pointer relative rounded-full overflow-hidden"
        >
          <div
            className="absolute left-0 top-0 h-full bg-gold transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-white/30">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Icon */}
      <Volume2 size={14} className="text-gold/40 shrink-0" />
    </div>
  )
}
```

---

### TASK 7 — Public Word (Scripture Archive) Page

Create `src/app/(public)/word/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WordClientPage } from '@/components/word/WordClientPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Word — Room For You',
  description: 'Daily scriptures and audio devotionals from Room For You.',
}

export const dynamic = 'force-dynamic'

export default async function WordPage() {
  const [todayRes, scriptures] = await Promise.all([
    // Reuse the today logic inline
    db.scripture.findFirst({
      where: {
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
        isActive: true,
      },
    }),
    db.scripture.findMany({
      where: { isActive: true },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  // If no scheduled today, pick from random pool
  let today = todayRes
  if (!today) {
    const pool = scriptures.filter((s) => !s.scheduledAt)
    if (pool.length > 0) {
      const d = new Date()
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
      today = pool[seed % pool.length]
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-4">
            Room For You
          </p>
          <h1 className="font-display text-5xl lg:text-7xl text-white mb-4 leading-none">
            The Word
          </h1>
          <p className="text-white/50 font-body max-w-md mx-auto">
            One scripture. Every day. With audio to bring it alive.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-xs mx-auto mt-8" />
        </div>

        <WordClientPage today={today} allScriptures={scriptures} />
      </main>
      <Footer />
    </>
  )
}
```

---

### TASK 8 — WordClientPage Component

Create `src/components/word/WordClientPage.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { AudioPlayer } from '@/components/shared/AudioPlayer'
import { ShareButton } from '@/components/shared/ShareButton'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Scripture } from '@prisma/client'

interface WordClientPageProps {
  today: Scripture | null
  allScriptures: Scripture[]
}

export function WordClientPage({ today, allScriptures }: WordClientPageProps) {
  const [view, setView] = useState<'today' | 'archive'>('today')

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* View toggle */}
      <div className="flex justify-center gap-2 mb-12">
        {(['today', 'archive'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={cn(
              'px-6 py-2 text-sm font-body tracking-widest uppercase border transition-all',
              view === v
                ? 'bg-gold text-black border-gold'
                : 'border-white/20 text-white/50 hover:border-gold/40 hover:text-white'
            )}>
            {v === 'today' ? "Today's Word" : 'Archive'}
          </button>
        ))}
      </div>

      {/* Today's Scripture */}
      {view === 'today' && (
        <div className="max-w-2xl mx-auto">
          {today ? (
            <div className="space-y-8">
              {/* Reference */}
              <div className="text-center">
                <span className="text-[10px] tracking-[0.35em] uppercase text-gold/70 font-body">
                  {today.translation}
                </span>
                <h2 className="font-display text-3xl lg:text-4xl text-gold mt-2">
                  {today.reference}
                </h2>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

              {/* Scripture text */}
              <blockquote className="font-display text-xl lg:text-2xl text-white/90 italic leading-relaxed text-center">
                "{today.text}"
              </blockquote>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

              {/* Audio Player */}
              {today.audioUrl && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest text-white/30 font-body text-center">
                    Audio Explanation
                  </p>
                  <AudioPlayer src={today.audioUrl} />
                </div>
              )}

              {/* Share */}
              <div className="flex justify-center pt-4">
                <ShareButton scriptureId={today.id} reference={today.reference} />
              </div>
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="font-display text-2xl text-white/30 italic">
                No scripture for today yet.
              </p>
              <p className="text-white/20 text-sm font-body mt-2">Check back soon.</p>
            </div>
          )}
        </div>
      )}

      {/* Archive */}
      {view === 'archive' && (
        <div className="space-y-4">
          {allScriptures.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl text-white/30 italic">No scriptures yet.</p>
            </div>
          ) : (
            allScriptures.map((s) => (
              <div key={s.id}
                className="border border-white/10 hover:border-gold/20 transition-colors p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-lg text-gold">{s.reference}</span>
                      <span className="text-[10px] text-white/30 font-body uppercase tracking-widest">
                        {s.translation}
                      </span>
                      {s.scheduledAt && (
                        <span className="text-[10px] text-gold/40 font-body">
                          {formatDate(s.scheduledAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 font-body text-sm leading-relaxed line-clamp-2 italic">
                      "{s.text}"
                    </p>
                    {s.audioUrl && (
                      <div className="mt-4">
                        <AudioPlayer src={s.audioUrl} />
                      </div>
                    )}
                  </div>
                  <ShareButton scriptureId={s.id} reference={s.reference} compact />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

---

### TASK 9 — ShareButton Component

Create `src/components/shared/ShareButton.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Share2, X, Instagram, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  scriptureId: string
  reference: string
  compact?: boolean
}

export function ShareButton({ scriptureId, reference, compact }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/scripture?id=${scriptureId}`
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/word`
  const shareText = `"${reference}" — Room For You | rfyglobal.org`

  const shareOptions = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + pageUrl)}`, '_blank'),
    },
    {
      label: 'Download Card',
      icon: Share2,
      action: async () => {
        const res = await fetch(cardUrl)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reference.replace(/\s+/g, '-')}-RFY.png`
        a.click()
        URL.revokeObjectURL(url)
      },
    },
    {
      label: 'Copy Link',
      icon: Share2,
      action: () => {
        navigator.clipboard.writeText(pageUrl)
        setOpen(false)
      },
    },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 border border-white/20 text-white/50 font-body transition-all hover:border-gold/40 hover:text-gold',
          compact ? 'p-2' : 'px-5 py-2.5 text-sm tracking-widest uppercase'
        )}>
        <Share2 size={compact ? 14 : 16} />
        {!compact && 'Share'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 right-0 w-48 border z-20 py-1"
            style={{ background: '#111', borderColor: 'rgba(201,168,76,0.3)' }}>
            {shareOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { opt.action(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-white/70 hover:bg-gold/10 hover:text-white transition-colors text-left"
              >
                <opt.icon size={14} className="text-gold/60" />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

---

## ═══════════════════════════════════════
## MODULE 2 — ANIMATED CONFESSION PAGE
## ═══════════════════════════════════════

### TASK 10 — Confession Page

Create `src/app/(public)/confession/page.tsx`:

```typescript
import { ConfessionPageClient } from '@/components/confession/ConfessionPageClient'
import { Navbar } from '@/components/layout/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Confession — Room For You',
  description: 'I am saved by grace through faith. Make this confession yours.',
}

export default function ConfessionPage() {
  return (
    <>
      <Navbar />
      <ConfessionPageClient />
    </>
  )
}
```

---

### TASK 11 — ConfessionPageClient Component

Create `src/components/confession/ConfessionPageClient.tsx`:

This is the most sacred page on the site. Build it with maximum care and intentionality.

**The full experience:**

1. **Intro screen** — Full viewport, black. Centered text: `"The Confession"` in gold, Cormorant Garamond. Below: `"Scroll to declare."` in white/40, Inter. A slow gold pulse at the bottom. The page waits for scroll.

2. **Confession scroll sequence** — Each line of the confession is pinned and revealed using GSAP ScrollTrigger. The section is tall (allow for scrolling through all 16 lines). As the user scrolls:
   - Lines that haven't been reached yet are invisible
   - The current line is full white, large, centered, with a soft gold glow behind it
   - Lines that have passed dim to white/25
   - Each transition is smooth (fade + subtle upward movement)
   - The background has a very slow, breathing radial gold glow that intensifies as lines progress

3. **Final line explosion** — When `"till his return!"` is reached:
   - A burst of gold radial glow fills the entire screen
   - The line pulses once
   - Gold particles/shimmer effect (CSS-based, no library)

4. **CTA screen** — After the last line, a final section appears:
   - `"Make this your confession."` — Cormorant Garamond, large, white
   - A large gold CTA button: `"Join the Community"` → `/forms/join-room-for-you`
   - A secondary link: `"Back to Home"` → `/`

**Confession lines (exact order):**

```javascript
const CONFESSION_LINES = [
  "I am saved by grace through faith.",
  "I am justified and redeemed by the blood of Jesus.",
  "I have received mercy because of the sacrifice of Jesus on the cross.",
  "God's love has been shed abroad in my heart",
  "and I am sealed with the Holy Spirit.",
  "I am now a part of God's family!",
  "I am committed to learning the value of this family",
  "and I grow in both wisdom and stature.",
  "I am committed to study and prayers!",
  "I am saved and I get others saved.",
  "I am reconciled and I reconcile others.",
  "On account of me, many come to the knowledge of the Son.",
  "It's Jesus to nations —",
  "and I am a willing vessel!",
  "I live my life in honor of the one who died for me,",
  "till his return!",
]
```

**Implementation using GSAP ScrollTrigger:**

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const CONFESSION_LINES = [
  "I am saved by grace through faith.",
  "I am justified and redeemed by the blood of Jesus.",
  "I have received mercy because of the sacrifice of Jesus on the cross.",
  "God's love has been shed abroad in my heart",
  "and I am sealed with the Holy Spirit.",
  "I am now a part of God's family!",
  "I am committed to learning the value of this family",
  "and I grow in both wisdom and stature.",
  "I am committed to study and prayers!",
  "I am saved and I get others saved.",
  "I am reconciled and I reconcile others.",
  "On account of me, many come to the knowledge of the Son.",
  "It's Jesus to nations —",
  "and I am a willing vessel!",
  "I live my life in honor of the one who died for me,",
  "till his return!",
]

export function ConfessionPageClient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('.confession-line')

      lines.forEach((line, i) => {
        const isLast = i === lines.length - 1

        // Pin + reveal each line on scroll
        ScrollTrigger.create({
          trigger: line,
          start: 'top 60%',
          onEnter: () => {
            // Dim all previous lines
            lines.slice(0, i).forEach((prev) => {
              gsap.to(prev, { opacity: 0.2, duration: 0.4 })
            })
            // Highlight current line
            gsap.to(line, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
            })

            // Intensify glow as we progress
            const intensity = (i + 1) / lines.length
            if (glowRef.current) {
              gsap.to(glowRef.current, {
                opacity: intensity * 0.4,
                duration: 0.8,
              })
            }

            // Final line: gold explosion
            if (isLast) {
              gsap.to(glowRef.current, {
                opacity: 1,
                scale: 1.5,
                duration: 1.2,
                ease: 'power2.out',
              })
              gsap.to('.confession-container', {
                backgroundColor: 'rgba(201,168,76,0.05)',
                duration: 1,
              })
              // Pulse the final line
              gsap.to(line, {
                textShadow: '0 0 40px rgba(201,168,76,0.8)',
                repeat: 2,
                yoyo: true,
                duration: 0.6,
                delay: 0.3,
              })
            }
          },
          onLeaveBack: () => {
            // Re-highlight previous line when scrolling back
            if (i > 0) {
              gsap.to(lines[i - 1], { opacity: 1, duration: 0.3 })
            }
            gsap.to(line, { opacity: 0.15, duration: 0.3 })
          },
        })

        // Initial state: all lines invisible except first
        gsap.set(line, {
          opacity: i === 0 ? 0.15 : 0.05,
          y: 20,
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="confession-container relative bg-black">
      {/* Breathing glow */}
      <div
        ref={glowRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.15), transparent)',
          opacity: 0,
        }}
      />

      {/* ── INTRO SCREEN ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] tracking-[0.4em] uppercase text-gold/60 font-body mb-6">
          Room For You
        </p>
        <h1 className="font-display text-5xl lg:text-7xl text-white mb-8 leading-none">
          The Confession
        </h1>
        <p className="text-white/40 font-body text-lg">Scroll to declare.</p>
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-gold/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
        </div>
      </section>

      {/* ── CONFESSION LINES ── */}
      <section className="relative z-10 min-h-screen py-32">
        <div className="max-w-3xl mx-auto px-6 space-y-24">
          {CONFESSION_LINES.map((line, i) => (
            <div
              key={i}
              className={cn(
                'confession-line text-center',
                i === CONFESSION_LINES.length - 1 && 'confession-last'
              )}
            >
              <p
                className="font-display leading-tight"
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                  color: '#FAFAFA',
                }}
              >
                {line}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA SCREEN ── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent w-48 mb-16" />
        <p className="font-display text-4xl lg:text-6xl text-white mb-4 leading-tight">
          Make this your confession.
        </p>
        <p className="text-white/40 font-body mb-12 max-w-md">
          There is a community waiting to grow with you. Step in — there is room for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/forms/join-room-for-you"
            className="px-10 py-4 bg-gold text-black font-body text-sm tracking-widest uppercase font-medium hover:bg-gold-light transition-all duration-300 animate-pulse-gold"
          >
            Join the Community
          </Link>
          <Link
            href="/"
            className="px-10 py-4 border border-white/20 text-white/60 font-body text-sm tracking-widest uppercase hover:border-gold/40 hover:text-white transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent w-48 mt-16" />
        <p className="text-white/20 text-xs font-body mt-8 tracking-wide">
          rfyglobal.org · Room For You · A SonsHub Media Initiative
        </p>
      </section>
    </div>
  )
}
```

---

## TASK 12 — Update ScriptureStrip on Landing Page

The `ScriptureStrip` component on the landing page (built in Phase 1) should now use:
- The `AudioPlayer` component from `src/components/shared/AudioPlayer.tsx`
- The `ShareButton` component from `src/components/shared/ShareButton.tsx`

Open `src/components/landing/ScriptureStrip.tsx` and:
1. Replace any placeholder audio player with `<AudioPlayer src={scripture.audioUrl} />`
2. Replace any placeholder share button with `<ShareButton scriptureId={scripture.id} reference={scripture.reference} />`
3. Ensure the strip still shows the fallback scripture gracefully when no audio exists

---

## PHASE 5 COMPLETION CHECKLIST

**Daily Scripture System**
- [ ] Admin can add a scripture with reference, text, translation, and MP3 audio
- [ ] Admin can schedule a scripture for a specific date
- [ ] Admin can add scriptures to the random pool (no date)
- [ ] `/word` shows today's scripture with audio player
- [ ] Audio player plays, pauses, and shows progress correctly
- [ ] Share button opens share options (WhatsApp, Download Card, Copy Link)
- [ ] Share card generates correctly at `/api/og/scripture?id=[id]`
- [ ] `/word` archive tab shows all scriptures
- [ ] Landing page ScriptureStrip uses AudioPlayer and ShareButton components
- [ ] Admin scripture list shows all scriptures with schedule info

**Confession Page**
- [ ] `/confession` loads the intro screen correctly
- [ ] Scrolling through reveals each line sequentially
- [ ] Current line is bright white, past lines dim to white/25
- [ ] Final line `"till his return!"` triggers the gold glow explosion
- [ ] CTA screen appears after all lines
- [ ] "Join the Community" links to the correct form
- [ ] Page is smooth on mobile (test scroll behavior)

**General**
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors
- [ ] GSAP `ScrollTrigger` cleanup (`ctx.revert()`) prevents memory leaks

---

## NOTES FOR CURSOR

- GSAP `ScrollTrigger` **must** be registered with `gsap.registerPlugin(ScrollTrigger)` before any `ScrollTrigger.create()` calls. This must happen at the module level (outside `useEffect`), not inside it.
- The `ConfessionPageClient` uses a `useEffect` with `gsap.context()` for proper cleanup — do not move GSAP calls outside this pattern.
- The confession page intentionally uses `fixed` positioning for the glow div — this is correct because it needs to fill the viewport regardless of scroll position.
- `AudioPlayer` uses a native `<audio>` element with `ref` — do not replace with any third-party audio library.
- The `ShareButton` "Download Card" action fetches the OG image and triggers a download. On Safari mobile, `a.click()` may not work — this is an accepted limitation.
- The `/word` page uses `export const dynamic = 'force-dynamic'` because it reads the current date at render time to determine today's scripture. This is intentional.
- The `ConfessionReveal` on the landing page (Phase 1) is a shorter version of the full `/confession` page. They are separate components — do not merge them.
- Phase 6 will be the final phase — **About page, SEO, performance optimization, security hardening, and Vercel/Webuzo deployment config**.
