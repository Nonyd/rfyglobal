import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/layout/PublicPageShell'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const coverFullUrl = (url: string) =>
  url.includes('cloudinary.com')
    ? url.replace('/upload/', '/upload/w_900,h_450,c_fill,f_auto,q_auto/')
    : url

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await db.post.findFirst({
    where: { slug: params.slug, isPublished: true },
  })
  return {
    title: post ? `${post.title} — Room For You` : 'Post',
    description: post?.excerpt ?? undefined,
    openGraph: post?.coverImage ? { images: [post.coverImage] } : undefined,
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await db.post.findFirst({
    where: { slug: params.slug, isPublished: true },
  })

  if (!post) notFound()

  return (
    <PublicPageShell mainClassName="pb-20 pt-6 md:pb-24">
      <article className="mx-auto max-w-3xl px-6 pt-20 md:pt-24">
        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-2 font-body text-sm text-gold/70 transition-colors hover:text-gold"
        >
          ← Back to Devotionals
        </Link>

        <header className="mb-10">
          {post.publishedAt && (
            <p className="mb-4 font-body text-[10px] uppercase tracking-[0.35em] text-gold/80">
              {formatDate(post.publishedAt)}
            </p>
          )}
          <h1 className="mb-4 font-display text-4xl leading-tight text-text-primary lg:text-5xl">{post.title}</h1>
          {post.excerpt && (
            <p className="font-body text-lg leading-relaxed text-text-secondary">{post.excerpt}</p>
          )}
          <div className="mt-8 h-px bg-gradient-to-r from-gold/50 to-transparent" />
        </header>

        {post.coverImage && (
          <Image
            src={coverFullUrl(post.coverImage)}
            alt={post.title}
            width={900}
            height={450}
            priority
            className="mb-10 h-72 w-full object-cover shadow-soft"
          />
        )}

        <div className="prose-rfy prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="mt-16 border-t border-gold/20 pt-8 text-center">
          <p className="font-body text-sm text-text-muted">Room For You · rfyglobal.org</p>
          <Link href="/blog" className="mt-4 inline-block font-body text-sm text-gold hover:underline">
            Read more devotionals →
          </Link>
        </div>
      </article>
    </PublicPageShell>
  )
}
