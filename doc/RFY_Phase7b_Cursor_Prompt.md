# ROOM FOR YOU — Phase 7b Cursor Prompt
## Swap Uploadthing → Cloudinary (Full Migration)

---

## CONTEXT

Phase 7 wired all file uploads through Uploadthing. We are now migrating to **Cloudinary** for better image optimization, responsive delivery, automatic WebP/AVIF conversion, and a more generous free tier.

This migration covers:
- Blog cover images
- Blog inline images (Tiptap editor)
- Scripture audio (MP3)
- Study materials (PDF, Word)
- Gallery images (most important — needs responsive delivery)
- CMS images (Yadah portrait, OG image)

After this phase, Uploadthing is completely removed from the project.

---

## INSTALL / UNINSTALL

```bash
npm uninstall uploadthing @uploadthing/react
npm install cloudinary next-cloudinary
```

---

## TASK 1 — Environment Variables

Add to `.env.local` and `.env.example`:

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
```

Remove from both files:
```
UPLOADTHING_SECRET
UPLOADTHING_APP_ID
```

Add to Vercel dashboard environment variables:
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

---

## TASK 2 — Cloudinary Helper Library

Delete `src/lib/uploadthing.ts` and `src/lib/uploadthing-client.ts`.

Create `src/lib/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

// Upload folders by type
export const UPLOAD_FOLDERS = {
  blogCover: 'rfyglobal/blog/covers',
  blogInline: 'rfyglobal/blog/inline',
  scriptureAudio: 'rfyglobal/scripture/audio',
  studyMaterial: 'rfyglobal/study/materials',
  gallery: 'rfyglobal/gallery',
  cms: 'rfyglobal/cms',
} as const

// Generate optimized image URL
export function cloudinaryImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: string | number
    format?: string
    crop?: string
  } = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
  } = options

  const transforms = [
    `f_${format}`,
    `q_${quality}`,
    width && `w_${width}`,
    height && `h_${height}`,
    width && height && `c_${crop}`,
  ]
    .filter(Boolean)
    .join(',')

  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${publicId}`
}

// Extract public ID from a Cloudinary URL
export function getPublicId(url: string): string {
  // e.g. https://res.cloudinary.com/cloud/image/upload/v123/rfyglobal/gallery/abc.jpg
  // → rfyglobal/gallery/abc
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
  return match?.[1] ?? url
}
```

---

## TASK 3 — Cloudinary Upload API Route

Create `src/app/api/upload/route.ts`:

This is the **single upload endpoint** for all file types. It accepts a base64-encoded file from the client, uploads to Cloudinary in the correct folder, and returns the secure URL and public ID.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cloudinary, UPLOAD_FOLDERS } from '@/lib/cloudinary'

export const runtime = 'nodejs'

// Max body size for Next.js API routes
export const config = {
  api: { bodyParser: { sizeLimit: '32mb' } },
}

type UploadFolder = keyof typeof UPLOAD_FOLDERS

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { file, folder, resourceType = 'image' } = body as {
    file: string        // base64 data URI: "data:image/jpeg;base64,..."
    folder: UploadFolder
    resourceType?: 'image' | 'video' | 'raw' // 'raw' for audio/PDF
  }

  if (!file || !folder) {
    return NextResponse.json({ error: 'file and folder are required' }, { status: 400 })
  }

  if (!UPLOAD_FOLDERS[folder]) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }

  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: UPLOAD_FOLDERS[folder],
      resource_type: resourceType,
      // Image optimization defaults
      ...(resourceType === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    })
  } catch (err: unknown) {
    console.error('[Cloudinary upload error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// DELETE — remove a file from Cloudinary (admin only)
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicId, resourceType = 'image' } = await req.json()
  if (!publicId) return NextResponse.json({ error: 'publicId required' }, { status: 400 })

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
```

---

## TASK 4 — Client Upload Hook

Create `src/lib/cloudinary-client.ts`:

This replaces `useUploadThing`. It reads a file as base64 and posts to `/api/upload` with progress tracking.

```typescript
'use client'

import { useState, useCallback } from 'react'

export type CloudinaryFolder =
  | 'blogCover'
  | 'blogInline'
  | 'scriptureAudio'
  | 'studyMaterial'
  | 'gallery'
  | 'cms'

export type ResourceType = 'image' | 'raw'

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  width?: number
  height?: number
  format?: string
  bytes?: number
}

interface UseCloudinaryUploadOptions {
  folder: CloudinaryFolder
  resourceType?: ResourceType
  onProgress?: (progress: number) => void
  onComplete?: (result: CloudinaryUploadResult) => void
  onError?: (error: string) => void
}

export function useCloudinaryUpload({
  folder,
  resourceType = 'image',
  onProgress,
  onComplete,
  onError,
}: UseCloudinaryUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(async (file: File): Promise<CloudinaryUploadResult | null> => {
    setUploading(true)
    setProgress(0)

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Simulate progress during base64 read (0→30%)
      setProgress(30)
      onProgress?.(30)

      // Upload to Cloudinary via our API
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, folder, resourceType }),
      })

      setProgress(90)
      onProgress?.(90)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload failed')
      }

      const result: CloudinaryUploadResult = await res.json()

      setProgress(100)
      onProgress?.(100)
      onComplete?.(result)
      return result
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      onError?.(message)
      return null
    } finally {
      setUploading(false)
    }
  }, [folder, resourceType, onProgress, onComplete, onError])

  const uploadMany = useCallback(async (files: File[]): Promise<CloudinaryUploadResult[]> => {
    const results: CloudinaryUploadResult[] = []
    for (const file of files) {
      const result = await upload(file)
      if (result) results.push(result)
    }
    return results
  }, [upload])

  return { upload, uploadMany, uploading, progress }
}
```

---

## TASK 5 — Update UploadZone Component

Rewrite `src/components/shared/UploadZone.tsx` to use Cloudinary instead of Uploadthing.

The component interface stays **identical** from the outside — same props, same behavior, same gold progress bar UI. Only the internal upload mechanism changes.

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useCloudinaryUpload } from '@/lib/cloudinary-client'
import type { CloudinaryFolder, ResourceType } from '@/lib/cloudinary-client'
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Music, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  name: string
  url: string
  publicId?: string
}

interface UploadZoneProps {
  folder: CloudinaryFolder
  resourceType?: ResourceType
  onUploadComplete: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  accept?: 'image' | 'audio' | 'document'
  label?: string
  className?: string
  preview?: boolean
}

interface FileState {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
  publicId?: string
  error?: string
}

const ACCEPT_MAP = {
  image: 'image/*',
  audio: 'audio/mpeg,audio/mp3,audio/*',
  document: 'application/pdf,.doc,.docx',
}

const RESOURCE_TYPE_MAP: Record<string, ResourceType> = {
  image: 'image',
  audio: 'raw',
  document: 'raw',
}

export function UploadZone({
  folder,
  resourceType,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  accept = 'image',
  label,
  className,
  preview = false,
}: UploadZoneProps) {
  const [fileStates, setFileStates] = useState<FileState[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const resolvedResourceType = resourceType ?? RESOURCE_TYPE_MAP[accept]

  const updateFileState = (index: number, updates: Partial<FileState>) => {
    setFileStates((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    )
  }

  const handleFiles = useCallback(async (selected: File[]) => {
    const limited = selected.slice(0, maxFiles)
    const initial: FileState[] = limited.map((file) => ({
      file,
      progress: 0,
      status: 'uploading',
    }))
    setFileStates(initial)

    const completed: UploadedFile[] = []

    // Upload files in parallel (up to 3 at a time)
    const BATCH_SIZE = 3
    for (let i = 0; i < limited.length; i += BATCH_SIZE) {
      const batch = limited.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex
          try {
            // Read as base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(file)
            })

            updateFileState(globalIndex, { progress: 30 })

            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                file: base64,
                folder,
                resourceType: resolvedResourceType,
              }),
            })

            updateFileState(globalIndex, { progress: 90 })

            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.error ?? 'Upload failed')
            }

            const result = await res.json()
            updateFileState(globalIndex, {
              progress: 100,
              status: 'done',
              url: result.url,
              publicId: result.publicId,
            })
            completed.push({ name: file.name, url: result.url, publicId: result.publicId })
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Upload failed'
            updateFileState(globalIndex, { status: 'error', error: message })
            onUploadError?.(err instanceof Error ? err : new Error(message))
          }
        })
      )
    }

    if (completed.length > 0) onUploadComplete(completed)
  }, [folder, resolvedResourceType, maxFiles, onUploadComplete, onUploadError])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }, [handleFiles])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) handleFiles(selected)
    e.target.value = ''
  }

  const reset = () => setFileStates([])
  const removeFile = (i: number) => setFileStates((prev) => prev.filter((_, idx) => idx !== i))

  const allDone = fileStates.length > 0 && fileStates.every((f) => f.status === 'done')
  const hasError = fileStates.some((f) => f.status === 'error')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      {fileStates.length === 0 && (
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
                ? `Drop up to ${maxFiles} files here`
                : `Drop a ${accept} file here`)}
            </p>
            <p className="font-body text-xs text-white/25 mt-1">or click to browse</p>
          </div>
        </label>
      )}

      {/* File states */}
      {fileStates.length > 0 && (
        <div className="space-y-2">
          {fileStates.map((f, i) => (
            <div key={i} className="border border-white/10 p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="shrink-0">
                  {f.status === 'done' && f.url && preview && accept === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt="" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className={cn(
                      'w-10 h-10 border flex items-center justify-center',
                      f.status === 'done' ? 'border-gold/40 text-gold' :
                      f.status === 'error' ? 'border-red-brand/40 text-red-brand' :
                      'border-white/10 text-white/30'
                    )}>
                      {f.status === 'done' ? <CheckCircle size={16} /> :
                       f.status === 'error' ? <AlertCircle size={16} /> :
                       accept === 'audio' ? <Music size={16} /> :
                       accept === 'document' ? <FileText size={16} /> :
                       <ImageIcon size={16} />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-white/70 truncate">{f.file.name}</p>
                  <p className={cn(
                    'font-body text-[10px] mt-0.5',
                    f.status === 'done' ? 'text-gold/70' :
                    f.status === 'error' ? 'text-red-brand/70' :
                    'text-white/30'
                  )}>
                    {f.status === 'done' ? 'Uploaded ✓' :
                     f.status === 'error' ? (f.error ?? 'Failed') :
                     `${f.progress}%`}
                  </p>
                </div>
                {(f.status === 'done' || f.status === 'error') && (
                  <button onClick={() => removeFile(i)}
                    className="text-white/20 hover:text-white/60 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Progress bar */}
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    f.status === 'error' ? 'bg-red-brand/60' : 'bg-gold'
                  )}
                  style={{ width: `${f.status === 'error' ? 100 : f.progress}%` }}
                />
              </div>
            </div>
          ))}

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

## TASK 6 — Update All UploadZone Usages

The `UploadZone` prop `endpoint` (Uploadthing) is now `folder` (Cloudinary). Update every usage:

#### `src/components/admin/blog/BlogPostEditor.tsx`
```typescript
// BEFORE:
<UploadZone endpoint="blogCoverImage" accept="image" ... />

// AFTER:
<UploadZone folder="blogCover" accept="image" ... />
```

#### `src/components/admin/editor/RichTextEditor.tsx`
Replace the inline image upload with Cloudinary:
```typescript
const addImage = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const toastId = toast.loading('Uploading image…')
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64, folder: 'blogInline', resourceType: 'image' }),
    })

    toast.dismiss(toastId)

    if (res.ok) {
      const { url } = await res.json()
      editor.chain().focus().setImage({ src: url }).run()
      toast.success('Image inserted')
    } else {
      toast.error('Image upload failed')
    }
  }
  input.click()
}
```

#### `src/components/admin/scripture/ScriptureManager.tsx`
```typescript
// BEFORE:
<UploadZone endpoint="scriptureAudio" accept="audio" ... />

// AFTER:
<UploadZone folder="scriptureAudio" accept="audio" resourceType="raw" ... />
```

#### `src/components/admin/study/StudyManager.tsx`
```typescript
// BEFORE:
<UploadZone endpoint="studyMaterial" accept="document" ... />

// AFTER:
<UploadZone folder="studyMaterial" accept="document" resourceType="raw" ... />
```

#### `src/components/admin/gallery/GalleryManager.tsx`
```typescript
// BEFORE:
<UploadZone endpoint="galleryImages" accept="image" maxFiles={20} ... />

// AFTER:
<UploadZone folder="gallery" accept="image" maxFiles={20} ... />
```

#### `src/components/admin/cms/CMSEditor.tsx`
```typescript
// BEFORE:
<UploadZone endpoint="cmsImage" accept="image" ... />

// AFTER:
<UploadZone folder="cms" accept="image" ... />
```

---

## TASK 7 — Cloudinary Image Optimization in Public Pages

Now that images are on Cloudinary, use the `CldImage` component from `next-cloudinary` for automatic optimization in public-facing pages.

Update `next.config.mjs` — add Cloudinary to image remote patterns:

```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'res.cloudinary.com' },
    // Remove utfs.io and uploadthing.com
  ],
  formats: ['image/avif', 'image/webp'],
},
```

For the **Gallery page** specifically, use Cloudinary URL transformations for responsive thumbnails. Update `src/components/gallery/GalleryClientPage.tsx`:

```typescript
// Replace next/image <Image> with Cloudinary-optimized URLs
// For masonry grid thumbnails (small):
const thumbnailUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_600,f_auto,q_auto/')
    : url

// For lightbox (large):
const lightboxUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_1200,f_auto,q_auto/')
    : url
```

Apply `thumbnailUrl()` to the masonry grid images and `lightboxUrl()` to the lightbox image.

For **Blog cover images** in `src/app/(public)/blog/page.tsx` and `src/app/(public)/blog/[slug]/page.tsx`:
```typescript
// Thumbnail in listing:
url.replace('/upload/', '/upload/w_600,h_300,c_fill,f_auto,q_auto/')

// Full cover on post page:
url.replace('/upload/', '/upload/w_900,h_450,c_fill,f_auto,q_auto/')
```

For **Yadah portrait** in `AboutClient` and `FromTheShepherd`:
```typescript
// Portrait photo:
url.replace('/upload/', '/upload/w_600,h_700,c_fill,f_auto,q_auto,g_face/')
// g_face = Cloudinary auto-detects and centers on the face
```

---

## TASK 8 — Remove Uploadthing from Root Layout

Open `src/app/layout.tsx` and remove:
```typescript
// REMOVE these lines:
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import { extractRouterConfig } from 'uploadthing/server'
import { rfyFileRouter } from '@/lib/uploadthing'

// And remove from JSX:
<NextSSRPlugin routerConfig={extractRouterConfig(rfyFileRouter)} />
```

---

## TASK 9 — Remove Uploadthing API Route

Delete `src/app/api/uploadthing/route.ts` entirely.

---

## TASK 10 — Update next.config.mjs CSP

Open `next.config.mjs` and update `connect-src` and `img-src` in the CSP header:

```javascript
// REMOVE references to uploadthing:
// "connect-src ... https://uploadthing.com https://utfs.io"
// "img-src ... https://utfs.io"

// ADD Cloudinary:
"connect-src 'self' https://rfyglobal.org https://api.cloudinary.com https://api.paystack.co https://api.flutterwave.com https://api.payaza.africa",
"img-src 'self' data: blob: https: https://res.cloudinary.com",
"media-src 'self' https://res.cloudinary.com blob:",
```

---

## TASK 11 — Update .env.example

Final `.env.example` for Cloudinary section:

```env
# Cloudinary (replaces Uploadthing)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
```

---

## TASK 12 — Seed Admin User (Production)

Since we are preparing for Vercel deployment, create a seed script for the admin user.

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment')
    process.exit(1)
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user ${email} already exists — skipping`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: { email, password: hashed, name: 'Admin', role: 'ADMIN' },
  })

  console.log(`✅ Admin user created: ${user.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
```

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
}
```

Add `ts-node` if not present:
```bash
npm install -D ts-node
```

To seed:
```bash
ADMIN_EMAIL=admin@rfyglobal.org ADMIN_PASSWORD=yourpassword npx prisma db seed
```

---

## PHASE 7b COMPLETION CHECKLIST

- [ ] `uploadthing` and `@uploadthing/react` removed from `package.json`
- [ ] `next-cloudinary` and `cloudinary` installed
- [ ] `src/lib/uploadthing.ts` deleted
- [ ] `src/lib/uploadthing-client.ts` deleted
- [ ] `src/app/api/uploadthing/route.ts` deleted
- [ ] `src/lib/cloudinary.ts` created
- [ ] `src/lib/cloudinary-client.ts` created
- [ ] `src/app/api/upload/route.ts` created
- [ ] `UploadZone` updated to use Cloudinary
- [ ] All `endpoint=` props renamed to `folder=` across all components
- [ ] `NextSSRPlugin` removed from root layout
- [ ] Gallery images use `w_600,f_auto,q_auto` for thumbnails
- [ ] Blog covers use `w_900,h_450,c_fill,f_auto,q_auto` for full size
- [ ] Yadah portrait uses `g_face` auto-crop
- [ ] `next.config.mjs` updated — `res.cloudinary.com` in remotePatterns
- [ ] CSP updated — Cloudinary domains, Uploadthing domains removed
- [ ] `.env.local` has Cloudinary keys, Uploadthing keys removed
- [ ] `prisma/seed.ts` created and works
- [ ] `npm run build` completes without errors
- [ ] Test: upload a gallery image and confirm it appears with Cloudinary URL
- [ ] Test: upload a scripture MP3 and confirm audio player works

---

## NOTES FOR CURSOR

- Cloudinary `resource_type: 'raw'` is used for audio (MP3) and documents (PDF). Using `resource_type: 'image'` for these will fail. The `RESOURCE_TYPE_MAP` in `UploadZone` handles this automatically based on the `accept` prop.
- The `g_face` gravity parameter in Cloudinary only works when there is a detectable face. If Yadah's portrait is a full-body or artistic shot without a clear face, remove `g_face` and use `g_center` or `g_auto` instead.
- Base64 encoding large files (gallery images up to 8MB) produces strings ~33% larger than the original file. The `api.bodyParser.sizeLimit: '32mb'` in the upload route handles this. Do not lower this limit.
- The `cloudinaryImageUrl()` helper in `src/lib/cloudinary.ts` is for server-side URL generation. The inline URL replacement pattern (`url.replace('/upload/', '/upload/w_600,.../')`) is for client components where you already have a stored Cloudinary URL.
- After this migration, all **new** uploads go to Cloudinary. Any **existing** Uploadthing URLs already stored in the DB will continue to work (Uploadthing doesn't delete files when you remove the integration). You don't need to migrate existing URLs.
- The Cloudinary free tier gives 25GB storage and 25GB bandwidth/month — more than sufficient for Room For You's current scale.
- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Vercel environment variables before deploying.
