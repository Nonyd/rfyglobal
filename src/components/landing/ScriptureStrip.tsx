'use client'

import { useEffect, useState } from 'react'
import type { ScriptureTodayResponse } from '@/types'
import { AudioPlayer } from '@/components/shared/AudioPlayer'
import { ShareButton } from '@/components/shared/ShareButton'

const fallback: ScriptureTodayResponse = {
  id: 'fallback',
  reference: '2 Corinthians 5:17',
  text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
  translation: 'NIV',
  audioUrl: null,
}

export function ScriptureStrip() {
  const [data, setData] = useState<ScriptureTodayResponse>(fallback)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/scripture/today')
        if (!res.ok) throw new Error('bad response')
        const json = (await res.json()) as ScriptureTodayResponse & { error?: string }
        if (json.error || !json.reference || !json.text) throw new Error('invalid')
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setData(fallback)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const scriptureId = data.id ?? 'fallback'

  return (
    <section className="border-y border-gold-subtle/80 bg-charcoal py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="font-display text-2xl text-gold md:text-3xl">{data.reference}</p>
        <p className="mt-6 font-display text-xl italic leading-relaxed text-cream/95 md:text-2xl">
          {data.text}
        </p>
        <p className="mt-4 font-body text-xs uppercase tracking-widest text-cream/45">
          {data.translation}
        </p>
        {data.audioUrl ? (
          <div className="mx-auto mt-10 max-w-xl">
            <AudioPlayer src={data.audioUrl} />
          </div>
        ) : null}
        <div className="mt-10 flex justify-center">
          <ShareButton scriptureId={scriptureId} reference={data.reference} />
        </div>
      </div>
    </section>
  )
}
