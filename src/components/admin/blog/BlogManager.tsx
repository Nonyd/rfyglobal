'use client'

import { adminFetch } from '@/lib/admin-fetch'
import Link from 'next/link'
import { useState } from 'react'
import { Edit, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminToggle } from '@/components/shared/Toggle'
import { formatDate } from '@/lib/utils'
import { useBulkSelect } from '@/hooks/useBulkSelect'
import { SelectCheckbox } from '@/components/admin/shared/SelectCheckbox'
import { BulkActionBar } from '@/components/admin/shared/BulkActionBar'

type BlogPost = {
  id: string
  title: string
  slug: string
  isPublished: boolean
  publishedAt: Date | null
  createdAt: Date
  excerpt: string | null
}

export function BlogManager({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const bulk = useBulkSelect(posts)

  const patchPost = async (id: string, isPublished: boolean) => {
    const res = await adminFetch(`/api/blog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished }),
    })
    if (!res.ok) return false
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isPublished } : p)))
    return true
  }

  const removePost = async (id: string) => {
    const res = await adminFetch(`/api/blog/${id}`, { method: 'DELETE' })
    if (!res.ok) return false
    setPosts((prev) => prev.filter((p) => p.id !== id))
    return true
  }

  const bulkDelete = async () => {
    if (!bulk.selectedCount) return
    if (!confirm(`Delete ${bulk.selectedCount} post${bulk.selectedCount > 1 ? 's' : ''}?`)) return
    await Promise.all(bulk.selectedArray.map((id) => removePost(id)))
    toast.success(`${bulk.selectedCount} posts deleted`)
    bulk.reset()
  }

  const bulkPublish = async () => {
    await Promise.all(bulk.selectedArray.map((id) => patchPost(id, true)))
    toast.success(`${bulk.selectedCount} posts published`)
    bulk.reset()
  }

  const bulkUnpublish = async () => {
    await Promise.all(bulk.selectedArray.map((id) => patchPost(id, false)))
    toast.success(`${bulk.selectedCount} posts unpublished`)
    bulk.reset()
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="group relative border p-5 pl-12"
          style={{ background: 'var(--a-surface)', borderColor: 'var(--a-border)' }}
        >
          <div className="absolute left-4 top-4">
            <div
              className={bulk.isSelected(post.id) ? 'opacity-100' : 'opacity-0 transition-opacity group-hover:opacity-100'}
            >
              <SelectCheckbox checked={bulk.isSelected(post.id)} onChange={() => bulk.toggle(post.id)} />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--a-text)' }}>{post.title}</h3>
              {post.excerpt && <p className="line-clamp-1 font-body text-sm" style={{ color: 'var(--a-text-secondary)' }}>{post.excerpt}</p>}
              <p className="mt-2 font-body text-xs" style={{ color: 'var(--a-text-muted)' }}>
                {post.isPublished && post.publishedAt ? `Published ${formatDate(post.publishedAt)}` : `Created ${formatDate(post.createdAt)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AdminToggle checked={post.isPublished} onChange={() => void patchPost(post.id, !post.isPublished)} size="sm" />
              <Link href={`/blog/${post.slug}`} target="_blank"><Eye size={16} /></Link>
              <Link href={`/admin/blog/${post.id}/edit`}><Edit size={16} /></Link>
              <button type="button" onClick={() => void removePost(post.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        onDeselectAll={bulk.deselectAll}
        onSelectAll={bulk.selectAll}
        isAllSelected={bulk.isAllSelected}
        totalCount={posts.length}
        actions={[
          { label: 'Publish', onClick: () => void bulkPublish(), variant: 'primary' },
          { label: 'Unpublish', onClick: () => void bulkUnpublish(), variant: 'default' },
          { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => void bulkDelete(), variant: 'danger' },
        ]}
      />
    </div>
  )
}
