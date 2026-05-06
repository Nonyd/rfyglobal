'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ShareCardProps = {
  open: boolean
  onClose: () => void
  reference: string
  text: string
  className?: string
}

export function ShareCard({ open, onClose, reference, text, className }: ShareCardProps) {
  const previewUrl = useMemo(() => {
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'https://rfyglobal.org'
    const u = new URL('/api/og/scripture', base)
    u.searchParams.set('reference', reference)
    u.searchParams.set('text', text.slice(0, 400))
    return u.toString()
  }, [reference, text])

  async function copyLink() {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}?verse=${encodeURIComponent(reference)}`
        : ''
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn('fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-6', className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-3xl border border-gold-subtle bg-black-soft p-6"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-white/70 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-display text-xl text-gold mb-4">Share this scripture</h2>
            <div className="overflow-hidden rounded border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="h-auto w-full bg-black" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyLink}
                className="border border-gold px-4 py-2 font-body text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-colors"
              >
                Copy page link
              </button>
              <a
                href={previewUrl}
                download={`${reference.replace(/\s+/g, '-')}.png`}
                className="inline-flex border border-white/20 px-4 py-2 font-body text-xs uppercase tracking-widest text-white/80 hover:border-gold hover:text-gold transition-colors"
              >
                Open image
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
