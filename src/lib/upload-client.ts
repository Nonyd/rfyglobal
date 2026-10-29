'use client'

import { useCallback, useState } from 'react'

export type UploadFolder =
  | 'blogCover'
  | 'blogInline'
  | 'scriptureAudio'
  | 'studyMaterial'
  | 'gallery'
  | 'cms'
  | 'portraits'
  | 'eventImage'
  | 'testimony'
  | 'homeCarousel'

export type ResourceType = 'image' | 'video' | 'raw'

export interface UploadClientResult {
  url: string
  publicId: string
  width?: number
  height?: number
  format?: string
  bytes?: number
}

interface UseUploadOptions {
  folder: UploadFolder
  resourceType?: ResourceType
  onProgress?: (progress: number) => void
  onComplete?: (result: UploadClientResult) => void
  onError?: (error: string) => void
}

export function useUpload({
  folder,
  resourceType = 'image',
  onProgress,
  onComplete,
  onError,
}: UseUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = useCallback(
    async (file: File): Promise<UploadClientResult | null> => {
      setUploading(true)
      setProgress(0)

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        setProgress(30)
        onProgress?.(30)

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

        const result: UploadClientResult = await res.json()
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
    },
    [folder, resourceType, onProgress, onComplete, onError],
  )

  const uploadMany = useCallback(
    async (files: File[]): Promise<UploadClientResult[]> => {
      const results: UploadClientResult[] = []
      for (const file of files) {
        const result = await upload(file)
        if (result) results.push(result)
      }
      return results
    },
    [upload],
  )

  return { upload, uploadMany, uploading, progress }
}
