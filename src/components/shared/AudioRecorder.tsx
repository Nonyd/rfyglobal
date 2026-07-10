'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square, RotateCcw, Upload as UploadIcon, Loader2 } from 'lucide-react'
import type { CloudinaryFolder, ResourceType } from '@/lib/cloudinary-client'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  folder: CloudinaryFolder
  resourceType?: ResourceType
  maxFileSizeMB?: number
  onUploadComplete: (url: string) => void
  onUploadError?: (error: Error) => void
  className?: string
}

type RecorderPhase = 'idle' | 'requesting' | 'recording' | 'preview' | 'uploading'
type MicPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied'

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

function isMicrophoneAllowedByPolicy(): boolean {
  if (typeof document === 'undefined') return true
  const doc = document as Document & {
    permissionsPolicy?: { allowsFeature: (feature: string) => boolean }
    featurePolicy?: { allowsFeature: (feature: string) => boolean }
  }
  const policy = doc.permissionsPolicy ?? doc.featurePolicy
  if (!policy?.allowsFeature) return true
  return policy.allowsFeature('microphone')
}

function getRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const type of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

function extensionForMime(mime: string): string {
  if (mime.includes('webm')) return '.webm'
  if (mime.includes('ogg')) return '.ogg'
  if (mime.includes('mp4') || mime.includes('m4a')) return '.m4a'
  return '.webm'
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioRecorder({
  folder,
  resourceType = 'raw',
  maxFileSizeMB = 32,
  onUploadComplete,
  onUploadError,
  className,
}: AudioRecorderProps) {
  const [phase, setPhase] = useState<RecorderPhase>('idle')
  const [micPermission, setMicPermission] = useState<MicPermissionState>('unknown')
  const [elapsed, setElapsed] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedMime, setRecordedMime] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const clearPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return

    let mounted = true
    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((status) => {
        if (!mounted) return
        setMicPermission(status.state as MicPermissionState)
        status.onchange = () => {
          if (mounted) setMicPermission(status.state as MicPermissionState)
        }
      })
      .catch(() => {
        // Permissions API unsupported for microphone in this browser — rely on getUserMedia.
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      stopTimer()
      stopStream()
      clearPreviewUrl()
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop()
      }
    }
  }, [clearPreviewUrl, stopStream, stopTimer])

  const beginRecording = useCallback(
    (stream: MediaStream, mimeType: string) => {
      clearPreviewUrl()
      setRecordedBlob(null)
      setRecordedMime('')
      chunksRef.current = []
      streamRef.current = stream
      setMicPermission('granted')

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stopTimer()
        stopStream()

        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []

        if (blob.size === 0) {
          setPhase('idle')
          onUploadError?.(new Error('Recording was empty. Please try again.'))
          return
        }

        const url = URL.createObjectURL(blob)
        previewUrlRef.current = url
        setPreviewUrl(url)
        setRecordedBlob(blob)
        setRecordedMime(mimeType)
        setPhase('preview')
      }

      recorder.start(250)
      setElapsed(0)
      setPhase('recording')
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    },
    [clearPreviewUrl, onUploadError, stopStream, stopTimer],
  )

  const handleRecordClick = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      onUploadError?.(new Error('Recording is not supported in this browser'))
      return
    }

    if (!isMicrophoneAllowedByPolicy()) {
      onUploadError?.(
        new Error(
          'Microphone is blocked by this site’s security settings. Contact your administrator or refresh after the site is updated.',
        ),
      )
      return
    }

    const mimeType = getRecorderMimeType()
    if (!mimeType) {
      onUploadError?.(new Error('Audio recording is not supported in this browser'))
      return
    }

    // Call getUserMedia immediately in the click handler so the browser permission
    // prompt is tied to the user gesture (required by Chrome, Safari, etc.).
    setPhase('requesting')

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => beginRecording(stream, mimeType))
      .catch((err: unknown) => {
        stopTimer()
        stopStream()
        setPhase('idle')

        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setMicPermission('denied')
            onUploadError?.(
              new Error(
                'Microphone access was denied. Click the lock/site icon in your browser address bar, allow microphone access, then try again.',
              ),
            )
            return
          }
          if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            onUploadError?.(new Error('No microphone was found on this device.'))
            return
          }
        }

        onUploadError?.(
          new Error(err instanceof Error ? err.message : 'Could not access microphone'),
        )
      })
  }, [beginRecording, onUploadError, stopStream, stopTimer])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
    }
  }, [])

  const discardRecording = useCallback(() => {
    clearPreviewUrl()
    setRecordedBlob(null)
    setRecordedMime('')
    setElapsed(0)
    setPhase('idle')
  }, [clearPreviewUrl])

  const uploadRecording = useCallback(async () => {
    if (!recordedBlob) return

    const limitBytes = maxFileSizeMB * 1024 * 1024
    if (recordedBlob.size > limitBytes) {
      onUploadError?.(
        new Error(`Recording is too large (${(recordedBlob.size / 1024 / 1024).toFixed(1)}MB). Max ${maxFileSizeMB}MB.`),
      )
      return
    }

    setPhase('uploading')

    try {
      const ext = extensionForMime(recordedMime)
      const file = new File([recordedBlob], `recording${ext}`, { type: recordedMime || recordedBlob.type })

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, folder, resourceType }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Upload failed (${res.status})`)
      }

      const result = (await res.json()) as { url: string }
      if (!result.url) throw new Error('No URL returned from upload')

      clearPreviewUrl()
      setRecordedBlob(null)
      setRecordedMime('')
      setElapsed(0)
      setPhase('idle')
      onUploadComplete(result.url)
    } catch (err: unknown) {
      setPhase('preview')
      onUploadError?.(err instanceof Error ? err : new Error('Upload failed'))
    }
  }, [
    recordedBlob,
    recordedMime,
    maxFileSizeMB,
    folder,
    resourceType,
    clearPreviewUrl,
    onUploadComplete,
    onUploadError,
  ])

  const isRecordingSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(getRecorderMimeType())

  if (!isRecordingSupported) return null

  return (
    <div
      className={cn('border p-4', className)}
      style={{
        borderColor: 'var(--a-border, rgba(255,255,255,0.15))',
        background: 'transparent',
      }}
    >
      {phase === 'idle' && (
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex w-full items-center justify-center gap-2 border py-3 font-body text-sm transition-all"
          style={{
            borderColor: 'var(--a-border)',
            color: 'var(--a-text-secondary, rgba(255,255,255,0.6))',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--a-gold)'
            e.currentTarget.style.color = 'var(--a-gold)'
            e.currentTarget.style.background = 'var(--a-gold-light)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--a-border)'
            e.currentTarget.style.color = 'var(--a-text-secondary, rgba(255,255,255,0.6))'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Mic size={16} />
          Record audio directly
        </button>
      )}

      {phase === 'requesting' && (
        <div className="flex items-center justify-center gap-2 py-3 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          <Loader2 size={16} className="animate-spin" />
          Allow microphone access in your browser…
        </div>
      )}

      {phase === 'recording' && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span
              className="h-2.5 w-2.5 animate-pulse rounded-full"
              style={{ background: 'var(--a-red, #ef4444)' }}
            />
            <span className="font-body text-sm tabular-nums" style={{ color: 'var(--a-text)' }}>
              Recording {formatDuration(elapsed)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex w-full items-center justify-center gap-2 border py-3 font-body text-sm transition-all"
            style={{
              borderColor: 'rgba(239,68,68,0.4)',
              color: '#FCA5A5',
              background: 'rgba(239,68,68,0.06)',
            }}
          >
            <Square size={14} fill="currentColor" />
            Stop recording
          </button>
        </div>
      )}

      {phase === 'preview' && previewUrl && (
        <div className="space-y-3">
          <audio src={previewUrl} controls className="w-full" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                discardRecording()
                handleRecordClick()
              }}
              className="flex flex-1 items-center justify-center gap-2 border py-2.5 font-body text-xs transition-all"
              style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}
            >
              <RotateCcw size={14} />
              Re-record
            </button>
            <button
              type="button"
              onClick={() => void uploadRecording()}
              className="flex flex-1 items-center justify-center gap-2 border py-2.5 font-body text-xs transition-all"
              style={{
                borderColor: 'var(--a-gold-border)',
                background: 'var(--a-gold-light)',
                color: 'var(--a-gold)',
              }}
            >
              <UploadIcon size={14} />
              Use recording
            </button>
          </div>
        </div>
      )}

      {phase === 'uploading' && (
        <div className="flex items-center justify-center gap-2 py-3 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          <Loader2 size={16} className="animate-spin" />
          Uploading recording…
        </div>
      )}
    </div>
  )
}
