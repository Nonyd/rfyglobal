// Files are stored at: /home/sonshubco/rfyglobal.org/public/uploads/
// Served at: https://rfyglobal.org/uploads/[subdir]/[filename]
// Apache proxies / to Next.js which serves public/ as static files

import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

async function ensureUploadsDir(subDir?: string) {
  const dir = subDir ? path.join(UPLOADS_DIR, subDir) : UPLOADS_DIR
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  return dir
}

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}${ext}`
}

export async function uploadFileLocally(
  buffer: Buffer,
  originalName: string,
  subDir: string = 'general',
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

export async function uploadBase64Locally(
  base64: string,
  originalName: string,
  subDir: string = 'general',
): Promise<{ url: string; filename: string; size: number }> {
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  return uploadFileLocally(buffer, originalName, subDir)
}

export async function deleteFileLocally(url: string): Promise<void> {
  try {
    const relativePath = url.replace(/^\/uploads\//, '')
    const filepath = path.join(UPLOADS_DIR, relativePath)
    const { unlink } = await import('fs/promises')
    await unlink(filepath)
  } catch (error) {
    console.error('[upload-local] delete failed:', error)
  }
}

/** Maps admin upload folder keys to local subdirectories under public/uploads/ */
export const UPLOAD_FOLDER_SUBDIRS = {
  blogCover: 'blog/covers',
  blogInline: 'blog/inline',
  scriptureAudio: 'scripture/audio',
  studyMaterial: 'study/materials',
  gallery: 'gallery',
  cms: 'cms',
  portraits: 'portraits',
  eventImage: 'events',
  testimony: 'testimonies',
  homeCarousel: 'home-carousel',
} as const

export type UploadFolderKey = keyof typeof UPLOAD_FOLDER_SUBDIRS

export { UPLOADS_DIR }
