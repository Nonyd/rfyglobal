'use client'

import { adminFetch } from '@/lib/admin-fetch'
import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, Trash2 } from 'lucide-react'
import { AdminToggle } from '@/components/shared/Toggle'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    isPublished: boolean
    publishedAt: Date | null
    createdAt: Date
    excerpt?: string | null
  }
}

export function PostCard({ post }: PostCardProps) {
  const [isPublished, setIsPublished] = useState(post.isPublished)

  const togglePublish = async () => {
    const res = await adminFetch(`/api/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    })
    if (res.ok) {
      setIsPublished(!isPublished)
      toast.success(isPublished ? 'Post unpublished' : 'Post published')
    } else {
      toast.error('Failed to update post')
    }
  }

  const deletePost = async () => {
    if (!confirm(`Delete "${post.title}"?`)) return
    const res = await adminFetch(`/api/blog/${post.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Post deleted')
      window.location.reload()
    } else toast.error('Failed to delete')
  }

  const dateText = isPublished && post.publishedAt
    ? `Published ${formatDate(post.publishedAt)}`
    : `Created ${formatDate(post.createdAt)}`

  return (
    <div
      className="border transition-all duration-200 p-5"
      style={{
        background: 'var(--a-surface)',
        borderColor: isPublished ? 'var(--a-gold-border)' : 'var(--a-border)',
        boxShadow: 'var(--a-shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-lg font-semibold mb-1" style={{ color: 'var(--a-text)' }}>
              {post.title}
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 font-body tracking-widest uppercase"
              style={{
                background: isPublished ? 'var(--a-gold-light)' : 'var(--a-sidebar-hover)',
                color: isPublished ? 'var(--a-gold)' : 'var(--a-text-muted)',
                border: `1px solid ${isPublished ? 'var(--a-gold-border)' : 'var(--a-border)'}`,
              }}
            >
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          {post.excerpt && (
            <p className="font-body text-sm line-clamp-1 mb-2" style={{ color: 'var(--a-text-secondary)' }}>
              {post.excerpt}
            </p>
          )}
          <p className="font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
            {dateText}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AdminToggle
            checked={isPublished}
            onChange={() => void togglePublish()}
            size="sm"
            aria-label={isPublished ? 'Unpublish post' : 'Publish post'}
          />
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="p-2 transition-colors"
            style={{ color: 'var(--a-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-secondary)')}
          >
            <Eye size={16} />
          </Link>
          <Link
            href={`/admin/blog/${post.id}/edit`}
            className="p-2 transition-colors"
            style={{ color: 'var(--a-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-secondary)')}
          >
            <Edit size={16} />
          </Link>
          <button
            type="button"
            onClick={deletePost}
            className="p-2 transition-colors"
            style={{ color: 'var(--a-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-secondary)')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
