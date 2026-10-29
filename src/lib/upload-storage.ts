import 'server-only'

import path from 'path'
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

export async function uploadBase64ToStorage(
  base64: string,
  originalName: string,
  folder: UploadFolderKey,
): Promise<UploadResult> {
  const subDir = UPLOAD_FOLDER_SUBDIRS[folder]
  if (!subDir) {
    throw new Error('Invalid folder')
  }

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
  const targetUrl =
    typeof opts.url === 'string' && opts.url.startsWith('/uploads/')
      ? opts.url
      : typeof opts.publicId === 'string' && opts.publicId.startsWith('/uploads/')
        ? opts.publicId
        : null

  if (!targetUrl) {
    // Legacy remote URLs (e.g. old Cloudinary assets) are not ours to delete; treat as already gone.
    console.warn('[upload-storage] skip delete of non-local file:', opts.url ?? opts.publicId)
    return
  }

  await deleteFileLocally(targetUrl)
}
