/**
 * Updates all DB records containing Cloudinary URLs to local paths
 * Run AFTER migrate-cloudinary.mjs completes successfully
 *
 * Run: node scripts/update-db-urls.mjs
 */

import { createRequire } from 'module'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const content = require('fs').readFileSync(filePath, 'utf-8')
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

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function hasCloudinaryUrl(text) {
  return typeof text === 'string' && text.includes('res.cloudinary.com')
}

function replaceUrl(text, urlMap, publicIdMap) {
  if (!text || typeof text !== 'string') return text
  if (!hasCloudinaryUrl(text)) return text

  let result = text

  for (const [cloudUrl, localUrl] of Object.entries(urlMap)) {
    result = result.replaceAll(cloudUrl, localUrl)
  }

  const sortedPublicIds = Object.entries(publicIdMap).sort(
    (a, b) => b[0].length - a[0].length,
  )

  for (const [publicId, localUrl] of sortedPublicIds) {
    const escaped = publicId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(
      `https://res\\.cloudinary\\.com/[^/]+/(?:image|raw|video)/upload(?:/[^/"'\\s]*)*/(?:v\\d+/)?${escaped}(?:\\.[^/?"'\\s]+)?`,
      'g',
    )
    result = result.replace(regex, localUrl)
  }

  return result
}

function replaceJsonUrls(value, urlMap, publicIdMap) {
  if (value == null) return value
  if (typeof value === 'string') return replaceUrl(value, urlMap, publicIdMap)
  if (Array.isArray(value)) {
    return value.map((item) => replaceJsonUrls(item, urlMap, publicIdMap))
  }
  if (typeof value === 'object') {
    const next = {}
    for (const [key, val] of Object.entries(value)) {
      next[key] = replaceJsonUrls(val, urlMap, publicIdMap)
    }
    return next
  }
  return value
}

async function main() {
  console.log('Loading URL map...')
  const mapPath = path.join(__dirname, 'cloudinary-url-map.json')
  const raw = JSON.parse(await readFile(mapPath, 'utf-8'))
  const urlMap = raw.urlMap ?? raw
  const publicIdMap = raw.publicIdMap ?? {}
  console.log(
    `Loaded ${Object.keys(urlMap).length} URL mappings, ${Object.keys(publicIdMap).length} public ID mappings\n`,
  )

  let totalUpdated = 0

  console.log('Updating GalleryImage...')
  const galleryImages = await prisma.galleryImage.findMany()
  for (const item of galleryImages) {
    const updates = {}
    if (hasCloudinaryUrl(item.url)) updates.url = replaceUrl(item.url, urlMap, publicIdMap)
    if (hasCloudinaryUrl(item.thumbnailUrl))
      updates.thumbnailUrl = replaceUrl(item.thumbnailUrl, urlMap, publicIdMap)
    if (Object.keys(updates).length > 0) {
      await prisma.galleryImage.update({ where: { id: item.id }, data: updates })
      totalUpdated++
    }
  }

  console.log('Updating HomeCarouselSlide...')
  const carouselSlides = await prisma.homeCarouselSlide.findMany()
  for (const slide of carouselSlides) {
    if (hasCloudinaryUrl(slide.url)) {
      await prisma.homeCarouselSlide.update({
        where: { id: slide.id },
        data: { url: replaceUrl(slide.url, urlMap, publicIdMap) },
      })
      totalUpdated++
    }
  }

  console.log('Updating Post...')
  const posts = await prisma.post.findMany()
  for (const post of posts) {
    const updates = {}
    if (hasCloudinaryUrl(post.coverImage))
      updates.coverImage = replaceUrl(post.coverImage, urlMap, publicIdMap)
    if (hasCloudinaryUrl(post.content))
      updates.content = replaceUrl(post.content, urlMap, publicIdMap)
    if (Object.keys(updates).length > 0) {
      await prisma.post.update({ where: { id: post.id }, data: updates })
      totalUpdated++
    }
  }

  console.log('Updating Event...')
  const events = await prisma.event.findMany()
  for (const event of events) {
    if (hasCloudinaryUrl(event.imageUrl)) {
      await prisma.event.update({
        where: { id: event.id },
        data: { imageUrl: replaceUrl(event.imageUrl, urlMap, publicIdMap) },
      })
      totalUpdated++
    }
  }

  console.log('Updating StudyMaterial...')
  const studyMaterials = await prisma.studyMaterial.findMany()
  for (const material of studyMaterials) {
    if (hasCloudinaryUrl(material.fileUrl)) {
      await prisma.studyMaterial.update({
        where: { id: material.id },
        data: { fileUrl: replaceUrl(material.fileUrl, urlMap, publicIdMap) },
      })
      totalUpdated++
    }
  }

  console.log('Updating SiteContent...')
  const siteContent = await prisma.siteContent.findMany()
  for (const item of siteContent) {
    if (hasCloudinaryUrl(item.value)) {
      await prisma.siteContent.update({
        where: { id: item.id },
        data: { value: replaceUrl(item.value, urlMap, publicIdMap) },
      })
      totalUpdated++
    }
  }

  console.log('Updating Testimony...')
  const testimonies = await prisma.testimony.findMany()
  for (const testimony of testimonies) {
    const nextUrls = replaceJsonUrls(testimony.imageUrls, urlMap, publicIdMap)
    const nextVideo = hasCloudinaryUrl(testimony.videoUrl)
      ? replaceUrl(testimony.videoUrl, urlMap, publicIdMap)
      : testimony.videoUrl

    const imageChanged =
      JSON.stringify(nextUrls) !== JSON.stringify(testimony.imageUrls ?? null)
    const videoChanged = nextVideo !== testimony.videoUrl

    if (imageChanged || videoChanged) {
      await prisma.testimony.update({
        where: { id: testimony.id },
        data: {
          ...(imageChanged ? { imageUrls: nextUrls } : {}),
          ...(videoChanged ? { videoUrl: nextVideo } : {}),
        },
      })
      totalUpdated++
    }
  }

  console.log('Updating Scripture...')
  const scriptures = await prisma.scripture.findMany()
  for (const scripture of scriptures) {
    if (hasCloudinaryUrl(scripture.audioUrl)) {
      await prisma.scripture.update({
        where: { id: scripture.id },
        data: { audioUrl: replaceUrl(scripture.audioUrl, urlMap, publicIdMap) },
      })
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
