'use client'

import { useState, useCallback } from 'react'
import type { CloudinaryFolder, ResourceType } from '@/lib/cloudinary-client'
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Music, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export interface UploadedFile {
  name: string
  url: string
  publicId?: string
}

export interface UploadFailure {
  filename: string
  error: string
}

export interface UploadPartialResult {
  succeeded: { url: string; filename: string; publicId?: string }[]
  failed: UploadFailure[]
}

interface UploadZoneProps {
  folder: CloudinaryFolder
  resourceType?: ResourceType
  /**
   * Fired once at the end of a batch with all successfully uploaded files.
   * Optional in v2 — prefer `onPartialComplete` for batch flows that need
   * to surface per-file failures to the user.
   */
  onUploadComplete?: (files: UploadedFile[]) => void
  /** Called per-file when a single upload fails. */
  onUploadError?: (error: Error) => void
  /**
   * Fired once at the end of the batch with both succeeded and failed lists.
   * Use this for flows that need to show a failure report and retry list.
   */
  onPartialComplete?: (result: UploadPartialResult) => void
  /** Fired after each file finishes (success or failure). */
  onProgress?: (done: number, total: number) => void
  maxFiles?: number
  /** Per-file size cap in MB. Files over this size are rejected client-side. */
  maxFileSizeMB?: number
  accept?: 'image' | 'audio' | 'document' | 'video'
  label?: string
  /** Optional hint shown below the main label, e.g. "Max 100 files · 10MB per file". */
  helpText?: string
  className?: string
  preview?: boolean
  /** When set, POST here instead of `/api/upload` (e.g. public testimony upload). */
  uploadEndpoint?: string
  /** Extra JSON fields merged with `{ file }` when `uploadEndpoint` is set (server must accept them). */
  uploadExtra?: Record<string, unknown>
}

interface FileState {
  id: string
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
  video: 'video/mp4,video/*',
}

const RESOURCE_TYPE_MAP: Record<string, ResourceType> = {
  image: 'image',
  audio: 'raw',
  document: 'raw',
  video: 'video',
}

const BATCH_SIZE = 5
const DEFAULT_MAX_FILE_SIZE_MB = 10

const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1)

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `f_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

export function UploadZone({
  folder,
  resourceType,
  onUploadComplete,
  onUploadError,
  onPartialComplete,
  onProgress,
  maxFiles = 1,
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,
  accept = 'image',
  label,
  helpText,
  className,
  preview = false,
  uploadEndpoint,
  uploadExtra,
}: UploadZoneProps) {
  const [fileStates, setFileStates] = useState<FileState[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const resolvedResourceType = resourceType ?? RESOURCE_TYPE_MAP[accept] ?? 'image'

  const updateFileState = useCallback(
    (id: string, updates: Partial<FileState>) => {
      setFileStates((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    },
    [],
  )

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; oversized: string[] } => {
      const valid: File[] = []
      const oversized: string[] = []
      const limitBytes = maxFileSizeMB * 1024 * 1024
      files.forEach((file) => {
        if (file.size > limitBytes) {
          oversized.push(`${file.name} (${formatMB(file.size)}MB)`)
        } else {
          valid.push(file)
        }
      })
      return { valid, oversized }
    },
    [maxFileSizeMB],
  )

  const handleFiles = useCallback(
    async (selected: File[]) => {
      const limited = selected.slice(0, maxFiles)
      const { valid, oversized } = validateFiles(limited)

      if (oversized.length > 0) {
        const preview = oversized.slice(0, 3).join('\n')
        const remainder = oversized.length > 3 ? `\n…and ${oversized.length - 3} more` : ''
        toast.error(
          `${oversized.length} file${oversized.length > 1 ? 's' : ''} skipped (over ${maxFileSizeMB}MB):\n${preview}${remainder}`,
          { duration: 6000 },
        )
      }

      if (valid.length === 0) return

      const initial: FileState[] = valid.map((file) => ({
        id: newId(),
        file,
        progress: 0,
        status: 'uploading',
      }))
      setFileStates(initial)

      const succeeded: UploadPartialResult['succeeded'] = []
      const failed: UploadFailure[] = []
      let finished = 0
      const total = initial.length
      onProgress?.(0, total)

      for (let i = 0; i < initial.length; i += BATCH_SIZE) {
        const batch = initial.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async (entry) => {
            const { id, file } = entry
            try {
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
              })

              updateFileState(id, { progress: 30 })

              const payload = uploadEndpoint
                ? { file: base64, ...(uploadExtra ?? {}) }
                : {
                    file: base64,
                    folder,
                    resourceType: resolvedResourceType,
                  }

              const res = await fetch(uploadEndpoint ?? '/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              })

              updateFileState(id, { progress: 90 })

              if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string }
                throw new Error(body.error ?? `Upload failed (${res.status})`)
              }

              const result = (await res.json()) as { url: string; publicId?: string }
              if (!result.url) throw new Error('No URL returned from upload')

              updateFileState(id, {
                progress: 100,
                status: 'done',
                url: result.url,
                publicId: result.publicId,
              })
              succeeded.push({ url: result.url, filename: file.name, publicId: result.publicId })
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Upload failed'
              updateFileState(id, { status: 'error', error: message })
              failed.push({ filename: file.name, error: message })
              onUploadError?.(err instanceof Error ? err : new Error(message))
            } finally {
              finished += 1
              onProgress?.(finished, total)
            }
          }),
        )
      }

      if (succeeded.length > 0 && onUploadComplete) {
        onUploadComplete(
          succeeded.map((s) => ({ name: s.filename, url: s.url, publicId: s.publicId })),
        )
      }
      onPartialComplete?.({ succeeded, failed })
    },
    [
      folder,
      resolvedResourceType,
      maxFiles,
      maxFileSizeMB,
      onUploadComplete,
      onUploadError,
      onPartialComplete,
      onProgress,
      updateFileState,
      validateFiles,
      uploadEndpoint,
      uploadExtra,
    ],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(Array.from(e.dataTransfer.files))
    },
    [handleFiles],
  )

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) handleFiles(selected)
    e.target.value = ''
  }

  const reset = () => setFileStates([])
  const removeFile = (id: string) => setFileStates((prev) => prev.filter((f) => f.id !== id))

  const allDone = fileStates.length > 0 && fileStates.every((f) => f.status === 'done')
  const hasError = fileStates.some((f) => f.status === 'error')

  const defaultHelpText =
    maxFiles > 1
      ? `Max ${maxFiles} file${maxFiles > 1 ? 's' : ''} · ${maxFileSizeMB}MB per file`
      : `Max ${maxFileSizeMB}MB`

  return (
    <div className={cn('space-y-3', className)}>
      {fileStates.length === 0 && (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed cursor-pointer transition-all duration-200',
            isDragging ? 'border-gold' : 'border-theme',
          )}
          style={{
            borderColor: isDragging
              ? 'var(--a-gold, #C9A84C)'
              : 'var(--a-border, rgba(255,255,255,0.15))',
            background: isDragging
              ? 'var(--a-gold-light, rgba(201,168,76,0.08))'
              : 'transparent',
          }}
        >
          <input
            type="file"
            accept={ACCEPT_MAP[accept]}
            multiple={maxFiles > 1}
            onChange={onFileInput}
            className="hidden"
          />
          <div
            className="w-12 h-12 rounded-full border flex items-center justify-center transition-colors"
            style={{
              borderColor: isDragging
                ? 'var(--a-gold, #C9A84C)'
                : 'var(--a-border, rgba(255,255,255,0.2))',
              color: isDragging
                ? 'var(--a-gold, #C9A84C)'
                : 'var(--a-text-muted, rgba(255,255,255,0.3))',
            }}
          >
            <Upload size={20} />
          </div>
          <div className="text-center">
            <p
              className="font-body text-sm"
              style={{ color: 'var(--a-text-secondary, rgba(255,255,255,0.6))' }}
            >
              {label ??
                (maxFiles > 1
                  ? `Drop up to ${maxFiles} files here`
                  : `Drop a ${accept} file here`)}
            </p>
            <p
              className="font-body text-xs mt-1"
              style={{ color: 'var(--a-text-muted, rgba(255,255,255,0.25))' }}
            >
              or click to browse
            </p>
            <p
              className="font-body text-[10px] mt-2 tracking-wide uppercase"
              style={{ color: 'var(--a-text-muted, rgba(255,255,255,0.35))' }}
            >
              {helpText ?? defaultHelpText}
            </p>
          </div>
        </label>
      )}

      {fileStates.length > 0 && (
        <div className="space-y-2">
          {fileStates.map((f) => {
            const isError = f.status === 'error'
            const isDone = f.status === 'done'
            return (
              <div
                key={f.id}
                className="border p-3"
                style={{
                  borderColor: isError
                    ? 'rgba(239,68,68,0.4)'
                    : isDone
                      ? 'rgba(34,197,94,0.3)'
                      : 'var(--a-border, rgba(255,255,255,0.1))',
                  background: isError
                    ? 'rgba(239,68,68,0.06)'
                    : isDone
                      ? 'rgba(34,197,94,0.04)'
                      : 'var(--a-surface, transparent)',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="shrink-0">
                    {isDone && f.url && preview && accept === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <div
                        className={cn(
                          'w-10 h-10 border flex items-center justify-center',
                          isDone
                            ? 'border-gold/40 text-gold'
                            : isError
                              ? 'border-red-brand/40 text-red-brand'
                              : 'border-white/10 text-white/30',
                        )}
                        style={
                          !isDone && !isError
                            ? {
                                borderColor: 'var(--a-border, rgba(255,255,255,0.1))',
                                color: 'var(--a-text-muted, rgba(255,255,255,0.3))',
                              }
                            : undefined
                        }
                      >
                        {isDone ? (
                          <CheckCircle size={16} />
                        ) : isError ? (
                          <AlertCircle size={16} />
                        ) : accept === 'audio' ? (
                          <Music size={16} />
                        ) : accept === 'document' ? (
                          <FileText size={16} />
                        ) : (
                          <ImageIcon size={16} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-body text-xs truncate"
                      style={{
                        color: isError
                          ? '#FCA5A5'
                          : 'var(--a-text-secondary, rgba(255,255,255,0.7))',
                      }}
                    >
                      {f.file.name}
                    </p>
                    <p
                      className="font-body text-[10px] mt-0.5"
                      style={{
                        color: isDone
                          ? 'rgba(134,239,172,0.85)'
                          : isError
                            ? '#F87171'
                            : 'var(--a-text-muted, rgba(255,255,255,0.3))',
                      }}
                    >
                      {isDone
                        ? `Uploaded · ${formatMB(f.file.size)}MB`
                        : isError
                          ? (f.error ?? 'Failed')
                          : `${f.progress}% · ${formatMB(f.file.size)}MB`}
                    </p>
                  </div>
                  {(isDone || isError) && (
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="transition-colors"
                      style={{ color: 'var(--a-text-muted, rgba(255,255,255,0.3))' }}
                      aria-label="Remove from list"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      isError ? 'bg-red-brand/60' : 'bg-gold',
                    )}
                    style={{ width: `${isError ? 100 : f.progress}%` }}
                  />
                </div>
              </div>
            )
          })}

          {(allDone || hasError) && (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-body transition-colors"
              style={{ color: 'var(--a-text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--a-gold)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--a-text-muted)'
              }}
            >
              + Upload {maxFiles > 1 ? 'more files' : 'different file'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
