/**
 * Migration script: Download all Cloudinary assets and save locally
 *
 * Run: node scripts/migrate-cloudinary.mjs
 *
 * Prerequisites:
 * - DATABASE_URL in .env
 * - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const content = readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'))
loadEnvFile(path.join(__dirname, '..', '.env'))

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing Cloudinary credentials')
  process.exit(1)
}

const UPLOADS_BASE = path.join(__dirname, '..', 'public', 'uploads')
const RESOURCE_TYPES = ['image', 'raw', 'video']

async function fetchCloudinaryResources(resourceType, nextCursor = null) {
  const params = new URLSearchParams({
    max_results: '500',
    ...(nextCursor ? { next_cursor: nextCursor } : {}),
  })

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}?${params}`,
    { headers: { Authorization: `Basic ${auth}` } },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudinary API error (${resourceType}): ${res.status} ${text}`)
  }

  return res.json()
}

async function downloadFile(url, localPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(localPath, buffer)
  return buffer.length
}

function getLocalInfo(resource) {
  const publicId = resource.public_id
  const format = resource.format

  const relativeId = publicId.startsWith('rfyglobal/')
    ? publicId.slice('rfyglobal/'.length)
    : publicId

  const parts = relativeId.split('/')
  const baseName = parts.pop() ?? 'file'
  const subDir = parts.length > 0 ? parts.join('/') : 'general'
  const localFilename = format ? `${baseName}.${format}` : baseName
  const localPath = path.join(UPLOADS_BASE, subDir, localFilename)
  const urlPath = `/uploads/${subDir}/${localFilename}`

  return { subDir, localFilename, localPath, urlPath, publicId }
}

async function fetchAllResources() {
  const allResources = []

  for (const resourceType of RESOURCE_TYPES) {
    let nextCursor = null

    do {
      console.log(`Fetching ${resourceType} resources${nextCursor ? ' (next page)' : ''}...`)
      const data = await fetchCloudinaryResources(resourceType, nextCursor)
      const batch = data.resources || []
      allResources.push(...batch)
      nextCursor = data.next_cursor || null
      console.log(`  Fetched ${batch.length} (total: ${allResources.length})`)
    } while (nextCursor)
  }

  return allResources
}

async function main() {
  console.log('Starting Cloudinary migration...\n')

  if (!existsSync(UPLOADS_BASE)) {
    await mkdir(UPLOADS_BASE, { recursive: true })
  }

  const allResources = await fetchAllResources()
  console.log(`\nTotal assets to migrate: ${allResources.length}\n`)

  const urlMap = {}
  const publicIdMap = {}
  let downloaded = 0
  let skipped = 0
  let failed = 0

  for (const resource of allResources) {
    const { subDir, localPath, urlPath, publicId } = getLocalInfo(resource)
    const cloudinaryUrl = resource.secure_url

    try {
      const dir = path.join(UPLOADS_BASE, subDir)
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })

      if (existsSync(localPath)) {
        console.log(`  SKIP (exists): ${urlPath}`)
        urlMap[cloudinaryUrl] = urlPath
        publicIdMap[publicId] = urlPath
        skipped++
        continue
      }

      const size = await downloadFile(cloudinaryUrl, localPath)
      urlMap[cloudinaryUrl] = urlPath
      publicIdMap[publicId] = urlPath
      downloaded++
      console.log(`  ✓ ${urlPath} (${Math.round(size / 1024)}KB)`)
    } catch (err) {
      console.error(`  ✗ FAILED: ${cloudinaryUrl} — ${err.message}`)
      failed++
    }
  }

  console.log(`\nDownload complete: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`)

  const mapPath = path.join(__dirname, 'cloudinary-url-map.json')
  await writeFile(mapPath, JSON.stringify({ urlMap, publicIdMap }, null, 2))
  console.log(`\nURL map saved to: ${mapPath}`)
  console.log('\nNow run: node scripts/update-db-urls.mjs')
}

main().catch(console.error)
