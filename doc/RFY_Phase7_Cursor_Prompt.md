# ROOM FOR YOU — Phase 7 Cursor Prompt
## Gallery Page · Site CMS · Upload Progress Bars

---

## CONTEXT

Phases 1–6 are complete. The platform is fully built and deploying cleanly.

Phase 7 adds three interconnected features:

1. **Gallery Page** — A public `/gallery` page showing past Room For You event photos in a masonry grid, filterable by event/city and date/month, with a full-screen lightbox (prev/next navigation). Admin uploads multiple images at once from `/admin/gallery`.

2. **Site CMS** — Every piece of text and every image on the public site becomes editable from the admin dashboard without touching code. Structured as one page per section: `/admin/cms/landing`, `/admin/cms/about`, `/admin/cms/shepherd`, `/admin/cms/highlights`, `/admin/cms/partnership`, `/admin/cms/footer`, `/admin/cms/seo`.

3. **Upload Progress Bars** — A unified `UploadZone` component replaces all raw Uploadthing buttons across the site. Every upload shows a gold animated progress bar per file, with drag-and-drop support and multi-file capability for the gallery.

---

## INSTALL ADDITIONAL DEPENDENCIES

```bash
npm install react-masonry-css
```

---

## ═══════════════════════════════════════
## MODULE 1 — GALLERY
## ═══════════════════════════════════════

### TASK 1 — Prisma Schema Addition

Add the `GalleryImage` model to `prisma/schema.prisma`:

```prisma
model GalleryImage {
  id          String   @id @default(cuid())
  url         String
  caption     String?
  eventName   String?  // e.g. "Abuja Meeting — March 2025"
  city        String?
  takenAt     DateTime?
  order       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run:
```bash
npx prisma migrate dev --name add_gallery_and_site_content
```

Or for production:
```bash
npx prisma db push
```

---

### TASK 2 — Uploadthing Gallery Endpoint

Open `src/lib/uploadthing.ts` and add the gallery endpoint:

```typescript
galleryImages: f({
  image: { maxFileSize: '8MB', maxFileCount: 20 },
})
  .middleware(async () => {
    const session = await auth()
    if (!session) throw new Error('Unauthorized')
    return { userId: session.user?.email }
  })
  .onUploadComplete(async ({ file }) => {
    return { url: file.url, name: file.name }
  }),
```

Also add a `cmsImage` endpoint for Site CMS image uploads:

```typescript
cmsImage: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
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

### TASK 3 — Gallery API Routes

#### `src/app/api/gallery/route.ts` — List & Bulk Create

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — public: all active images
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const month = searchParams.get('month') // format: "2025-03"

  const where: Record<string, unknown> = { isActive: true }
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (month) {
    const [year, m] = month.split('-').map(Number)
    where.takenAt = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    }
  }

  const images = await db.galleryImage.findMany({
    where,
    orderBy: [{ takenAt: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(images)
}

// POST — admin: bulk create (array of image objects)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const images: { url: string; caption?: string; eventName?: string; city?: string; takenAt?: string }[] = body.images

  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 })
  }

  const created = await db.galleryImage.createMany({
    data: images.map((img, i) => ({
      url: img.url,
      caption: img.caption ?? null,
      eventName: img.eventName ?? null,
      city: img.city ?? null,
      takenAt: img.takenAt ? new Date(img.takenAt) : null,
      order: i,
    })),
  })

  return NextResponse.json({ created: created.count }, { status: 201 })
}
```

#### `src/app/api/gallery/[id]/route.ts` — Update & Delete

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const image = await db.galleryImage.update({
    where: { id: params.id },
    data: {
      ...body,
      takenAt: body.takenAt ? new Date(body.takenAt) : undefined,
    },
  })
  return NextResponse.json(image)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.galleryImage.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

#### `src/app/api/gallery/filters/route.ts` — Public filter options

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    select: { city: true, takenAt: true },
  })

  const cities = [...new Set(
    images.map((i) => i.city).filter(Boolean) as string[]
  )].sort()

  const months = [...new Set(
    images
      .filter((i) => i.takenAt)
      .map((i) => {
        const d = new Date(i.takenAt!)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
  )].sort().reverse()

  return NextResponse.json({ cities, months })
}
```

---

### TASK 4 — Upload Progress Bar Component

Create `src/components/shared/UploadZone.tsx`:

This is the **unified upload component** used everywhere on the site. It replaces all raw `UploadButton` and `UploadDropzone` usages. Every upload on the platform — blog cover, scripture audio, study materials, gallery images, CMS images — goes through this component.

Features:
- Drag-and-drop zone with dashed gold border
- File picker fallback on click
- Per-file gold animated progress bar
- File type and size validation feedback
- Success state with file name / image preview
- Error state with retry
- Supports single and multi-file uploads

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useUploadThing } from '@/lib/uploadthing-client'
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Music, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RFYFileRouter } from '@/lib/uploadthing'

interface UploadedFile {
  name: string
  url: string
  size?: number
}

interface UploadZoneProps {
  endpoint: keyof RFYFileRouter
  onUploadComplete: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  accept?: 'image' | 'audio' | 'document'
  label?: string
  className?: string
  preview?: boolean // show image preview after upload
}

interface FileProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
  error?: string
}

const ACCEPT_MAP = {
  image: 'image/*',
  audio: 'audio/mpeg,audio/mp3',
  document: 'application/pdf,.doc,.docx',
}

const FILE_ICON = {
  image: ImageIcon,
  audio: Music,
  document: FileText,
}

export function UploadZone({
  endpoint,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  accept = 'image',
  label,
  className,
  preview = false,
}: UploadZoneProps) {
  const [files, setFiles] = useState<FileProgress[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadProgress: (progress) => {
      // progress is 0-100 for the overall batch
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, progress } : f
        )
      )
    },
    onClientUploadComplete: (res) => {
      const completed: UploadedFile[] = res.map((r) => ({
        name: r.name,
        url: r.url,
      }))
      setFiles((prev) =>
        prev.map((f, i) => ({
          ...f,
          status: 'done' as const,
          progress: 100,
          url: res[i]?.url,
        }))
      )
      setUploadedFiles(completed)
      onUploadComplete(completed)
    },
    onUploadError: (err) => {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const, error: err.message })))
      onUploadError?.(err)
    },
  })

  const handleFiles = useCallback(async (selectedFiles: File[]) => {
    const limited = selectedFiles.slice(0, maxFiles)
    const fileProgress: FileProgress[] = limited.map((f) => ({
      file: f,
      progress: 0,
      status: 'uploading',
    }))
    setFiles(fileProgress)
    setUploadedFiles([])
    await startUpload(limited)
  }, [startUpload, maxFiles])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length > 0) handleFiles(dropped)
  }, [handleFiles])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) handleFiles(selected)
    e.target.value = ''
  }

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
    if (files.length === 1) setUploadedFiles([])
  }

  const reset = () => { setFiles([]); setUploadedFiles([]) }

  const FileIcon = FILE_ICON[accept]
  const allDone = files.length > 0 && files.every((f) => f.status === 'done')
  const hasError = files.some((f) => f.status === 'error')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone — hide when files are uploading/done */}
      {files.length === 0 && (
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-gold bg-gold/10'
              : 'border-white/15 hover:border-gold/40 hover:bg-white/2'
          )}
        >
          <input
            type="file"
            accept={ACCEPT_MAP[accept]}
            multiple={maxFiles > 1}
            onChange={onFileInput}
            className="hidden"
          />
          <div className={cn(
            'w-12 h-12 rounded-full border flex items-center justify-center transition-colors',
            isDragging ? 'border-gold text-gold' : 'border-white/20 text-white/30'
          )}>
            <Upload size={20} />
          </div>
          <div className="text-center">
            <p className="font-body text-sm text-white/60">
              {label ?? (maxFiles > 1
                ? `Drop up to ${maxFiles} ${accept} files here`
                : `Drop a ${accept} file here`)}
            </p>
            <p className="font-body text-xs text-white/25 mt-1">or click to browse</p>
          </div>
        </label>
      )}

      {/* File progress list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="border border-white/10 p-3">
              <div className="flex items-center gap-3 mb-2">
                {/* Icon */}
                <div className="shrink-0">
                  {f.status === 'done' && f.url && preview && accept === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt="" className="w-10 h-10 object-cover" />
                  ) : (
                    <div className={cn(
                      'w-10 h-10 border flex items-center justify-center',
                      f.status === 'done' ? 'border-gold/40 text-gold' :
                      f.status === 'error' ? 'border-red-brand/40 text-red-brand' :
                      'border-white/10 text-white/30'
                    )}>
                      {f.status === 'done' ? <CheckCircle size={16} /> :
                       f.status === 'error' ? <AlertCircle size={16} /> :
                       <FileIcon size={16} />}
                    </div>
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-white/70 truncate">{f.file.name}</p>
                  <p className={cn(
                    'font-body text-[10px] mt-0.5',
                    f.status === 'done' ? 'text-gold/70' :
                    f.status === 'error' ? 'text-red-brand/70' :
                    'text-white/30'
                  )}>
                    {f.status === 'done' ? 'Uploaded' :
                     f.status === 'error' ? (f.error ?? 'Upload failed') :
                     `${f.progress}%`}
                  </p>
                </div>

                {/* Remove */}
                {(f.status === 'done' || f.status === 'error') && (
                  <button onClick={() => removeFile(i)}
                    className="text-white/20 hover:text-white/60 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {f.status === 'uploading' && (
                <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold transition-all duration-300 rounded-full"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              )}
              {f.status === 'done' && (
                <div className="h-0.5 bg-gold/40 rounded-full" />
              )}
              {f.status === 'error' && (
                <div className="h-0.5 bg-red-brand/40 rounded-full" />
              )}
            </div>
          ))}

          {/* Upload more / reset */}
          {(allDone || hasError) && (
            <button onClick={reset}
              className="text-xs text-white/30 hover:text-gold font-body transition-colors">
              + Upload {maxFiles > 1 ? 'more files' : 'different file'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

### TASK 5 — Replace All Existing Upload Buttons

Go through the entire codebase and replace every `<UploadButton>` and `<UploadDropzone>` usage with the new `<UploadZone>` component.

**Files to update:**

#### `src/components/admin/blog/BlogPostEditor.tsx`
Replace cover image UploadButton:
```typescript
// REMOVE:
<UploadButton endpoint="blogCoverImage" ... />

// REPLACE WITH:
<UploadZone
  endpoint="blogCoverImage"
  accept="image"
  preview
  label="Upload cover image (max 4MB)"
  onUploadComplete={(files) => {
    if (files[0]?.url) setCoverImage(files[0].url)
    toast.success('Cover image uploaded')
  }}
  onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
/>
```

#### `src/components/admin/editor/RichTextEditor.tsx`
Replace inline image upload in toolbar:
```typescript
// In addImage():
const { startUpload } = useUploadThing('blogInlineImage')
// Keep as-is — the toolbar uses startUpload directly, not UploadButton
// Just add progress feedback via a toast:
toast.loading('Uploading image…', { id: 'img-upload' })
const [res] = await startUpload([file])
toast.dismiss('img-upload')
if (res?.url) {
  editor.chain().focus().setImage({ src: res.url }).run()
  toast.success('Image inserted')
}
```

#### `src/components/admin/scripture/ScriptureManager.tsx`
Replace scripture audio UploadButton:
```typescript
// REMOVE:
<UploadButton endpoint="scriptureAudio" ... />

// REPLACE WITH:
<UploadZone
  endpoint="scriptureAudio"
  accept="audio"
  label="Upload audio explanation (MP3, max 32MB)"
  onUploadComplete={(files) => {
    if (files[0]?.url) setAudioUrl(files[0].url)
    toast.success('Audio uploaded')
  }}
  onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
/>
```

#### `src/components/admin/study/StudyManager.tsx`
Replace study material UploadButton:
```typescript
// REPLACE WITH:
<UploadZone
  endpoint="studyMaterial"
  accept="document"
  label="Upload material (PDF or Word, max 16MB)"
  onUploadComplete={(files) => {
    if (files[0]?.url) handleMaterialUploaded(seriesId, files[0])
    toast.success('Material uploaded')
  }}
  onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
/>
```

---

### TASK 6 — Admin Gallery Page

Create `src/app/admin/(dashboard)/gallery/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { GalleryManager } from '@/components/admin/gallery/GalleryManager'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  const images = await db.galleryImage.findMany({
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
  })

  return <GalleryManager initialImages={images} />
}
```

Add Gallery to the admin sidebar. Open `src/components/admin/AdminSidebar.tsx` and add:
```typescript
{ label: 'Gallery', href: '/admin/gallery', icon: Images },
```
Import `Images` from `lucide-react`.

---

### TASK 7 — GalleryManager Component

Create `src/components/admin/gallery/GalleryManager.tsx`:

This is the admin gallery management UI. It must include:

**Header:**
- Title: "Gallery"
- Subtitle: "Past Room For You event photos"
- **"Upload Photos"** button (gold) — opens a slide-in upload panel

**Upload Panel (Framer Motion slide-in from right):**
- Heading: "Upload Photos"
- `UploadZone` configured for `galleryImages` endpoint, `maxFiles={20}`, `accept="image"`, `preview`
- After upload completes, show a metadata form for the batch:
  - **Event Name** input (e.g. "Abuja Monthly Meeting")
  - **City** input
  - **Date Taken** date picker
  - **Caption** (optional, applies to all images in batch)
- **"Save to Gallery"** button — POST to `/api/gallery`
- Note: metadata applies to the entire batch. Admin can edit individual images later.

**Gallery Grid:**
- Masonry-style grid using CSS columns (3 columns desktop, 2 tablet, 1 mobile)
- Each image card shows:
  - The image (object-cover)
  - On hover: dark overlay with event name, city, date
  - Edit button (pencil icon) — opens inline edit panel
  - Delete button with confirmation
  - Active/Inactive toggle
- Empty state when no images

**Inline Edit (per image):**
A small panel or modal to edit:
- Caption
- Event Name
- City
- Date Taken
- Active toggle

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Plus, Edit, Trash2, X, Images } from 'lucide-react'
import { UploadZone } from '@/components/shared/UploadZone'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { GalleryImage } from '@prisma/client'

interface GalleryManagerProps {
  initialImages: GalleryImage[]
}

interface UploadedFile {
  name: string
  url: string
}

export function GalleryManager({ initialImages }: GalleryManagerProps) {
  const [images, setImages] = useState(initialImages)
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [eventName, setEventName] = useState('')
  const [city, setCity] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)

  const handleSaveBatch = async () => {
    if (uploadedFiles.length === 0) { toast.error('No images uploaded yet'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: uploadedFiles.map((f) => ({
            url: f.url,
            eventName: eventName.trim() || null,
            city: city.trim() || null,
            takenAt: takenAt || null,
            caption: caption.trim() || null,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')

      // Refresh
      const refreshed = await fetch('/api/gallery').then((r) => r.json())
      setImages(refreshed)
      toast.success(`${uploadedFiles.length} photo${uploadedFiles.length > 1 ? 's' : ''} added to gallery`)
      setUploadPanelOpen(false)
      setUploadedFiles([])
      setEventName(''); setCity(''); setTakenAt(''); setCaption('')
    } catch {
      toast.error('Failed to save photos')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) return
    const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setImages((prev) => prev.filter((i) => i.id !== id))
      toast.success('Photo deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  const handleUpdateImage = async (id: string, data: Partial<GalleryImage>) => {
    const res = await fetch(`/api/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setImages((prev) => prev.map((i) => i.id === id ? updated : i))
      toast.success('Photo updated')
      setEditingImage(null)
    } else {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-white">Gallery</h2>
          <p className="text-white/40 text-sm font-body mt-1">
            {images.length} photo{images.length !== 1 ? 's' : ''} · Past Room For You events
          </p>
        </div>
        <button
          onClick={() => setUploadPanelOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold text-black text-sm font-body font-medium hover:bg-gold-light transition-colors"
        >
          <Plus size={16} /> Upload Photos
        </button>
      </div>

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <div className="text-center py-24 border border-dashed"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <Images size={32} className="text-white/20 mx-auto mb-4" />
          <p className="font-display text-2xl text-white/30 italic">No photos yet</p>
          <p className="text-white/20 text-sm mt-2 font-body">Upload your first batch of event photos</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {images.map((img) => (
            <div key={img.id}
              className="break-inside-avoid relative group border border-white/10 overflow-hidden">
              <Image
                src={img.url}
                alt={img.caption ?? img.eventName ?? 'Room For You event'}
                width={600}
                height={400}
                className={cn(
                  'w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105',
                  !img.isActive && 'opacity-40'
                )}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                {img.eventName && (
                  <p className="font-display text-sm text-white">{img.eventName}</p>
                )}
                {img.city && (
                  <p className="text-gold/70 text-xs font-body">{img.city}</p>
                )}
                {img.takenAt && (
                  <p className="text-white/40 text-xs font-body">{formatDate(img.takenAt)}</p>
                )}
                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setEditingImage(img)}
                    className="p-2 bg-white/10 text-white hover:bg-gold/20 hover:text-gold transition-colors">
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="p-2 bg-white/10 text-white hover:bg-red-brand/20 hover:text-red-brand transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleUpdateImage(img.id, { isActive: !img.isActive })}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-body uppercase tracking-widest transition-colors',
                      img.isActive
                        ? 'bg-gold/20 text-gold hover:bg-red-brand/20 hover:text-red-brand'
                        : 'bg-white/10 text-white/40 hover:bg-gold/20 hover:text-gold'
                    )}>
                    {img.isActive ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Slide-in Panel */}
      <AnimatePresence>
        {uploadPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setUploadPanelOpen(false)}
              className="fixed inset-0 z-40 bg-black/70"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
              style={{ background: '#0A0A0A', borderLeft: '1px solid rgba(201,168,76,0.2)' }}
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl text-white">Upload Photos</h3>
                  <button onClick={() => setUploadPanelOpen(false)}
                    className="text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

                {/* Upload Zone */}
                <UploadZone
                  endpoint="galleryImages"
                  accept="image"
                  maxFiles={20}
                  preview
                  label="Drop up to 20 photos here, or click to browse"
                  onUploadComplete={(files) => {
                    setUploadedFiles(files)
                    toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded — now add details below`)
                  }}
                  onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
                />

                {/* Batch metadata — show after upload */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs uppercase tracking-widest text-gold/70 font-body">
                      Event Details (applied to all {uploadedFiles.length} photos)
                    </p>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                        Event Name
                      </label>
                      <input
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g. Abuja Monthly Meeting"
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                          City
                        </label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Abuja"
                          className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                          Date Taken
                        </label>
                        <input
                          type="date"
                          value={takenAt}
                          onChange={(e) => setTakenAt(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                        Caption (optional)
                      </label>
                      <input
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="A short caption for these photos"
                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
                      />
                    </div>

                    <button
                      onClick={handleSaveBatch}
                      disabled={saving}
                      className="w-full py-3 bg-gold text-black font-body font-medium text-sm tracking-widest uppercase hover:bg-gold-light transition-colors disabled:opacity-40"
                    >
                      {saving ? 'Saving…' : `Save ${uploadedFiles.length} Photo${uploadedFiles.length > 1 ? 's' : ''} to Gallery`}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Image Panel */}
      <AnimatePresence>
        {editingImage && (
          <EditImagePanel
            image={editingImage}
            onSave={(data) => handleUpdateImage(editingImage.id, data)}
            onClose={() => setEditingImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EditImagePanel({
  image,
  onSave,
  onClose,
}: {
  image: GalleryImage
  onSave: (data: Partial<GalleryImage>) => void
  onClose: () => void
}) {
  const [caption, setCaption] = useState(image.caption ?? '')
  const [eventName, setEventName] = useState(image.eventName ?? '')
  const [city, setCity] = useState(image.city ?? '')
  const [takenAt, setTakenAt] = useState(
    image.takenAt ? new Date(image.takenAt).toISOString().split('T')[0] : ''
  )
  const [isActive, setIsActive] = useState(image.isActive)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70"
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
        style={{ background: '#0A0A0A', borderLeft: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-white">Edit Photo</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <Image src={image.url} alt="" width={400} height={300}
            className="w-full h-48 object-cover" />
          {[
            { label: 'Event Name', value: eventName, set: setEventName, placeholder: 'e.g. Abuja Monthly Meeting' },
            { label: 'City', value: city, set: setCity, placeholder: 'e.g. Abuja' },
            { label: 'Caption', value: caption, set: setCaption, placeholder: 'Optional caption' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
                {field.label}
              </label>
              <input
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 font-body mb-2">
              Date Taken
            </label>
            <input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsActive(!isActive)}
              className={cn('relative w-10 h-5 rounded-full transition-colors', isActive ? 'bg-gold' : 'bg-white/10')}>
              <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                isActive ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
            <span className="text-sm text-white/60 font-body">{isActive ? 'Visible' : 'Hidden'}</span>
          </div>
          <button
            onClick={() => onSave({ caption, eventName, city, takenAt: takenAt || undefined, isActive })}
            className="w-full py-3 bg-gold text-black font-body font-medium text-sm tracking-widest uppercase hover:bg-gold-light transition-colors"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </>
  )
}
```

---

### TASK 8 — Public Gallery Page

Create `src/app/(public)/gallery/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { GalleryClientPage } from '@/components/gallery/GalleryClientPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gallery — Room For You',
  description: 'Photos from past Room For You community gatherings across cities.',
}

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
  })

  const cities = [...new Set(images.map((i) => i.city).filter(Boolean) as string[])].sort()
  const months = [...new Set(
    images.filter((i) => i.takenAt).map((i) => {
      const d = new Date(i.takenAt!)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
  )].sort().reverse()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gold font-body mb-4">
            Room For You
          </p>
          <h1 className="font-display text-4xl lg:text-6xl text-white mb-4">Gallery</h1>
          <p className="text-white/50 font-body max-w-md mx-auto">
            Moments from our gatherings across cities. Real people. Real community.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-xs mx-auto mt-8" />
        </div>
        <GalleryClientPage images={images} cities={cities} months={months} />
      </main>
      <Footer />
    </>
  )
}
```

---

### TASK 9 — GalleryClientPage Component

Create `src/components/gallery/GalleryClientPage.tsx`:

This handles filtering, masonry layout, and the lightbox.

```typescript
'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { GalleryImage } from '@prisma/client'

interface GalleryClientPageProps {
  images: GalleryImage[]
  cities: string[]
  months: string[]
}

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  return format(new Date(Number(year), Number(m) - 1, 1), 'MMMM yyyy')
}

export function GalleryClientPage({ images, cities, months }: GalleryClientPageProps) {
  const [activeCity, setActiveCity] = useState<string>('All')
  const [activeMonth, setActiveMonth] = useState<string>('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = useMemo(() => {
    return images.filter((img) => {
      const cityMatch = activeCity === 'All' || img.city === activeCity
      const monthMatch = activeMonth === 'All' || (img.takenAt && (() => {
        const d = new Date(img.takenAt!)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === activeMonth
      })())
      return cityMatch && monthMatch
    })
  }, [images, activeCity, activeMonth])

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () => setLightboxIndex((i) => (i !== null ? (i - 1 + filtered.length) % filtered.length : null))
  const nextImage = () => setLightboxIndex((i) => (i !== null ? (i + 1) % filtered.length : null))

  const currentImage = lightboxIndex !== null ? filtered[lightboxIndex] : null

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Filters */}
      {(cities.length > 0 || months.length > 0) && (
        <div className="space-y-4 mb-12">
          {/* City filter */}
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <p className="w-full text-center text-xs uppercase tracking-widest text-white/30 font-body mb-1">
                Filter by City
              </p>
              {['All', ...cities].map((city) => (
                <button key={city} onClick={() => setActiveCity(city)}
                  className={cn(
                    'px-4 py-2 text-xs font-body tracking-wide border transition-all',
                    activeCity === city
                      ? 'bg-gold text-black border-gold'
                      : 'border-white/20 text-white/50 hover:border-gold/40 hover:text-white'
                  )}>
                  {city}
                </button>
              ))}
            </div>
          )}

          {/* Month filter */}
          {months.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <p className="w-full text-center text-xs uppercase tracking-widest text-white/30 font-body mb-1">
                Filter by Month
              </p>
              {['All', ...months].map((month) => (
                <button key={month} onClick={() => setActiveMonth(month)}
                  className={cn(
                    'px-4 py-2 text-xs font-body tracking-wide border transition-all',
                    activeMonth === month
                      ? 'bg-gold/20 text-gold border-gold/50'
                      : 'border-white/20 text-white/50 hover:border-gold/40 hover:text-white'
                  )}>
                  {month === 'All' ? 'All Time' : formatMonth(month)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result count */}
      {(activeCity !== 'All' || activeMonth !== 'All') && (
        <p className="text-center text-white/30 text-sm font-body mb-8">
          {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
          {activeCity !== 'All' ? ` in ${activeCity}` : ''}
          {activeMonth !== 'All' ? ` · ${formatMonth(activeMonth)}` : ''}
        </p>
      )}

      {/* Masonry Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-2xl text-white/30 italic">No photos found.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {filtered.map((img, index) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (index % 9) * 0.05 }}
              className="break-inside-avoid mb-4 relative group cursor-pointer overflow-hidden"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={img.url}
                alt={img.caption ?? img.eventName ?? 'Room For You'}
                width={600}
                height={400}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                {img.eventName && (
                  <p className="font-display text-sm text-white leading-tight">{img.eventName}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {img.city && (
                    <span className="flex items-center gap-1 text-gold/70 text-xs font-body">
                      <MapPin size={10} /> {img.city}
                    </span>
                  )}
                  {img.takenAt && (
                    <span className="flex items-center gap-1 text-white/40 text-xs font-body">
                      <Calendar size={10} /> {format(new Date(img.takenAt), 'MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-10 p-2 text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>

            {/* Prev */}
            {filtered.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 lg:left-8 z-10 p-3 border border-white/20 text-white/60 hover:border-gold hover:text-gold transition-all">
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl max-h-[80vh] mx-16"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={currentImage.url}
                alt={currentImage.caption ?? currentImage.eventName ?? 'Room For You'}
                width={1200}
                height={800}
                className="max-h-[75vh] w-auto object-contain"
                priority
              />
              {/* Caption */}
              {(currentImage.eventName || currentImage.city || currentImage.takenAt) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {currentImage.eventName && (
                    <p className="font-display text-white text-sm">{currentImage.eventName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {currentImage.city && (
                      <span className="text-gold/70 text-xs font-body flex items-center gap-1">
                        <MapPin size={10} /> {currentImage.city}
                      </span>
                    )}
                    {currentImage.takenAt && (
                      <span className="text-white/40 text-xs font-body">
                        {format(new Date(currentImage.takenAt), 'MMMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Next */}
            {filtered.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 lg:right-8 z-10 p-3 border border-white/20 text-white/60 hover:border-gold hover:text-gold transition-all">
                <ChevronRight size={24} />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs font-body">
              {lightboxIndex + 1} / {filtered.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

Add Gallery to the public Navbar. Open `src/components/layout/Navbar.tsx` and add:
```typescript
{ label: 'Gallery', href: '/gallery' },
```

---

## ═══════════════════════════════════════
## MODULE 2 — SITE CMS
## ═══════════════════════════════════════

### TASK 10 — SiteContent Prisma Model

Add to `prisma/schema.prisma`:

```prisma
model SiteContent {
  id        String   @id @default(cuid())
  key       String   @unique  // e.g. "landing.hero.headline"
  value     String   @db.Text
  type      ContentType @default(TEXT)
  updatedAt DateTime @updatedAt
}

enum ContentType {
  TEXT
  RICHTEXT
  IMAGE
  JSON
}
```

Run `npx prisma db push` after adding.

---

### TASK 11 — Content Helper

Create `src/lib/content.ts`:

This is the central helper used by all public pages to fetch CMS content with fallbacks.

```typescript
import { db } from '@/lib/db'

// All default content values — site never breaks if DB is empty
const DEFAULTS: Record<string, string> = {
  // ── LANDING ──
  'landing.hero.eyebrow': 'Worship · Prayer · Study · Community',
  'landing.hero.headline1': 'There Is Room',
  'landing.hero.headline2': 'For You.',
  'landing.hero.subtext': 'A community of young men and women singing songs of salvation, studying the Word, and getting others saved. Jesus to nations.',
  'landing.hero.cta.primary': 'Join the Community',
  'landing.hero.cta.secondary': 'Learn More',
  'landing.vision.heading': 'Building a community',
  'landing.vision.subheading': 'Jesus to Nations',
  'landing.vision.text': 'Building a community of young men and women who sing songs of salvation with conviction of their identity in Christ, study the Bible, pray and get others saved.',
  'landing.cta.headline': 'The door is open.',
  'landing.cta.subtext': 'Step in. There is room for you.',
  'landing.cta.button': 'Join the Community',

  // ── FROM THE SHEPHERD (landing) ──
  'shepherd.quote': 'Room For You was born out of a deep conviction — that every young person deserves a community where they are seen, known, and called into purpose. This is not just a ministry. It is a family. And there is room for you here.',
  'shepherd.name': 'Minister Yadah',
  'shepherd.title': 'Founder, Room For You',
  'shepherd.image': '/images/yadah-portrait.jpg',
  'shepherd.link': 'https://yadahworld.com',

  // ── COMMUNITY HIGHLIGHTS ──
  'highlights.1.title': 'Monthly Meetings',
  'highlights.1.desc': 'Physical gatherings across cities where the Word comes alive.',
  'highlights.2.title': 'Prayer',
  'highlights.2.desc': 'Corporate and personal prayer — we carry each other\'s burdens.',
  'highlights.3.title': 'Bible Study',
  'highlights.3.desc': 'Deep, consistent study of the Word with structured tasks.',
  'highlights.4.title': 'Mentorship',
  'highlights.4.desc': 'One-on-one counseling and spiritual mentorship.',

  // ── ABOUT ──
  'about.hero.headline1': 'More Than a Ministry.',
  'about.hero.headline2': 'A Family.',
  'about.vision.text': 'Building a community of young men and women who sing songs of salvation with conviction of their identity in Christ, study the Bible, pray and get others saved.',
  'about.mission.heading': 'Jesus to Nations',
  'about.mission.scripture': '2 Corinthians 5:17–21',
  'about.mission.text': '"Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here! All this is from God, who reconciled us to himself through Christ and gave us the ministry of reconciliation."',
  'about.yadah.bio': 'I started Room For You because I believe every young person deserves a community where they are not just known, but called into purpose. A place where the Word of God is not just preached but lived. Where prayer is not a ritual but a lifestyle. Where you are not alone in your faith — you are surrounded by people who are running the same race.\n\nThis is that community. And there is room for you here.',
  'about.yadah.image': '/images/yadah-portrait.jpg',
  'about.yadah.musicLink': 'https://yadahworld.com/music',
  'about.cta.headline': 'There is room for you.',
  'about.cta.subtext': 'Come as you are. Grow as you will.',

  // ── PARTNERSHIP ──
  'partnership.hero.headline': 'Fuel the Mission',
  'partnership.hero.subtext': 'Every gift you sow into Room For You is a seed planted in the Kingdom. You are not just giving money — you are sending the Gospel to nations.',
  'partnership.hero.scripture': '"Each of you should give what you have decided in your heart to give… for God loves a cheerful giver." — 2 Corinthians 9:7',
  'partnership.bank.bankName': 'Access Bank',
  'partnership.bank.accountName': 'Room For You',
  'partnership.bank.accountNumber': '0123456789',
  'partnership.bank.contactEmail': 'partner@rfyglobal.org',
  'partnership.card1.title': 'Community Gatherings',
  'partnership.card1.desc': 'Funding physical meetings across cities where the Word comes alive.',
  'partnership.card2.title': 'Study & Resources',
  'partnership.card2.desc': 'Producing study materials, devotionals, and equipping tools for the community.',
  'partnership.card3.title': 'Evangelical Outreach',
  'partnership.card3.desc': 'Taking the Gospel to the streets — foot evangelism and outreaches.',

  // ── FOOTER ──
  'footer.tagline': 'Jesus to Nations — 2 Cor 5:17-21',
  'footer.copyright': '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.',
  'footer.instagram': 'https://instagram.com/roomforyou',
  'footer.youtube': 'https://youtube.com/@roomforyou',
  'footer.twitter': 'https://twitter.com/roomforyou',

  // ── SEO ──
  'seo.defaultTitle': 'Room For You — with Yadah',
  'seo.defaultDescription': 'A worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations. rfyglobal.org',
  'seo.ogImage': '/og-default.png',
}

// Fetch a single content value
export async function getContent(key: string): Promise<string> {
  try {
    const record = await db.siteContent.findUnique({ where: { key } })
    return record?.value ?? DEFAULTS[key] ?? ''
  } catch {
    return DEFAULTS[key] ?? ''
  }
}

// Fetch multiple content values at once (efficient — single DB query)
export async function getContentMany(keys: string[]): Promise<Record<string, string>> {
  try {
    const records = await db.siteContent.findMany({
      where: { key: { in: keys } },
    })
    const map = Object.fromEntries(records.map((r) => [r.key, r.value]))
    // Merge with defaults — DB values take priority
    return Object.fromEntries(
      keys.map((key) => [key, map[key] ?? DEFAULTS[key] ?? ''])
    )
  } catch {
    return Object.fromEntries(keys.map((key) => [key, DEFAULTS[key] ?? '']))
  }
}

// Get all defaults (for CMS to show what's available)
export function getDefaults() {
  return DEFAULTS
}
```

---

### TASK 12 — CMS API Route

Create `src/app/api/cms/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET — admin: all content records
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const content = await db.siteContent.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json(content)
}

// POST — admin: upsert a content key
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { key, value, type } = body

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 })
  }

  const record = await db.siteContent.upsert({
    where: { key },
    update: { value, type: type ?? 'TEXT' },
    create: { key, value, type: type ?? 'TEXT' },
  })

  return NextResponse.json(record)
}

// DELETE — admin: reset a key to default
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await req.json()
  await db.siteContent.deleteMany({ where: { key } })
  return NextResponse.json({ success: true })
}
```

---

### TASK 13 — CMS Admin Pages

Add CMS to admin sidebar. Open `src/components/admin/AdminSidebar.tsx` and add:
```typescript
{ label: 'Site CMS', href: '/admin/cms', icon: Settings2 },
```
Import `Settings2` from `lucide-react`.

Create `src/app/admin/(dashboard)/cms/page.tsx` — CMS index page:

```typescript
import Link from 'next/link'
import { Settings2, Layout, User, Heart, FileText, Globe } from 'lucide-react'

const CMS_SECTIONS = [
  { href: '/admin/cms/landing', label: 'Landing Page', desc: 'Hero text, vision, CTA copy', icon: Layout },
  { href: '/admin/cms/shepherd', label: 'From the Shepherd', desc: 'Yadah quote, photo, links', icon: User },
  { href: '/admin/cms/highlights', label: 'Community Highlights', desc: 'Four highlight card titles and descriptions', icon: FileText },
  { href: '/admin/cms/about', label: 'About Page', desc: 'Vision, mission, Yadah bio and portrait', icon: User },
  { href: '/admin/cms/partnership', label: 'Partnership Page', desc: 'Vision text, bank account details', icon: Heart },
  { href: '/admin/cms/footer', label: 'Footer', desc: 'Tagline, copyright, social links', icon: Globe },
  { href: '/admin/cms/seo', label: 'SEO Defaults', desc: 'OG image, meta description', icon: Settings2 },
]

export default function CMSIndexPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-white">Site CMS</h2>
        <p className="text-white/40 text-sm font-body mt-1">
          Edit every piece of text and every image on the site — no code required
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CMS_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}
              className="border border-white/10 p-6 hover:border-gold/30 hover:bg-gold/3 transition-all group">
              <div className="flex items-start gap-4">
                <div className="p-2 border border-white/10 group-hover:border-gold/30 transition-colors">
                  <Icon size={18} className="text-white/40 group-hover:text-gold transition-colors" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white group-hover:text-gold transition-colors">
                    {section.label}
                  </h3>
                  <p className="text-white/40 text-sm font-body mt-1">{section.desc}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

---

### TASK 14 — CMS Editor Component

Create `src/components/admin/cms/CMSEditor.tsx`:

This is the reusable editor used by all CMS section pages. It renders a list of editable fields with the correct input type per field, handles saving, and shows unsaved changes indicator.

```typescript
'use client'

import { useState, useEffect } from 'react'
import { UploadZone } from '@/components/shared/UploadZone'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { RotateCcw } from 'lucide-react'

export interface CMSField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'url'
  placeholder?: string
  hint?: string
}

interface CMSEditorProps {
  title: string
  description?: string
  fields: CMSField[]
  initialValues: Record<string, string>
}

export function CMSEditor({ title, description, fields, initialValues }: CMSEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = useState<string | null>(null) // key being saved
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())

  const hasChanged = (key: string) => values[key] !== (initialValues[key] ?? '')

  const saveField = async (key: string) => {
    setSaving(key)
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: values[key] }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSavedKeys((prev) => new Set(prev).add(key))
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(null)
    }
  }

  const resetField = async (key: string) => {
    const res = await fetch('/api/cms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    if (res.ok) {
      setValues((prev) => ({ ...prev, [key]: initialValues[key] ?? '' }))
      setSavedKeys((prev) => { const s = new Set(prev); s.delete(key); return s })
      toast.success('Reset to default')
    }
  }

  const saveAll = async () => {
    const changed = fields.filter((f) => hasChanged(f.key))
    if (changed.length === 0) { toast('Nothing changed'); return }

    setSaving('all')
    try {
      await Promise.all(
        changed.map((f) =>
          fetch('/api/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: f.key, value: values[f.key] }),
          })
        )
      )
      setSavedKeys(new Set(fields.map((f) => f.key)))
      toast.success(`Saved ${changed.length} field${changed.length > 1 ? 's' : ''}`)
    } catch {
      toast.error('Some fields failed to save')
    } finally {
      setSaving(null)
    }
  }

  const changedCount = fields.filter((f) => hasChanged(f.key)).length

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl text-white">{title}</h2>
          {description && (
            <p className="text-white/40 text-sm font-body mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={saveAll}
          disabled={saving === 'all' || changedCount === 0}
          className={cn(
            'px-5 py-2.5 font-body text-sm font-medium transition-all',
            changedCount > 0
              ? 'bg-gold text-black hover:bg-gold-light'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          )}
        >
          {saving === 'all' ? 'Saving…' : `Save All${changedCount > 0 ? ` (${changedCount})` : ''}`}
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-8">
        {fields.map((field) => {
          const changed = hasChanged(field.key)
          const isSaving = saving === field.key

          return (
            <div key={field.key}
              className={cn(
                'border p-6 transition-all',
                changed ? 'border-gold/30 bg-gold/3' : 'border-white/10'
              )}>
              {/* Field header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm text-white font-body font-medium">
                    {field.label}
                  </label>
                  <p className="text-[10px] font-mono text-white/25 mt-0.5">{field.key}</p>
                  {field.hint && (
                    <p className="text-xs text-white/35 font-body mt-1">{field.hint}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {changed && (
                    <span className="text-[10px] text-gold/70 font-body uppercase tracking-widest">
                      Unsaved
                    </span>
                  )}
                  <button
                    onClick={() => resetField(field.key)}
                    title="Reset to default"
                    className="p-1.5 text-white/20 hover:text-white/60 transition-colors">
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>

              {/* Input */}
              {field.type === 'image' ? (
                <div className="space-y-3">
                  {values[field.key] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={values[field.key]}
                      alt=""
                      className="h-32 object-cover border border-white/10"
                    />
                  )}
                  <UploadZone
                    endpoint="cmsImage"
                    accept="image"
                    preview
                    label="Upload new image"
                    onUploadComplete={(files) => {
                      if (files[0]?.url) {
                        setValues((prev) => ({ ...prev, [field.key]: files[0].url }))
                      }
                    }}
                  />
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20 resize-y"
                />
              ) : (
                <input
                  type={field.type === 'url' ? 'url' : 'text'}
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 font-body text-sm focus:border-gold focus:outline-none transition-colors placeholder:text-white/20"
                />
              )}

              {/* Save individual field */}
              {changed && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => saveField(field.key)}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gold/20 text-gold text-xs font-body border border-gold/30 hover:bg-gold/30 transition-colors disabled:opacity-40"
                  >
                    {isSaving ? 'Saving…' : 'Save this field'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

### TASK 15 — CMS Section Pages

Create each CMS section page. They all follow the same pattern: fetch current values, render `CMSEditor` with the right fields.

#### `src/app/admin/(dashboard)/cms/landing/page.tsx`

```typescript
import { getContentMany, getDefaults } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'landing.hero.eyebrow', label: 'Hero Eyebrow', type: 'text', placeholder: 'Worship · Prayer · Study · Community' },
  { key: 'landing.hero.headline1', label: 'Hero Headline Line 1', type: 'text', placeholder: 'There Is Room' },
  { key: 'landing.hero.headline2', label: 'Hero Headline Line 2 (gold italic)', type: 'text', placeholder: 'For You.' },
  { key: 'landing.hero.subtext', label: 'Hero Subtext', type: 'textarea', placeholder: 'A community of young men and women…' },
  { key: 'landing.hero.cta.primary', label: 'Primary CTA Button', type: 'text', placeholder: 'Join the Community' },
  { key: 'landing.hero.cta.secondary', label: 'Secondary CTA Button', type: 'text', placeholder: 'Learn More' },
  { key: 'landing.vision.heading', label: 'Vision Section Heading', type: 'text' },
  { key: 'landing.vision.subheading', label: 'Vision Subheading (gold)', type: 'text' },
  { key: 'landing.vision.text', label: 'Vision Text', type: 'textarea' },
  { key: 'landing.cta.headline', label: 'Bottom CTA Headline', type: 'text', placeholder: 'The door is open.' },
  { key: 'landing.cta.subtext', label: 'Bottom CTA Subtext', type: 'text' },
  { key: 'landing.cta.button', label: 'Bottom CTA Button', type: 'text' },
]

export default async function CMSLandingPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  return (
    <CMSEditor
      title="Landing Page"
      description="Edit the hero, vision section, and CTA copy on the homepage"
      fields={FIELDS}
      initialValues={values}
    />
  )
}
```

#### `src/app/admin/(dashboard)/cms/shepherd/page.tsx`

```typescript
import { getContentMany } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'shepherd.quote', label: 'Yadah Quote', type: 'textarea', hint: 'The personal message from Yadah on the landing page' },
  { key: 'shepherd.name', label: 'Name', type: 'text' },
  { key: 'shepherd.title', label: 'Title / Role', type: 'text' },
  { key: 'shepherd.image', label: 'Portrait Photo', type: 'image', hint: 'Yadah portrait shown on the landing page' },
  { key: 'shepherd.link', label: 'Yadah World Link', type: 'url' },
]

export default async function CMSShepherdPage() {
  const values = await getContentMany(FIELDS.map((f) => f.key))
  return (
    <CMSEditor
      title="From the Shepherd"
      description="Edit Yadah's quote, photo, and links on the landing page"
      fields={FIELDS}
      initialValues={values}
    />
  )
}
```

#### `src/app/admin/(dashboard)/cms/highlights/page.tsx`

```typescript
import { getContentMany } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'highlights.1.title', label: 'Card 1 Title', type: 'text' },
  { key: 'highlights.1.desc', label: 'Card 1 Description', type: 'textarea' },
  { key: 'highlights.2.title', label: 'Card 2 Title', type: 'text' },
  { key: 'highlights.2.desc', label: 'Card 2 Description', type: 'textarea' },
  { key: 'highlights.3.title', label: 'Card 3 Title', type: 'text' },
  { key: 'highlights.3.desc', label: 'Card 3 Description', type: 'textarea' },
  { key: 'highlights.4.title', label: 'Card 4 Title', type: 'text' },
  { key: 'highlights.4.desc', label: 'Card 4 Description', type: 'textarea' },
]

export default async function CMSHighlightsPage() {
  const values = await getContentMany(FIELDS.map((f) => f.key))
  return (
    <CMSEditor
      title="Community Highlights"
      description="Edit the four feature cards on the landing page"
      fields={FIELDS}
      initialValues={values}
    />
  )
}
```

#### `src/app/admin/(dashboard)/cms/about/page.tsx`

```typescript
import { getContentMany } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'about.hero.headline1', label: 'Hero Headline Line 1', type: 'text' },
  { key: 'about.hero.headline2', label: 'Hero Headline Line 2 (gold)', type: 'text' },
  { key: 'about.vision.text', label: 'Vision Text', type: 'textarea' },
  { key: 'about.mission.heading', label: 'Mission Heading', type: 'text' },
  { key: 'about.mission.scripture', label: 'Mission Scripture Reference', type: 'text' },
  { key: 'about.mission.text', label: 'Mission Scripture Text', type: 'textarea' },
  { key: 'about.yadah.bio', label: "Yadah's Bio", type: 'textarea', hint: 'Full biography shown on the About page' },
  { key: 'about.yadah.image', label: 'Yadah Portrait (About page)', type: 'image' },
  { key: 'about.yadah.musicLink', label: 'Music Link', type: 'url' },
  { key: 'about.cta.headline', label: 'CTA Headline', type: 'text' },
  { key: 'about.cta.subtext', label: 'CTA Subtext', type: 'text' },
]

export default async function CMSAboutPage() {
  const values = await getContentMany(FIELDS.map((f) => f.key))
  return (
    <CMSEditor
      title="About Page"
      description="Edit all content on the About page including Yadah's bio and portrait"
      fields={FIELDS}
      initialValues={values}
    />
  )
}
```

#### `src/app/admin/(dashboard)/cms/partnership/page.tsx`

```typescript
import { getContentMany } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'partnership.hero.headline', label: 'Hero Headline', type: 'text' },
  { key: 'partnership.hero.subtext', label: 'Hero Subtext', type: 'textarea' },
  { key: 'partnership.hero.scripture', label: 'Hero Scripture', type: 'textarea' },
  { key: 'partnership.card1.title', label: 'Impact Card 1 Title', type: 'text' },
  { key: 'partnership.card1.desc', label: 'Impact Card 1 Description', type: 'textarea' },
  { key: 'partnership.card2.title', label: 'Impact Card 2 Title', type: 'text' },
  { key: 'partnership.card2.desc', label: 'Impact Card 2 Description', type: 'textarea' },
  { key: 'partnership.card3.title', label: 'Impact Card 3 Title', type: 'text' },
  { key: 'partnership.card3.desc', label: 'Impact Card 3 Description', type: 'textarea' },
  { key: 'partnership.bank.bankName', label: 'Bank Name', type: 'text', hint: 'e.g. Access Bank' },
  { key: 'partnership.bank.accountName', label: 'Account Name', type: 'text' },
  { key: 'partnership.bank.accountNumber', label: 'Account Number', type: 'text', hint: 'This is displayed publicly on the partnership page' },
  { key: 'partnership.bank.contactEmail', label: 'Contact Email (for bank transfers)', type: 'text' },
]

export default async function CMSPartnershipPage() {
  const values = await getContentMany(FIELDS.map((f) => f.key))
  return (
    <CMSEditor
      title="Partnership Page"
      description="Edit the partnership vision text and bank transfer details"
      fields={FIELDS}
      initialValues={values}
    />
  )
}
```

#### `src/app/admin/(dashboard)/cms/footer/page.tsx`

```typescript
import { getContentMany } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'footer.tagline', label: 'Footer Tagline', type: 'text' },
  { key: 'footer.copyright', label: 'Copyright Line', type: 'text' },
  { key: 'footer.instagram', label: 'Instagram URL', type: 'url' },
  { key: 'footer.youtube', label: 'YouTube URL', type: 'url' },
  { key: 'footer.twitter', label: 'Twitter / X URL', type: 'url' },
]

export default async function CMSFooterPage() {
  const values = await getContentMany(FIELDS.map((f) => f.key))
  return (
    <CMSEditor
      title="Footer"
      description="Edit the footer tagline, copyright, and social links"
      fields={FIELDS}
      initialValues={values}
    />
  )
}
```

#### `src/app/admin/(dashboard)/cms/seo/page.tsx`

```typescript
import { getContentMany } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'seo.defaultTitle', label: 'Default Page Title', type: 'text', hint: 'Used when a page has no specific title' },
  { key: 'seo.defaultDescription', label: 'Default Meta Description', type: 'textarea', hint: 'Shown in Google search results' },
  { key: 'seo.ogImage', label: 'Default OG Image', type: 'image', hint: '1200×630px — shown when links are shared on WhatsApp, Twitter, etc.' },
]

export default async function CMSSEOPage() {
  const values = await getContentMany(FIELDS.map((f) => f.key))
  return (
    <CMSEditor
      title="SEO Defaults"
      description="Edit the default title, description, and Open Graph image"
      fields={FIELDS}
      initialValues={values}
    />
  )
}
```

---

### TASK 16 — Wire CMS Content into Public Pages

Now update each public page to use `getContentMany()` instead of hardcoded strings.

#### Landing Page — `src/app/(public)/page.tsx`

```typescript
import { getContentMany } from '@/lib/content'

export default async function HomePage() {
  const content = await getContentMany([
    'landing.hero.eyebrow',
    'landing.hero.headline1',
    'landing.hero.headline2',
    'landing.hero.subtext',
    'landing.hero.cta.primary',
    'landing.hero.cta.secondary',
    'landing.vision.heading',
    'landing.vision.subheading',
    'landing.vision.text',
    'landing.cta.headline',
    'landing.cta.subtext',
    'landing.cta.button',
    'shepherd.quote',
    'shepherd.name',
    'shepherd.title',
    'shepherd.image',
    'shepherd.link',
    'highlights.1.title', 'highlights.1.desc',
    'highlights.2.title', 'highlights.2.desc',
    'highlights.3.title', 'highlights.3.desc',
    'highlights.4.title', 'highlights.4.desc',
  ])

  return (
    <main>
      <Hero content={content} />
      <ScriptureStrip />
      <VisionSection content={content} />
      <ConfessionReveal />
      <FromTheShepherd content={content} />
      <CommunityHighlights content={content} />
      <CTASection content={content} />
      <Footer />
    </main>
  )
}
```

Pass the `content` object as a prop to each section component. Update each component's props interface to accept `content: Record<string, string>` and replace all hardcoded strings with `content['key']`.

#### About Page — `src/app/(public)/about/page.tsx`
Same pattern — fetch about keys with `getContentMany`, pass to `AboutClient`.

#### Partnership Page — `src/components/partnership/PartnershipClientPage.tsx`
Convert to a server component wrapper that fetches content and passes to a client component for the interactive giving form.

#### Footer — `src/components/layout/Footer.tsx`
Fetch footer content keys server-side and render dynamically.

**Important:** Components that are `'use client'` cannot call `getContentMany()` directly (it uses Prisma). The pattern is:
- Server component (page.tsx) fetches content
- Passes as props to client components
- Client components use the props, not DB calls

---

## PHASE 7 COMPLETION CHECKLIST

**Gallery**
- [ ] Admin can upload up to 20 photos at once with progress bars
- [ ] Each file shows individual progress bar during upload
- [ ] Admin can add event name, city, date to a batch
- [ ] Admin can edit/delete individual photos
- [ ] `/gallery` shows masonry grid
- [ ] City and month filters work correctly
- [ ] Lightbox opens on click with prev/next navigation
- [ ] Gallery link added to public Navbar and admin sidebar

**Site CMS**
- [ ] `/admin/cms` index shows all 7 section cards
- [ ] Each section page loads current DB values (or defaults)
- [ ] Editing a text field and saving updates the DB
- [ ] Uploading an image updates the DB with the new URL
- [ ] "Reset to default" removes the DB record and shows the default
- [ ] "Unsaved" indicator appears when a field is changed but not yet saved
- [ ] "Save All" saves all changed fields in one action
- [ ] Public pages render CMS content (not hardcoded strings)
- [ ] If DB is empty, pages fall back to defaults gracefully

**Upload Progress**
- [ ] Every upload on the site uses `UploadZone` component
- [ ] Gold progress bar animates during upload
- [ ] Success state shows checkmark and file name
- [ ] Error state shows error message with retry option
- [ ] Multi-file upload in gallery shows per-file progress

**General**
- [ ] `npx prisma db push` succeeds with new models
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors

---

## NOTES FOR CURSOR

- `react-masonry-css` provides the `Masonry` component but we are using **CSS columns** (`columns-1 md:columns-2 lg:columns-3`) instead — this is simpler, has no hydration issues, and achieves the same visual result. Do not use the `react-masonry-css` package if CSS columns work — remove it from dependencies if unused.
- The `getContentMany()` function makes a **single DB query** for all keys at once using `findMany` with `key: { in: keys }`. Never call `getContent()` in a loop — always batch with `getContentMany()`.
- `'use client'` components cannot call Prisma directly. The pattern is always: server component page fetches → passes as props → client component renders. Never break this pattern.
- The `CMSEditor` saves fields individually or all at once. The "Save All" button only saves **changed** fields (where `value !== initialValue`). This prevents unnecessary DB writes.
- The lightbox uses `position: fixed` with `z-[200]` — ensure nothing else on the page has a higher z-index.
- When wiring CMS content into public pages, update the component prop interfaces first (TypeScript), then replace hardcoded strings. Do not leave a mix of hardcoded and CMS-driven content in the same component.
- The `SiteContent` model uses `@unique` on `key` — the upsert in the API route is safe and idempotent.
