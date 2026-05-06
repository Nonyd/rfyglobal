'use client'

import { useState, useCallback } from 'react'
import { useUploadThing } from '@/lib/uploadthing-client'
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Music, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RFYFileRouter } from '@/lib/uploadthing'

export interface UploadedFile {
  name: string
  url: string
  size?: number
  /** MIME type when provided by the uploader */
  type?: string
}

function pickUrl(res: { url?: string; ufsUrl?: string } | undefined): string | undefined {
  return res?.url ?? res?.ufsUrl
}

interface UploadZoneProps {
  endpoint: keyof RFYFileRouter
  onUploadComplete: (files: UploadedFile[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  accept?: 'image' | 'audio' | 'document'
  label?: string
  className?: string
  preview?: boolean
}

interface FileProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
  error?: string
}

const ACCEPT_MAP = {
  image: 'image/*',
  audio: 'audio/mpeg,audio/mp3',
  document: 'application/pdf,.doc,.docx',
}

const FILE_ICON = {
  image: ImageIcon,
  audio: Music,
  document: FileText,
}

export function UploadZone({
  endpoint,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  accept = 'image',
  label,
  className,
  preview = false,
}: UploadZoneProps) {
  const [files, setFiles] = useState<FileProgress[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const { startUpload } = useUploadThing(endpoint, {
    onUploadProgress: (progress) => {
      setFiles((prev) =>
        prev.map((f) => (f.status === 'uploading' ? { ...f, progress } : f)),
      )
    },
    onClientUploadComplete: (res) => {
      const completed: UploadedFile[] = res.map((r) => {
        const row = r as { name?: string; type?: string }
        return {
          name: row.name ?? 'file',
          url: pickUrl(r) ?? '',
          type: row.type,
        }
      })
      setFiles((prev) =>
        prev.map((f, i) => ({
          ...f,
          status: 'done' as const,
          progress: 100,
          url: pickUrl(res[i]) ?? f.url,
        })),
      )
      onUploadComplete(completed)
    },
    onUploadError: (err) => {
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error' as const, error: err.message })),
      )
      onUploadError?.(err)
    },
  })

  const handleFiles = useCallback(
    async (selectedFiles: File[]) => {
      const limited = selectedFiles.slice(0, maxFiles)
      const fileProgress: FileProgress[] = limited.map((f) => ({
        file: f,
        progress: 0,
        status: 'uploading',
      }))
      setFiles(fileProgress)
      await startUpload(limited)
    },
    [startUpload, maxFiles],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = Array.from(e.dataTransfer.files)
      if (dropped.length > 0) void handleFiles(dropped)
    },
    [handleFiles],
  )

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) void handleFiles(selected)
    e.target.value = ''
  }

  const removeFile = (i: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      return next
    })
  }

  const reset = () => {
    setFiles([])
  }

  const retryFailed = () => {
    const failed = files.filter((f) => f.status === 'error')
    if (failed.length === 0) return
    void handleFiles(failed.map((f) => f.file))
  }

  const FileIcon = FILE_ICON[accept]
  const allDone = files.length > 0 && files.every((f) => f.status === 'done')
  const hasError = files.some((f) => f.status === 'error')

  return (
    <div className={cn('space-y-3', className)}>
      {files.length === 0 && (
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
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
          <div
            className={cn(
              'w-12 h-12 rounded-full border flex items-center justify-center transition-colors',
              isDragging ? 'border-gold text-gold' : 'border-white/20 text-white/30',
            )}
          >
            <Upload size={20} />
          </div>
          <div className="text-center">
            <p className="font-body text-sm text-white/60">
              {label ??
                (maxFiles > 1
                  ? `Drop up to ${maxFiles} ${accept} files here`
                  : `Drop a ${accept} file here`)}
            </p>
            <p className="font-body text-xs text-white/25 mt-1">or click to browse</p>
          </div>
        </label>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={`${f.file.name}-${i}`} className="border border-white/10 p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="shrink-0">
                  {f.status === 'done' && f.url && preview && accept === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt="" className="w-10 h-10 object-cover" />
                  ) : (
                    <div
                      className={cn(
                        'w-10 h-10 border flex items-center justify-center',
                        f.status === 'done'
                          ? 'border-gold/40 text-gold'
                          : f.status === 'error'
                            ? 'border-red-brand/40 text-red-brand'
                            : 'border-white/10 text-white/30',
                      )}
                    >
                      {f.status === 'done' ? (
                        <CheckCircle size={16} />
                      ) : f.status === 'error' ? (
                        <AlertCircle size={16} />
                      ) : (
                        <FileIcon size={16} />
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-white/70 truncate">{f.file.name}</p>
                  <p
                    className={cn(
                      'font-body text-[10px] mt-0.5',
                      f.status === 'done'
                        ? 'text-gold/70'
                        : f.status === 'error'
                          ? 'text-red-brand/70'
                          : 'text-white/30',
                    )}
                  >
                    {f.status === 'done'
                      ? 'Uploaded'
                      : f.status === 'error'
                        ? (f.error ?? 'Upload failed')
                        : `${f.progress}%`}
                  </p>
                </div>

                {(f.status === 'done' || f.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-white/20 hover:text-white/60 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {f.status === 'uploading' && (
                <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold transition-all duration-300 rounded-full"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              )}
              {f.status === 'done' && <div className="h-0.5 bg-gold/40 rounded-full" />}
              {f.status === 'error' && <div className="h-0.5 bg-red-brand/40 rounded-full" />}
            </div>
          ))}

          {hasError && (
            <button
              type="button"
              onClick={() => retryFailed()}
              className="text-xs text-gold/80 hover:text-gold font-body transition-colors"
            >
              Retry failed upload{files.filter((x) => x.status === 'error').length > 1 ? 's' : ''}
            </button>
          )}

          {(allDone || hasError) && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-white/30 hover:text-gold font-body transition-colors"
            >
              + Upload {maxFiles > 1 ? 'more files' : 'different file'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
