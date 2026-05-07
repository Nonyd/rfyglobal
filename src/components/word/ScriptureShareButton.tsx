'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, MessageCircle, Link2, Loader2 } from 'lucide-react'
import { ScriptureShareCard } from './ScriptureShareCard'
import toast from 'react-hot-toast'

interface ScriptureShareButtonProps {
  scriptureId: string
  reference: string
  text: string
  translation: string
  compact?: boolean
}

export function ScriptureShareButton({
  scriptureId,
  reference,
  text,
  translation,
  compact = false,
}: ScriptureShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const downloadCard = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    setOpen(false)

    try {
      const html2canvas = (await import('html2canvas')).default

      // Avoid foreignObjectRendering — it often yields a solid black PNG on Windows Chrome/Edge.
      const el = cardRef.current
      const w = el.offsetWidth || 1080
      const h = el.offsetHeight || 1080

      const canvas = await html2canvas(el, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#F5F0E8',
        width: w,
        height: h,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      })

      const link = document.createElement('a')
      link.download = `rfy-word-${reference.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${scriptureId.slice(0, 6)}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Scripture card downloaded!')
    } catch (error) {
      console.error('Scripture card download failed', error)
      toast.error('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const shareToWhatsApp = () => {
    const message = `*${reference}*\n\n"${text}"\n\n- ${translation}\n\nDaily Word from Room For You\nrfyglobal.org/word`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    setOpen(false)
  }

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/word`
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
      setOpen(false)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <>
      <ScriptureShareCard ref={cardRef} reference={reference} text={text} translation={translation} />

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={downloading}
          className={
            compact
              ? 'flex items-center gap-2 border px-4 py-2 font-body text-[11px] uppercase tracking-widest transition-all'
              : 'flex items-center gap-2 border px-6 py-3 font-body text-xs uppercase tracking-widest transition-all'
          }
          style={{
            borderColor: 'rgba(201,168,76,0.4)',
            color: '#C9A84C',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {downloading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Share2 size={13} />
              Share
            </>
          )}
        </button>

        <AnimatePresence>
          {open ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 overflow-hidden"
                style={{
                  background: '#1A1A1A',
                  border: '1px solid rgba(201,168,76,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
              >
                {[
                  {
                    icon: <MessageCircle size={14} />,
                    label: 'WhatsApp',
                    sublabel: 'Share text to group',
                    action: shareToWhatsApp,
                    color: '#25D366',
                  },
                  {
                    icon: <Download size={14} />,
                    label: 'Download Card',
                    sublabel: 'Save as image (1080x1080)',
                    action: () => void downloadCard(),
                    color: '#C9A84C',
                  },
                  {
                    icon: <Link2 size={14} />,
                    label: 'Copy Link',
                    sublabel: 'rfyglobal.org/word',
                    action: () => void copyLink(),
                    color: 'rgba(248,248,248,0.6)',
                  },
                ].map((item, index, arr) => (
                  <button
                    type="button"
                    key={item.label}
                    onClick={item.action}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ borderBottom: index < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <div>
                      <p className="font-body text-xs font-medium" style={{ color: '#F8F8F8' }}>
                        {item.label}
                      </p>
                      <p className="font-body text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {item.sublabel}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  )
}
