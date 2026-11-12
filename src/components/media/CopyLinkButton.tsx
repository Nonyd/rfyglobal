'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'

/** Shares the current page with the native share sheet, or copies its URL. */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false)

  const onClick = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url })
        return
      } catch {
        /* cancelled or unsupported: fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body border border-ash text-snow hover:border-gold transition-colors"
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />} {copied ? 'Link copied' : 'Share'}
    </button>
  )
}
