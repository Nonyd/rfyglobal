'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, Trash2, Globe, EyeOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
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
    const res = await fetch(`/api/blog/${post.id}`, {
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
    const res = await fetch(`/api/blog/${post.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Post deleted')
      window.location.reload()
    } else toast.error('Failed to delete')
  }

  return (
    <div
      className={cn(
        'border p-5 transition-all',
        isPublished ? 'border-gold/25 bg-gold/[0.06]' : 'border-white/10'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-lg text-white">{post.title}</h3>
            <span
              className={cn(
                'px-2 py-0.5 font-body text-[10px] uppercase tracking-widest',
                isPublished ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/40'
              )}
            >
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          {post.excerpt && (
            <p className="mt-1 line-clamp-1 font-body text-sm text-white/40">{post.excerpt}</p>
          )}
          <p className="mt-1 font-body text-xs text-white/25">
            {isPublished && post.publishedAt
              ? `Published ${formatDate(post.publishedAt)}`
              : `Created ${formatDate(post.createdAt)}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={togglePublish}
            className="p-2 text-white/40 transition-colors hover:text-gold"
            title={isPublished ? 'Unpublish' : 'Publish'}
          >
            {isPublished ? <Globe size={16} className="text-gold" /> : <EyeOff size={16} />}
          </button>
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="p-2 text-white/40 transition-colors hover:text-gold"
          >
            <Eye size={16} />
          </Link>
          <Link
            href={`/admin/blog/${post.id}/edit`}
            className="p-2 text-white/40 transition-colors hover:text-white"
          >
            <Edit size={16} />
          </Link>
          <button
            type="button"
            onClick={deletePost}
            className="p-2 text-white/40 transition-colors hover:text-red-brand"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
