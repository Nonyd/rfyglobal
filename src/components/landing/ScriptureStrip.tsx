'use client'

import { useEffect, useState } from 'react'
import { AudioPlayer } from '@/components/shared/AudioPlayer'
import { ShareButton } from '@/components/shared/ShareButton'
import { motion } from 'framer-motion'

export function ScriptureStrip() {
  const [scripture, setScripture] = useState<{
    id: string
    reference: string
    text: string
    translation: string
    audioUrl?: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/scripture/today')
      .then((r) => r.json())
      .then(setScripture)
      .catch(() =>
        setScripture({
          id: 'fallback',
          reference: '2 Corinthians 5:17',
          text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
          translation: 'NIV',
        })
      )
  }, [])

  if (!scripture) return <div className="h-64" style={{ background: 'rgb(var(--color-surface))' }} />

  return (
    <section className="py-24 px-6" style={{ background: 'rgb(var(--color-surface))' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto text-center"
      >
        <p
          className="label-text mb-6 opacity-60"
          style={{ color: 'rgb(var(--color-text-muted))' }}
        >
          {scripture.translation}
        </p>

        <p className="font-display text-gold text-2xl lg:text-3xl mb-6">
          {scripture.reference}
        </p>

        <div className="gold-line max-w-[120px] mx-auto mb-8 opacity-40" />

        <blockquote
          className="font-display text-xl lg:text-2xl italic leading-relaxed mb-10"
          style={{ color: 'rgb(var(--color-text-primary))' }}
        >
          &ldquo;{scripture.text}&rdquo;
        </blockquote>

        <div className="flex flex-col items-center gap-4">
          {scripture.audioUrl && (
            <AudioPlayer src={scripture.audioUrl} className="w-full max-w-sm" />
          )}
          <ShareButton
            scriptureId={scripture.id}
            reference={scripture.reference}
          />
        </div>
      </motion.div>
    </section>
  )
}
