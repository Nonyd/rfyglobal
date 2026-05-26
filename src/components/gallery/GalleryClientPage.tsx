'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { GalleryImage } from '@prisma/client'

interface GalleryClientPageProps {
  images: GalleryImage[]
  cities: string[]
  months: string[]
}

const thumbnailUrl = (url: string) => url

const lightboxUrl = (url: string) => url

function formatMonth(month: string) {
  const [year, m] = month.split('-')
  return format(new Date(Number(year), Number(m) - 1, 1), 'MMMM yyyy')
}

export function GalleryClientPage({ images, cities, months }: GalleryClientPageProps) {
  const [activeCity, setActiveCity] = useState<string>('All')
  const [activeMonth, setActiveMonth] = useState<string>('All')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = useMemo(() => {
    return images.filter((img) => {
      const cityMatch = activeCity === 'All' || img.city === activeCity
      const monthMatch =
        activeMonth === 'All' ||
        (img.takenAt &&
          (() => {
            const d = new Date(img.takenAt!)
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === activeMonth
          })())
      return cityMatch && monthMatch
    })
  }, [images, activeCity, activeMonth])

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () =>
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + filtered.length) % filtered.length : null,
    )
  const nextImage = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % filtered.length : null))

  const currentImage = lightboxIndex !== null ? filtered[lightboxIndex] : null

  return (
    <div className="mx-auto max-w-7xl px-6">
      {(cities.length > 0 || months.length > 0) && (
        <div className="mb-12 space-y-4">
          {cities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <p className="mb-1 w-full text-center font-body text-xs uppercase tracking-widest text-text-muted">
                Filter by City
              </p>
              {['All', ...cities].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCity(c)}
                  className={cn(
                    'border px-4 py-2 font-body text-xs tracking-wide transition-all',
                    activeCity === c
                      ? 'border-crimson bg-crimson text-white shadow-soft'
                      : 'border-theme text-text-secondary hover:border-crimson/40 hover:text-text-primary',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {months.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              <p className="mb-1 w-full text-center font-body text-xs uppercase tracking-widest text-text-muted">
                Filter by Month
              </p>
              {['All', ...months].map((month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => setActiveMonth(month)}
                  className={cn(
                    'border px-4 py-2 font-body text-xs tracking-wide transition-all',
                    activeMonth === month
                      ? 'border-crimson/50 bg-crimson/15 text-crimson'
                      : 'border-theme text-text-secondary hover:border-crimson/40 hover:text-text-primary',
                  )}
                >
                  {month === 'All' ? 'All Time' : formatMonth(month)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(activeCity !== 'All' || activeMonth !== 'All') && (
        <p className="mb-8 text-center font-body text-sm text-text-muted">
          {filtered.length} photo{filtered.length !== 1 ? 's' : ''}
          {activeCity !== 'All' ? ` in ${activeCity}` : ''}
          {activeMonth !== 'All' ? ` · ${formatMonth(activeMonth)}` : ''}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-2xl italic text-text-muted">No photos found.</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {filtered.map((img, index) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (index % 9) * 0.05 }}
              className="group relative mb-4 cursor-pointer break-inside-avoid overflow-hidden"
              onClick={() => openLightbox(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openLightbox(index)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <Image
                src={thumbnailUrl(img.url)}
                alt={img.caption ?? img.eventName ?? 'Room For You'}
                width={600}
                height={400}
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {img.eventName ? (
                  <p className="font-display text-sm leading-tight text-white">{img.eventName}</p>
                ) : null}
                <div className="mt-1 flex items-center gap-3">
                  {img.city ? (
                    <span className="flex items-center gap-1 font-body text-xs text-crimson/70">
                      <MapPin size={10} /> {img.city}
                    </span>
                  ) : null}
                  {img.takenAt ? (
                    <span className="flex items-center gap-1 font-body text-xs text-white/40">
                      <Calendar size={10} /> {format(new Date(img.takenAt), 'MMM yyyy')}
                    </span>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && currentImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
            onClick={closeLightbox}
            onKeyDown={(e) => e.key === 'Escape' && closeLightbox()}
            role="presentation"
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-6 top-6 z-10 p-2 text-white/60 transition-colors hover:text-white"
            >
              <X size={24} />
            </button>

            {filtered.length > 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 z-10 border border-white/20 p-3 text-white/60 transition-all hover:border-crimson hover:text-crimson lg:left-8"
              >
                <ChevronLeft size={24} />
              </button>
            ) : null}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative mx-16 max-h-[80vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal
              tabIndex={-1}
            >
              <Image
                src={lightboxUrl(currentImage.url)}
                alt={currentImage.caption ?? currentImage.eventName ?? 'Room For You'}
                width={1200}
                height={800}
                className="max-h-[75vh] w-auto object-contain"
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
              {(currentImage.eventName || currentImage.city || currentImage.takenAt) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {currentImage.eventName ? (
                    <p className="font-display text-sm text-white">{currentImage.eventName}</p>
                  ) : null}
                  <div className="mt-1 flex items-center gap-3">
                    {currentImage.city ? (
                      <span className="flex items-center gap-1 font-body text-xs text-crimson/70">
                        <MapPin size={10} /> {currentImage.city}
                      </span>
                    ) : null}
                    {currentImage.takenAt ? (
                      <span className="font-body text-xs text-white/40">
                        {format(new Date(currentImage.takenAt), 'MMMM yyyy')}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </motion.div>

            {filtered.length > 1 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 z-10 border border-white/20 p-3 text-white/60 transition-all hover:border-crimson hover:text-crimson lg:right-8"
              >
                <ChevronRight size={24} />
              </button>
            ) : null}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-body text-xs text-white/30">
              {lightboxIndex + 1} / {filtered.length}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
