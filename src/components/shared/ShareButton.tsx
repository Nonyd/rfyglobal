'use client'

import { useState } from 'react'
import { Share2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ShareButtonProps {
  scriptureId: string
  reference: string
  compact?: boolean
}

export function ShareButton({ scriptureId, reference, compact }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://rfyglobal.org')
  const cardUrl = `${baseUrl}/api/og/scripture?id=${encodeURIComponent(scriptureId)}`
  const pageUrl = `${baseUrl}/word`
  const shareText = `"${reference}" — Room For You | rfyglobal.org`

  const shareOptions = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      action: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`,
          '_blank',
        ),
    },
    {
      label: 'Download Card',
      icon: Share2,
      action: async () => {
        try {
          const res = await fetch(cardUrl)
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${reference.replace(/\s+/g, '-')}-RFY.png`
          a.click()
          URL.revokeObjectURL(url)
        } catch {
          toast.error('Could not download card')
        }
      },
    },
    {
      label: 'Copy Link',
      icon: Share2,
      action: async () => {
        try {
          await navigator.clipboard.writeText(pageUrl)
          toast.success('Link copied')
        } catch {
          toast.error('Could not copy')
        }
      },
    },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 border border-white/20 text-white/50 font-body transition-all hover:border-gold/40 hover:text-gold',
          compact ? 'p-2' : 'px-5 py-2.5 text-sm tracking-widest uppercase',
        )}
      >
        <Share2 size={compact ? 14 : 16} />
        {!compact && 'Share'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full right-0 z-20 mb-2 w-48 border py-1"
            style={{ background: '#111', borderColor: 'rgba(201,168,76,0.3)' }}
          >
            {shareOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={async () => {
                  await Promise.resolve(opt.action())
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-body text-sm text-white/70 transition-colors hover:bg-gold/10 hover:text-white"
              >
                <opt.icon size={14} className="text-gold/60" />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
