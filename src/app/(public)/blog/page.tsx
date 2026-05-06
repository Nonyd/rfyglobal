import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { PublicPageHeader, PublicPageShell } from '@/components/layout/PublicPageShell'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog & Devotionals — Room For You',
  description: 'Devotionals, teachings, and reflections from Room For You.',
}

const coverThumbnailUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_600,h_300,c_fill,f_auto,q_auto/')
    : url

export default async function BlogPage() {
  const posts = await db.post.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
    },
  })

  return (
    <PublicPageShell mainClassName="pb-20 md:pb-24">
      <PublicPageHeader eyebrow="Room For You" title="Devotionals" />

      <div className="mx-auto max-w-7xl px-6">
        {posts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-2xl italic text-text-muted">Devotionals coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rfy-card group block overflow-hidden transition-all duration-300 hover:border-gold/40 hover:shadow-elevated"
              >
                {post.coverImage && (
                  <div className="overflow-hidden">
                    <Image
                      src={coverThumbnailUrl(post.coverImage)}
                      alt={post.title}
                      width={600}
                      height={300}
                      priority={index < 3}
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="mb-2 font-display text-xl text-text-primary transition-colors group-hover:text-gold">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mb-4 line-clamp-2 font-body text-sm text-text-secondary">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="font-body text-xs tracking-wide text-gold/70">{formatDate(post.publishedAt)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicPageShell>
  )
}
