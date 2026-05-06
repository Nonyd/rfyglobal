import Link from 'next/link'
import { Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { PostCard } from '@/components/admin/blog/PostCard'

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      publishedAt: true,
      createdAt: true,
      excerpt: true,
    },
  })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-white">Blog & Devotionals</h2>
          <p className="mt-1 font-body text-sm text-white/40">{posts.length} posts total</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-2 bg-gold px-5 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-gold-light"
        >
          <Plus size={16} /> New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div
          className="border border-dashed py-24 text-center"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}
        >
          <p className="font-display text-2xl italic text-white/30">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
