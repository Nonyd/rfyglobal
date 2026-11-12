import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ListenPlayer } from '@/components/media/ListenPlayer'
import { CopyLinkButton } from '@/components/media/CopyLinkButton'
import { db } from '@/lib/db'
import { getCmsSeoDefaults } from '@/lib/cms-metadata'
import { SITE_URL } from '@/lib/seo'
import { AUDIO_NOT_BROWSER_PLAYABLE, audioExtension } from '@/lib/audio-media'

// Admin edits call revalidatePath(`/listen/<slug>`); this is the fallback refresh.
export const revalidate = 60

type Props = { params: { slug: string } }

async function getTrack(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null
  return db.audioTrack.findUnique({
    where: { slug },
    select: { slug: true, title: true, description: true, url: true, mimeType: true, originalName: true, isPublished: true },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const track = await getTrack(params.slug)
  if (!track?.isPublished) return { title: 'Audio not available', robots: { index: false } }

  const seo = await getCmsSeoDefaults()
  const url = `${SITE_URL}/listen/${track.slug}`
  const description = track.description?.slice(0, 200) || 'Listen on Room For You.'
  return {
    title: track.title,
    description,
    // Shared by link only; keep these out of search results.
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: {
      title: `${track.title} | Room For You`,
      description,
      url,
      type: 'website',
      images: [{ url: seo.ogImage, width: 1200, height: 630, alt: track.title }],
      audio: [{ url: `${SITE_URL}${track.url}`, type: track.mimeType }],
    },
    twitter: { card: 'summary_large_image', title: track.title, description, images: [seo.ogImage] },
  }
}

export default async function ListenPage({ params }: Props) {
  const track = await getTrack(params.slug)
  if (!track) notFound()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-32 pb-24">
          {track.isPublished ? (
            <>
              <p className="label-text mb-4">Listen</p>
              <h1
                className="font-display text-snow font-bold mb-6 break-words"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.1 }}
              >
                {track.title}
              </h1>

              <div className="border border-ash bg-ink p-4 sm:p-6">
                <ListenPlayer slug={track.slug} src={track.url} type={track.mimeType} />
                {AUDIO_NOT_BROWSER_PLAYABLE.has(audioExtension(track.originalName)) && (
                  <p className="font-body text-xs text-mist mt-3">
                    If it does not play in your browser, download it and open it in your music app.
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-5">
                  <a
                    href={track.url}
                    download={track.originalName}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body border border-ash text-snow hover:border-gold transition-colors"
                  >
                    <Download size={14} /> Download
                  </a>
                  <CopyLinkButton />
                </div>
              </div>

              {track.description && (
                <p className="font-body text-mist mt-8 whitespace-pre-line leading-relaxed">{track.description}</p>
              )}
            </>
          ) : (
            <div className="text-center">
              <h1 className="font-display text-snow font-bold text-3xl mb-4">This audio is not available</h1>
              <p className="font-body text-mist mb-8">The link may have been turned off. Please check with whoever shared it.</p>
              <Link href="/" className="btn-primary">
                Go to the homepage
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
