'use client'

import { useState, useCallback } from 'react'
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
    setFileStates((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)))
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

    const BATCH_SIZE = 3
    for (let i = 0; i < limited.length; i += BATCH_SIZE) {
      const batch = limited.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex
          try {
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
        }),
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
      {fileStates.length === 0 && (
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-gold bg-gold/10'
              : 'border-white/15 hover:border-gold/40 hover:bg-white/2',
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
            isDragging ? 'border-gold text-gold' : 'border-white/20 text-white/30',
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
                      'border-white/10 text-white/30',
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
                    'text-white/30',
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
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    f.status === 'error' ? 'bg-red-brand/60' : 'bg-gold',
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
