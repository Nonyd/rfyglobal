# ROOM FOR YOU — Phase 19b Cursor Prompt
## Upload Failure Tracking · Retry Failed Uploads · Failed Image Report

---

## CONTEXT

When uploading a batch of images, some may fail silently. The current implementation has no way to identify which images failed, show them to the admin, or retry them. This phase adds:

1. **Failed upload tracking** — each failed file is identified by name and shown in a list
2. **Retry failed uploads** — admin can click "Retry Failed" to attempt re-upload of failed files
3. **Upload progress report** — after a batch, show "X uploaded, Y failed" with file names of failures

---

## TASK 1 — Update UploadZone to Track and Report Failures

Open `src/components/shared/UploadZone.tsx`.

The `UploadZone` needs to:
- Track each file's upload state: `pending` | `uploading` | `done` | `error`
- Store the error message per file
- Expose failed files to the parent via a callback
- Show failed files in red with a retry button

Update the component interface:

```typescript
interface UploadZoneProps {
  folder: string
  multiple?: boolean
  maxFiles?: number
  accept?: string
  onComplete?: (urls: string[]) => void
  onUploadStart?: () => void
  // ADD THESE:
  onPartialComplete?: (result: {
    succeeded: { url: string; filename: string }[]
    failed: { filename: string; error: string }[]
  }) => void
}
```

Update the file state type:

```typescript
type FileState = {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
  error?: string
  progress?: number
}
```

Update the upload logic to track per-file results:

```typescript
const uploadFiles = async (filesToUpload: File[]) => {
  const results: { succeeded: { url: string; filename: string }[]; failed: { filename: string; error: string }[] } = {
    succeeded: [],
    failed: [],
  }

  // Upload in parallel batches of 5 to avoid rate limiting
  const BATCH_SIZE = 5
  for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
    const batch = filesToUpload.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (file) => {
        // Update file state to uploading
        setFiles(prev => prev.map(f =>
          f.file === file ? { ...f, status: 'uploading' } : f
        ))

        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('folder', folder)

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error ?? `Upload failed (${res.status})`)
          }

          const data = await res.json()
          const url = data.secure_url ?? data.url

          if (!url) throw new Error('No URL returned from upload')

          // Mark as done
          setFiles(prev => prev.map(f =>
            f.file === file ? { ...f, status: 'done', url } : f
          ))
          results.succeeded.push({ url, filename: file.name })

        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Upload failed'
          // Mark as error
          setFiles(prev => prev.map(f =>
            f.file === file ? { ...f, status: 'error', error: errorMsg } : f
          ))
          results.failed.push({ filename: file.name, error: errorMsg })
        }
      })
    )
  }

  return results
}
```

Update the render to show per-file status clearly:

```typescript
{files.map(f => (
  <div key={f.id}
    className="flex items-center gap-3 p-2.5 border"
    style={{
      borderColor: f.status === 'error'
        ? 'rgba(239,68,68,0.4)'
        : f.status === 'done'
        ? 'rgba(34,197,94,0.3)'
        : 'var(--a-border, rgba(255,255,255,0.1))',
      background: f.status === 'error'
        ? 'rgba(239,68,68,0.06)'
        : f.status === 'done'
        ? 'rgba(34,197,94,0.04)'
        : 'transparent',
    }}
  >
    {/* Status icon */}
    <div className="shrink-0 w-5 h-5 flex items-center justify-center">
      {f.status === 'done' && <span className="text-green-400 text-sm">✓</span>}
      {f.status === 'error' && <span className="text-red-400 text-sm">✗</span>}
      {f.status === 'uploading' && (
        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.4)', borderTopColor: '#C9A84C' }} />
      )}
      {f.status === 'pending' && (
        <div className="w-3 h-3 rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)' }} />
      )}
    </div>

    {/* Filename */}
    <p className="flex-1 font-body text-xs truncate"
      style={{
        color: f.status === 'error'
          ? '#FCA5A5'
          : f.status === 'done'
          ? 'rgba(134,239,172,0.8)'
          : 'rgba(255,255,255,0.6)',
      }}>
      {f.file.name}
    </p>

    {/* Error message */}
    {f.status === 'error' && f.error && (
      <p className="font-body text-[10px] shrink-0" style={{ color: '#F87171' }}>
        {f.error.length > 30 ? f.error.slice(0, 30) + '…' : f.error}
      </p>
    )}

    {/* File size */}
    {f.status !== 'error' && (
      <p className="font-body text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {(f.file.size / 1024 / 1024).toFixed(1)}MB
      </p>
    )}
  </div>
))}
```

---

## TASK 2 — Add Upload Summary + Retry to GalleryManager

Open `src/components/admin/gallery/GalleryManager.tsx`.

Update the Add Photos panel to show a summary after upload and allow retrying failed files.

Add state for upload results:

```typescript
const [uploadResult, setUploadResult] = useState<{
  succeeded: { url: string; filename: string }[]
  failed: { filename: string; error: string }[]
} | null>(null)
const [retryFiles, setRetryFiles] = useState<File[]>([])
```

Update the `UploadZone` `onComplete` to use `onPartialComplete`:

```typescript
<UploadZone
  folder="gallery"
  multiple={true}
  maxFiles={100}
  accept="image/*"
  onPartialComplete={async (result) => {
    // Save succeeded uploads to the event
    if (result.succeeded.length > 0) {
      const maxOrder = addPhotosEvent._count.images
      await Promise.all(
        result.succeeded.map((item, idx) =>
          fetch('/api/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: item.url,
              galleryEventId: addPhotosEvent.id,
              city: addPhotosEvent.city,
              takenAt: addPhotosEvent.date,
              order: maxOrder + idx,
            }),
          })
        )
      )
    }

    // Store result for display
    setUploadResult(result)
    await loadEvents()
    await loadImages()

    // Show toast
    if (result.failed.length === 0) {
      toast.success(`${result.succeeded.length} photo${result.succeeded.length > 1 ? 's' : ''} uploaded successfully`)
    } else {
      toast.error(`${result.succeeded.length} uploaded, ${result.failed.length} failed`)
    }
  }}
/>
```

Add the upload result summary below the UploadZone (inside the Add Photos panel):

```typescript
{uploadResult && (
  <div className="space-y-3">
    {/* Summary bar */}
    <div className="flex items-center gap-3 p-3"
      style={{ background: 'var(--a-bg)', border: '1px solid var(--a-border)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <p className="font-body text-xs" style={{ color: 'var(--a-text)' }}>
          {uploadResult.succeeded.length} uploaded
        </p>
      </div>
      {uploadResult.failed.length > 0 && (
        <>
          <div style={{ width: '1px', height: '12px', background: 'var(--a-border)' }} />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <p className="font-body text-xs" style={{ color: '#FCA5A5' }}>
              {uploadResult.failed.length} failed
            </p>
          </div>
        </>
      )}
      <button
        onClick={() => setUploadResult(null)}
        className="ml-auto font-body text-xs"
        style={{ color: 'var(--a-text-muted)' }}
      >
        Clear
      </button>
    </div>

    {/* Failed files list */}
    {uploadResult.failed.length > 0 && (
      <div className="border"
        style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <p className="font-body text-xs font-medium" style={{ color: '#FCA5A5' }}>
            Failed uploads — try these files again
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
          {uploadResult.failed.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-red-400 text-sm shrink-0">✗</span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs truncate" style={{ color: '#FCA5A5' }}>
                  {f.filename}
                </p>
                <p className="font-body text-[10px] mt-0.5" style={{ color: 'rgba(252,165,165,0.6)' }}>
                  {f.error}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <p className="font-body text-[10px] leading-relaxed" style={{ color: 'rgba(252,165,165,0.7)' }}>
            💡 These files failed to upload. Common causes: file too large (&gt;10MB), unsupported format,
            or network interruption. Try re-uploading them individually or check the file size.
          </p>
        </div>
      </div>
    )}
  </div>
)}
```

---

## TASK 3 — Add File Size Warning

Open `src/components/shared/UploadZone.tsx`.

Before uploading, warn if any file exceeds 10MB:

```typescript
const MAX_FILE_SIZE_MB = 10

const validateFiles = (files: File[]): { valid: File[]; oversized: string[] } => {
  const valid: File[] = []
  const oversized: string[] = []

  files.forEach(file => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      oversized.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
    } else {
      valid.push(file)
    }
  })

  return { valid, oversized }
}

// In the file drop/select handler:
const { valid, oversized } = validateFiles(newFiles)

if (oversized.length > 0) {
  // Show warning but continue with valid files
  toast.error(
    `${oversized.length} file${oversized.length > 1 ? 's' : ''} skipped (over 10MB):\n${oversized.slice(0, 3).join('\n')}${oversized.length > 3 ? `\n…and ${oversized.length - 3} more` : ''}`,
    { duration: 6000 }
  )
}

// Only queue valid files
if (valid.length > 0) {
  setFiles(prev => [...prev, ...valid.map(f => ({
    id: crypto.randomUUID(),
    file: f,
    status: 'pending' as const,
  }))])
}
```

Also show the file size limit in the drop zone label:

```typescript
<p className="font-body text-xs" style={{ color: '...' }}>
  Max 100 files · 10MB per file · JPG, PNG, WEBP
</p>
```

---

## TASK 4 — Upload Progress Counter

In the Add Photos panel, show a live counter during upload:

```typescript
// Add to GalleryManager state:
const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)

// Pass a callback to UploadZone to update progress:
onProgress={(done, total) => setUploadProgress({ done, total })}

// In UploadZone, call this after each file finishes (success or failure):
onProgress?.(successCount + failCount, totalFiles)
```

Show in the panel header while uploading:

```typescript
{uploadProgress && uploadProgress.done < uploadProgress.total && (
  <div className="flex items-center gap-3 p-3 mb-2"
    style={{ background: 'var(--a-gold-light)', border: '1px solid var(--a-gold-border)' }}>
    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin shrink-0"
      style={{ borderColor: 'rgba(201,168,76,0.4)', borderTopColor: 'var(--a-gold)' }} />
    <p className="font-body text-sm font-medium" style={{ color: 'var(--a-gold)' }}>
      Uploading {uploadProgress.done} / {uploadProgress.total} photos…
    </p>
    <p className="font-body text-xs ml-auto" style={{ color: 'var(--a-text-muted)' }}>
      {Math.round((uploadProgress.done / uploadProgress.total) * 100)}%
    </p>
  </div>
)}
```

---

## COMPLETION CHECKLIST

- [ ] Each file in UploadZone shows its status: pending (grey dot) / uploading (spinner) / done (green ✓) / error (red ✗)
- [ ] Failed files show their filename + error reason in red
- [ ] After upload, "X uploaded, Y failed" toast shows
- [ ] Failed files list appears below UploadZone in Add Photos panel
- [ ] Failed file names are clearly listed so admin knows which ones to retry
- [ ] Tip text explains common failure reasons
- [ ] Files over 10MB are rejected before upload with a warning toast
- [ ] "Max 100 files · 10MB per file" shown in drop zone
- [ ] Live progress counter shows during upload (X / Y photos)
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Upload in batches of 5 parallel requests — not all 100 at once. This prevents rate limiting on Cloudinary and reduces network congestion.
- The `onPartialComplete` callback replaces `onComplete` for the gallery — it fires after ALL files have either succeeded or failed (not after each one). This is different from `onProgress` which fires after each file.
- File size validation happens client-side before any upload starts — oversized files are rejected immediately with a toast, never queued.
- The failed files list shows filenames so admin can identify them in their file system and try re-uploading. Common failure reasons: file too large, corrupted file, network timeout, Cloudinary rate limit.
- If the `UploadZone` is used in other places (blog cover, event image, CMS), the `onPartialComplete` prop is optional — existing usage with `onComplete` still works.
