'use client'

import { useRef } from 'react'

/** Native audio player (works without JS); counts one play per page view on first play. */
export function ListenPlayer({ slug, src, type }: { slug: string; src: string; type: string }) {
  const counted = useRef(false)

  return (
    <audio
      controls
      preload="metadata"
      className="w-full"
      onPlay={() => {
        if (counted.current) return
        counted.current = true
        void fetch(`/api/media/${encodeURIComponent(slug)}/play`, { method: 'POST', keepalive: true }).catch(() => {})
      }}
    >
      <source src={src} type={type} />
      <a href={src}>Download the audio</a>
    </audio>
  )
}
