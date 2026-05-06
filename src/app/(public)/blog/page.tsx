import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog & Devotionals — Room For You',
  description: 'Devotionals, teachings, and reflections from Room For You.',
}

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
    <>
      <Navbar />
      <main className="min-h-screen bg-black pb-16 pt-24">
        <div className="mx-auto mb-16 max-w-7xl px-6 text-center">
          <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-gold">Room For You</p>
          <h1 className="mb-4 font-display text-4xl text-white lg:text-6xl">Devotionals</h1>
          <div className="mx-auto h-px max-w-xs bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          {posts.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl italic text-white/30">Devotionals coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block border border-white/10 transition-all duration-300 hover:border-gold/30"
                >
                  {post.coverImage && (
                    <div className="overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        width={600}
                        height={300}
                        priority={index < 3}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="mb-2 font-display text-xl text-white transition-colors group-hover:text-gold">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mb-4 line-clamp-2 font-body text-sm text-white/50">{post.excerpt}</p>
                    )}
                    {post.publishedAt && (
                      <p className="font-body text-xs tracking-wide text-gold/60">
                        {formatDate(post.publishedAt)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
