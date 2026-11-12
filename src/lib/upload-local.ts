// Writes uploads to disk under UPLOADS_DIR/<folder>. Sole upload backend (Cloudinary removed).
// Files are served at /uploads/... by src/app/uploads/[...path]/route.ts.

import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

/**
 * Production: set UPLOAD_DIR to a folder outside the deploy root (e.g. /home/sonshubco/rfyglobal-uploads) so
 * deploys (`git reset --hard`, `git clean`) can never touch media. Falls back to public/uploads for dev
 * and for servers that have not moved their files yet (Next serves public/ files itself in that case).
 */
const UPLOADS_DIR = process.env.UPLOAD_DIR?.trim()
  ? path.resolve(process.env.UPLOAD_DIR.trim())
  : path.join(process.cwd(), 'public', 'uploads')

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

/**
 * Maps a path relative to /uploads/ onto disk, or null if it would escape UPLOADS_DIR
 * (`..`, absolute paths) or names a dotfile.
 */
export function resolveUploadPath(relativePath: string): string | null {
  const segments = relativePath.split(/[\\/]+/).filter(Boolean)
  if (segments.length === 0 || segments.some((s) => s === '..' || s.startsWith('.'))) return null
  const filepath = path.resolve(UPLOADS_DIR, ...segments)
  if (!filepath.startsWith(UPLOADS_DIR + path.sep)) return null
  return filepath
}

export async function deleteFileLocally(url: string): Promise<void> {
  try {
    const filepath = resolveUploadPath(url.replace(/^\/uploads\//, ''))
    if (!filepath) throw new Error(`Refusing to delete outside uploads dir: ${url}`)
    const { unlink } = await import('fs/promises')
    await unlink(filepath)
  } catch (error) {
    console.error('[upload-local] delete failed:', error)
  }
}

/** Maps admin upload folder keys to subdirectories of UPLOADS_DIR */
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
  mediaAudio: 'media/audio',
} as const

export type UploadFolderKey = keyof typeof UPLOAD_FOLDER_SUBDIRS

export { UPLOADS_DIR }
