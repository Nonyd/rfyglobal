'use client'

import { adminFetch } from '@/lib/admin-fetch'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { RichTextEditor } from '@/components/admin/editor/RichTextEditor'
import { UploadZone } from '@/components/shared/UploadZone'
import { slugify } from '@/lib/utils'

interface BlogPostEditorProps {
  mode: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    slug: string
    excerpt?: string | null
    content: string
    coverImage?: string | null
    isPublished: boolean
  }
}

export function BlogPostEditor({ mode, initialData }: BlogPostEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? '')
  const [saving, setSaving] = useState(false)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (mode === 'create') setSlug(slugify(val))
  }

  const handleSave = async (isPublished: boolean) => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!content || content === '<p></p>') {
      toast.error('Content is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || undefined,
        content,
        coverImage: coverImage || undefined,
        isPublished,
      }

      const url = mode === 'create' ? '/api/blog' : `/api/blog/${initialData!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = (await res.json()) as {
          error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
        }
        const flat = err.error
        const msg =
          typeof flat === 'string'
            ? flat
            : flat?.formErrors?.[0] ??
              Object.values(flat?.fieldErrors ?? {})
                .flat()
                .filter(Boolean)[0] ??
              'Failed to save post'
        throw new Error(msg)
      }

      toast.success(mode === 'create' ? 'Post created!' : 'Post updated!')
      router.push('/admin/blog')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title…"
            className="w-full border-b-2 bg-transparent pb-3 font-display text-3xl transition-colors focus:outline-none"
            style={{
              color: 'var(--a-text)',
              borderColor: title ? 'var(--a-gold-border)' : 'var(--a-border)',
            }}
          />
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short excerpt (shown in blog listing)…"
            rows={2}
            className="w-full resize-none border px-4 py-3 font-body text-sm transition-colors focus:outline-none"
            style={{
              borderColor: 'var(--a-border)',
              background: 'var(--a-bg)',
              color: 'var(--a-text-secondary)',
            }}
          />
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your devotional…"
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4 border p-5" style={{ borderColor: 'var(--a-border)' }}>
            <h3 className="font-display text-base" style={{ color: 'var(--a-text)' }}>Post Settings</h3>
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-widest" style={{ color: 'var(--a-text-muted)' }}>
                URL Slug
              </label>
              <div className="flex items-center border transition-colors" style={{ borderColor: 'var(--a-border)' }}>
                <span className="border-r px-3 py-2.5 font-mono text-xs" style={{ borderColor: 'var(--a-border)', background: 'var(--a-bg)', color: 'var(--a-text-muted)' }}>
                  /blog/
                </span>
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                  }
                  className="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm focus:outline-none"
                  style={{ color: 'var(--a-text)' }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border p-5" style={{ borderColor: 'var(--a-border)' }}>
            <h3 className="font-display text-base" style={{ color: 'var(--a-text)' }}>Cover Image</h3>
            {coverImage ? (
              <div className="space-y-3">
                <Image
                  src={coverImage}
                  alt="Cover"
                  width={400}
                  height={200}
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="font-body text-xs text-red-brand/70 transition-colors hover:text-red-brand"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <UploadZone
                folder="blogCover"
                accept="image"
                preview
                label="Upload cover image (max 4MB)"
                onUploadComplete={(files) => {
                  const url = files[0]?.url
                  if (url) setCoverImage(url)
                  toast.success('Cover image uploaded')
                }}
                onUploadError={(err) => toast.error(`Upload failed: ${err.message}`)}
              />
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full border py-3 font-body text-sm transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--a-gold-border)', color: 'var(--a-gold)' }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full py-3 font-body text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: 'var(--a-gold)', color: 'var(--a-text-inverse)' }}
            >
              {saving ? 'Saving…' : 'Publish Post'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-2 font-body text-xs transition-colors"
              style={{ color: 'var(--a-text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
