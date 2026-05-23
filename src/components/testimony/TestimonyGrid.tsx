'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { format } from 'date-fns'

export interface TestimonyData {
  id: string
  name: string | null
  isAnonymous: boolean
  title: string
  body: string | null
  imageUrls: unknown
  videoUrl: string | null
  isFeatured: boolean
  publishedAt: Date | string | null
}

export function TestimonyGrid({ testimonies }: { testimonies: TestimonyData[] }) {
  const getImages = (imageUrls: unknown): string[] => {
    if (!imageUrls) return []
    try {
      return Array.isArray(imageUrls) ? imageUrls : JSON.parse(imageUrls as string)
    } catch {
      return []
    }
  }

  const getVideoEmbed = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.includes('youtu.be')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.includes('vimeo.com')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return null
  }

  if (testimonies.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="font-display text-snow text-2xl mb-3">Testimonies are coming.</p>
        <p className="font-body text-mist">Check back soon — God is at work in this community.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 pt-12">
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {testimonies.map((t, i) => {
          const images = getImages(t.imageUrls)
          const embedUrl = t.videoUrl ? getVideoEmbed(t.videoUrl) : null
          const displayName = t.isAnonymous ? 'Anonymous' : (t.name ?? 'Community Member')

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3) }}
              className="break-inside-avoid border overflow-hidden"
              style={{
                borderColor: t.isFeatured ? 'rgba(139,0,0,0.4)' : 'rgba(255,255,255,0.08)',
                background: t.isFeatured ? 'rgba(139,0,0,0.03)' : 'rgba(255,255,255,0.02)',
              }}
            >
              {t.isFeatured && (
                <div
                  className="flex items-center gap-1.5 px-4 py-2 border-b"
                  style={{ borderColor: 'rgba(139,0,0,0.2)', background: 'rgba(139,0,0,0.08)' }}
                >
                  <Star size={11} className="text-crimson fill-gold" />
                  <p className="label-text text-[10px]">Featured Testimony</p>
                </div>
              )}

              {embedUrl && (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    title={t.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {t.videoUrl && !embedUrl && (
                <video
                  src={t.videoUrl}
                  controls
                  className="w-full"
                  style={{ maxHeight: '300px', background: '#0F0F0F' }}
                />
              )}

              {images.length > 0 && (
                <div className={`grid ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5`}>
                  {images.slice(0, 4).map((url, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden">
                      <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                      {images.length > 4 && idx === 3 && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'rgba(0,0,0,0.7)' }}
                        >
                          <p className="font-display text-white text-xl font-bold">+{images.length - 4}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-5">
                <h3 className="font-display text-snow text-lg font-semibold mb-2 leading-tight">{t.title}</h3>
                {t.body && (
                  <p className="font-body text-mist text-sm leading-relaxed mb-4 line-clamp-4">{t.body}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-body text-xs" style={{ color: '#585858' }}>
                    — {displayName}
                  </p>
                  {t.publishedAt && (
                    <p className="font-body text-xs" style={{ color: '#585858' }}>
                      {format(new Date(t.publishedAt), 'MMM yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
