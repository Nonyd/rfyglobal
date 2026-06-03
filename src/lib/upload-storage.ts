import 'server-only'

import path from 'path'
import { cloudinary, UPLOAD_FOLDERS } from '@/lib/cloudinary'
import {
  deleteFileLocally,
  uploadBase64Locally,
  UPLOAD_FOLDER_SUBDIRS,
  type UploadFolderKey,
} from '@/lib/upload-local'

export type UploadResourceType = 'image' | 'video' | 'raw'

export interface UploadResult {
  url: string
  publicId: string
  width: number | null
  height: number | null
  format: string
  bytes: number
}

/** Prefer Cloudinary in production (Vercel); local disk is for dev only. */
export function isCloudinaryStorageEnabled(): boolean {
  if (process.env.UPLOAD_STORAGE === 'local') return false
  if (process.env.UPLOAD_STORAGE === 'cloudinary') return true
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  )
}

export async function uploadBase64ToStorage(
  base64: string,
  originalName: string,
  folder: UploadFolderKey,
  resourceType: UploadResourceType = 'image',
): Promise<UploadResult> {
  if (!UPLOAD_FOLDER_SUBDIRS[folder]) {
    throw new Error('Invalid folder')
  }

  if (isCloudinaryStorageEnabled()) {
    const cloudFolder = UPLOAD_FOLDERS[folder]
    const result = await cloudinary.uploader.upload(base64, {
      folder: cloudFolder,
      resource_type: resourceType,
      ...(resourceType === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width ?? null,
      height: result.height ?? null,
      format: result.format ?? path.extname(originalName).replace('.', ''),
      bytes: result.bytes ?? 0,
    }
  }

  const subDir = UPLOAD_FOLDER_SUBDIRS[folder]
  const local = await uploadBase64Locally(base64, originalName, subDir)
  return {
    url: local.url,
    publicId: local.filename,
    width: null,
    height: null,
    format: path.extname(originalName).replace('.', ''),
    bytes: local.size,
  }
}

export async function deleteFromStorage(
  opts: { url?: string; publicId?: string; resourceType?: UploadResourceType },
): Promise<void> {
  const resourceType = opts.resourceType ?? 'image'

  if (isCloudinaryStorageEnabled()) {
    const id = opts.publicId?.trim()
    if (!id || id.startsWith('/uploads/')) {
      throw new Error('Cloudinary publicId required')
    }
    await cloudinary.uploader.destroy(id, { resource_type: resourceType })
    return
  }

  const targetUrl =
    typeof opts.url === 'string' && opts.url.startsWith('/uploads/')
      ? opts.url
      : typeof opts.publicId === 'string' && opts.publicId.startsWith('/uploads/')
        ? opts.publicId
        : null

  if (!targetUrl) {
    throw new Error('Local upload url required')
  }

  await deleteFileLocally(targetUrl)
}
