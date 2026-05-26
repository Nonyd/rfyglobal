# ROOM FOR YOU — File Storage Migration Cursor Prompt
## Cloudinary → Local Webuzo Server Storage

---

## CONTEXT

Migrate all file storage from Cloudinary to local server storage on the Webuzo VPS.

**Server path:** `/home/sonshubco/rfyglobal.org/public/uploads/`
**Public URL:** `https://rfyglobal.org/uploads/[filename]`
**Existing assets:** ~1,141 files on Cloudinary (~2.17GB)

**What this migration covers:**
1. Update upload API to save files locally instead of Cloudinary
2. Update Next.js config to serve local images
3. Create a migration script to download all Cloudinary assets
4. Update all DB records with Cloudinary URLs to local paths

---

## TASK 1 — Create Local Upload Helper

Create `src/lib/upload-local.ts`:

```typescript
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// Ensure uploads directory exists
async function ensureUploadsDir(subDir?: string) {
  const dir = subDir ? path.join(UPLOADS_DIR, subDir) : UPLOADS_DIR
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  return dir
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}${ext}`
}

// Upload file from Buffer
export async function uploadFileLocally(
  buffer: Buffer,
  originalName: string,
  subDir: string = 'general'
): Promise<{ url: string; filename: string; size: number }> {
  const dir = await ensureUploadsDir(subDir)
  const filename = generateFilename(originalName)
  const filepath = path.join(dir, filename)

  await writeFile(filepath, buffer)

  return {
    url: `/uploads/${subDir}/${filename}`,
    filename,
    size: buffer.length,
  }
}

// Upload from base64
export async function uploadBase64Locally(
  base64: string,
  originalName: string,
  subDir: string = 'general'
): Promise<{ url: string; filename: string; size: number }> {
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  return uploadFileLocally(buffer, originalName, subDir)
}

// Delete file
export async function deleteFileLocally(url: string): Promise<void> {
  try {
    const relativePath = url.replace('/uploads/', '')
    const filepath = path.join(UPLOADS_DIR, relativePath)
    const { unlink } = await import('fs/promises')
    await unlink(filepath)
  } catch (error) {
    console.error('[upload-local] delete failed:', error)
  }
}

export { UPLOADS_DIR }
```

---

## TASK 2 — Update Upload API

Open `src/app/api/upload/route.ts`.

Replace the Cloudinary upload logic with local file upload:

```typescript
import { uploadFileLocally } from '@/lib/upload-local'

// In the POST handler, replace:
// const result = await cloudinary.uploader.upload(...)
// With:
const bytes = await file.arrayBuffer()
const buffer = Buffer.from(bytes)

// Determine subDir based on upload type
const uploadType = formData.get('type') as string || 'general'
const subDirMap: Record<string, string> = {
  gallery: 'gallery',
  blog: 'blog',
  event: 'events',
  avatar: 'avatars',
  cms: 'cms',
  testimony: 'testimonies',
  study: 'study',
  general: 'general',
}
const subDir = subDirMap[uploadType] ?? 'general'

const result = await uploadFileLocally(buffer, file.name, subDir)

return NextResponse.json({
  url: result.url,
  publicId: result.filename,
  width: null,
  height: null,
  format: path.extname(file.name).replace('.', ''),
  size: result.size,
})
```

Remove all Cloudinary imports from the upload route.

---

## TASK 3 — Update Next.js Config

Open `next.config.mjs`.

Remove Cloudinary from `images.remotePatterns` and add local uploads:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Keep any other external image sources
      // Remove: { hostname: 'res.cloudinary.com' }
    ],
    // Local uploads are served from /public/uploads/ — no remote pattern needed
    // They're treated as local static files
  },
  // Allow serving files from /public/uploads/
}
```

Since local uploads are in `/public/uploads/`, Next.js serves them as static files automatically — no `remotePatterns` needed.

However, for existing Cloudinary URLs still in the DB during transition, keep the Cloudinary domain temporarily:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    },
  ],
},
```

Remove this after migration script runs successfully.

---

## TASK 4 — Migration Script

Create `scripts/migrate-cloudinary.mjs`:

```javascript
/**
 * Migration script: Download all Cloudinary assets and save locally
 * Then update all DB records with Cloudinary URLs to local paths
 * 
 * Run: node scripts/migrate-cloudinary.mjs
 * 
 * Prerequisites:
 * - DATABASE_URL in .env
 * - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 */

import { createRequire } from 'module'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Load env
const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary credentials')
  process.exit(1)
}

const UPLOADS_BASE = path.join(__dirname, '..', 'public', 'uploads')

// Fetch all Cloudinary resources
async function fetchCloudinaryResources(nextCursor = null) {
  const params = new URLSearchParams({
    max_results: '500',
    ...(nextCursor ? { next_cursor: nextCursor } : {}),
  })

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params}`,
    { headers: { Authorization: `Basic ${auth}` } }
  )
  return res.json()
}

// Download a single file
async function downloadFile(url, localPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(localPath, buffer)
  return buffer.length
}

// Get local path from Cloudinary URL
function getLocalInfo(resource) {
  const publicId = resource.public_id
  const format = resource.format
  const folder = publicId.includes('/') ? publicId.split('/')[0] : 'general'
  const filename = publicId.includes('/') 
    ? publicId.split('/').slice(1).join('-') 
    : publicId
  
  const subDir = folder
  const localFilename = `${filename}.${format}`
  const localPath = path.join(UPLOADS_BASE, subDir, localFilename)
  const urlPath = `/uploads/${subDir}/${localFilename}`
  
  return { subDir, localFilename, localPath, urlPath }
}

async function main() {
  console.log('Starting Cloudinary migration...\n')

  // Create base uploads directory
  if (!existsSync(UPLOADS_BASE)) {
    await mkdir(UPLOADS_BASE, { recursive: true })
  }

  // Fetch all resources
  let allResources = []
  let nextCursor = null

  do {
    console.log(`Fetching resources${nextCursor ? ' (next page)' : ''}...`)
    const data = await fetchCloudinaryResources(nextCursor)
    allResources = allResources.concat(data.resources || [])
    nextCursor = data.next_cursor || null
    console.log(`  Fetched ${data.resources?.length || 0} resources (total: ${allResources.length})`)
  } while (nextCursor)

  console.log(`\nTotal assets to migrate: ${allResources.length}\n`)

  // Download each file
  const urlMap = {} // cloudinaryUrl → localUrl
  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const resource of allResources) {
    const { subDir, localPath, urlPath } = getLocalInfo(resource)
    const cloudinaryUrl = resource.secure_url

    try {
      // Create subdirectory if needed
      const dir = path.join(UPLOADS_BASE, subDir)
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })

      // Skip if already downloaded
      if (existsSync(localPath)) {
        console.log(`  SKIP (exists): ${urlPath}`)
        urlMap[cloudinaryUrl] = urlPath
        skipped++
        continue
      }

      // Download
      const size = await downloadFile(cloudinaryUrl, localPath)
      urlMap[cloudinaryUrl] = urlPath
      downloaded++
      console.log(`  ✓ ${urlPath} (${Math.round(size / 1024)}KB)`)
    } catch (err) {
      console.error(`  ✗ FAILED: ${cloudinaryUrl} — ${err.message}`)
      failed++
    }
  }

  console.log(`\nDownload complete: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`)

  // Save URL mapping for DB update step
  const mapPath = path.join(__dirname, 'cloudinary-url-map.json')
  await writeFile(mapPath, JSON.stringify(urlMap, null, 2))
  console.log(`\nURL map saved to: ${mapPath}`)
  console.log('\nNow run: node scripts/update-db-urls.mjs')
}

main().catch(console.error)
```

---

## TASK 5 — DB URL Update Script

Create `scripts/update-db-urls.mjs`:

```javascript
/**
 * Updates all DB records containing Cloudinary URLs to local paths
 * Run AFTER migrate-cloudinary.mjs completes successfully
 * 
 * Run: node scripts/update-db-urls.mjs
 */

import { createRequire } from 'module'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Replace Cloudinary URL with local URL in a string
function replaceUrl(text, urlMap) {
  if (!text || typeof text !== 'string') return text
  let result = text
  for (const [cloudUrl, localUrl] of Object.entries(urlMap)) {
    result = result.replaceAll(cloudUrl, localUrl)
  }
  return result
}

// Check if a string contains any Cloudinary URL
function hasCloudinaryUrl(text) {
  return typeof text === 'string' && text.includes('res.cloudinary.com')
}

async function main() {
  console.log('Loading URL map...')
  const mapPath = path.join(__dirname, 'cloudinary-url-map.json')
  const urlMap = JSON.parse(await readFile(mapPath, 'utf-8'))
  console.log(`Loaded ${Object.keys(urlMap).length} URL mappings\n`)

  let totalUpdated = 0

  // Update GalleryItem
  console.log('Updating GalleryItem...')
  const galleryItems = await prisma.galleryItem.findMany()
  for (const item of galleryItems) {
    const updates = {}
    if (hasCloudinaryUrl(item.url)) updates.url = replaceUrl(item.url, urlMap)
    if (hasCloudinaryUrl(item.thumbnail)) updates.thumbnail = replaceUrl(item.thumbnail, urlMap)
    if (Object.keys(updates).length > 0) {
      await prisma.galleryItem.update({ where: { id: item.id }, data: updates })
      totalUpdated++
    }
  }

  // Update BlogPost
  console.log('Updating BlogPost...')
  const blogPosts = await prisma.blogPost.findMany()
  for (const post of blogPosts) {
    const updates = {}
    if (hasCloudinaryUrl(post.coverImage)) updates.coverImage = replaceUrl(post.coverImage, urlMap)
    if (hasCloudinaryUrl(post.content)) updates.content = replaceUrl(post.content, urlMap)
    if (Object.keys(updates).length > 0) {
      await prisma.blogPost.update({ where: { id: post.id }, data: updates })
      totalUpdated++
    }
  }

  // Update Event
  console.log('Updating Event...')
  const events = await prisma.event.findMany()
  for (const event of events) {
    const updates = {}
    if (hasCloudinaryUrl(event.image)) updates.image = replaceUrl(event.image, urlMap)
    if (hasCloudinaryUrl(event.coverImage)) updates.coverImage = replaceUrl(event.coverImage, urlMap)
    if (Object.keys(updates).length > 0) {
      await prisma.event.update({ where: { id: event.id }, data: updates })
      totalUpdated++
    }
  }

  // Update StudyMaterial / StudySeries
  console.log('Updating Study...')
  const studyMaterials = await prisma.studyMaterial.findMany()
  for (const material of studyMaterials) {
    const updates = {}
    if (hasCloudinaryUrl(material.thumbnail)) updates.thumbnail = replaceUrl(material.thumbnail, urlMap)
    if (hasCloudinaryUrl(material.fileUrl)) updates.fileUrl = replaceUrl(material.fileUrl, urlMap)
    if (Object.keys(updates).length > 0) {
      await prisma.studyMaterial.update({ where: { id: material.id }, data: updates })
      totalUpdated++
    }
  }

  // Update CmsContent (any Cloudinary URLs in CMS values)
  console.log('Updating CmsContent...')
  const cmsItems = await prisma.cmsContent.findMany()
  for (const item of cmsItems) {
    if (hasCloudinaryUrl(item.value)) {
      await prisma.cmsContent.update({
        where: { id: item.id },
        data: { value: replaceUrl(item.value, urlMap) },
      })
      totalUpdated++
    }
  }

  // Update Testimony (if has image)
  console.log('Updating Testimony...')
  const testimonies = await prisma.testimony.findMany()
  for (const testimony of testimonies) {
    const updates = {}
    if (hasCloudinaryUrl(testimony.image)) updates.image = replaceUrl(testimony.image, urlMap)
    if (Object.keys(updates).length > 0) {
      await prisma.testimony.update({ where: { id: testimony.id }, data: updates })
      totalUpdated++
    }
  }

  // Update Scripture (if has image)
  console.log('Updating Scripture...')
  const scriptures = await prisma.scripture.findMany()
  for (const scripture of scriptures) {
    const updates = {}
    if (hasCloudinaryUrl(scripture.image)) updates.image = replaceUrl(scripture.image, urlMap)
    if (Object.keys(updates).length > 0) {
      await prisma.scripture.update({ where: { id: scripture.id }, data: updates })
      totalUpdated++
    }
  }

  console.log(`\n✓ DB update complete. ${totalUpdated} records updated.`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
```

---

## TASK 6 — Remove Cloudinary Dependencies

After migration is confirmed working:

Open `src/lib/cloudinary.ts` or wherever Cloudinary is configured. Add a comment that it's deprecated but keep the file for reference during transition.

Remove Cloudinary env vars from the upload flow — the upload API should no longer call Cloudinary.

Do NOT remove `CLOUDINARY_CLOUD_NAME` etc. from `.env` yet — keep them until migration is fully confirmed.

---

## TASK 7 — Update Admin Upload Components

Search for any component that constructs Cloudinary transformation URLs (e.g. `https://res.cloudinary.com/dgl6csi4b/image/upload/w_800/...`).

Update them to use the local URL directly:

```typescript
// BEFORE (Cloudinary transformation URL):
const imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_800,q_auto/${publicId}`

// AFTER (local URL — no transformations needed):
const imageUrl = localUrl  // e.g. /uploads/gallery/1234567-abc.jpg
```

For `next/image` components, local `/uploads/` paths work directly:
```typescript
<Image src="/uploads/gallery/1234567-abc.jpg" width={800} height={600} alt="..." />
```

---

## TASK 8 — Apache/Nginx Static File Serving

The `/public/uploads/` folder is served by Next.js as static files automatically — no Apache config changes needed.

However add a note in the codebase about the upload path:

```typescript
// src/lib/upload-local.ts
// Files are stored at: /home/sonshubco/rfyglobal.org/public/uploads/
// Served at: https://rfyglobal.org/uploads/[subdir]/[filename]
// Apache proxies / to Next.js which serves public/ as static files
```

---

## COMPLETION CHECKLIST

**Code Changes**
- [ ] `src/lib/upload-local.ts` created
- [ ] `src/app/api/upload/route.ts` uses local upload instead of Cloudinary
- [ ] `next.config.mjs` keeps Cloudinary in remotePatterns (for existing URLs during migration)
- [ ] Any Cloudinary transformation URL builders updated to use plain local URLs

**Migration Scripts**
- [ ] `scripts/migrate-cloudinary.mjs` created
- [ ] `scripts/update-db-urls.mjs` created
- [ ] Both scripts handle errors gracefully (don't crash on single failure)
- [ ] URL map saved to `scripts/cloudinary-url-map.json`

**Build**
- [ ] `npm run build` passes
- [ ] New uploads go to `/public/uploads/` on server

---

## HOW TO RUN MIGRATION (after deploying code)

Run these on your **Windows machine** (with DATABASE_URL in .env.local) or on the server:

**Step 1 — Download all Cloudinary files:**
```powershell
cd C:\Users\DELL\Documents\YADAH\rfyglobal
node scripts/migrate-cloudinary.mjs
```

**Step 2 — Update DB URLs:**
```powershell
node scripts/update-db-urls.mjs
```

**Step 3 — Copy downloaded files to server:**
```bash
# From Windows PowerShell, sync the uploads folder to server:
scp -r public/uploads/ root@159.198.47.232:/home/sonshubco/rfyglobal.org/public/uploads/
```

Or run the migration script directly on the server after pulling the code.

**Step 4 — Verify** a few images load correctly on the live site.

**Step 5 — Remove Cloudinary from remotePatterns** in `next.config.mjs` once confirmed.

---

## NOTES FOR CURSOR

- The upload API currently uses Cloudinary's SDK — replace the upload call with the new `uploadFileLocally` helper
- Keep the same response shape `{ url, publicId, format, size }` so existing components don't break
- The `publicId` field in the response can now be the filename instead of Cloudinary public_id
- Local URLs start with `/uploads/` — they're relative paths served as static files by Next.js
- `next/image` works with local paths (`/uploads/...`) without any `remotePatterns` config
- The migration scripts run outside Next.js — they use require() for Prisma and dotenv
- During transition, BOTH Cloudinary URLs (old records) and local URLs (new uploads) will exist in the DB — that's fine, Next.js will serve both
- After `update-db-urls.mjs` runs successfully, all DB records point to local paths
- The `public/uploads/` folder is gitignored — do NOT commit uploaded files to git
- Add `public/uploads/` to `.gitignore` if not already there
