'use client'

import { useState } from 'react'
import { AudioPlayer } from '@/components/shared/AudioPlayer'
import { ShareButton } from '@/components/shared/ShareButton'
import { cn, formatDate } from '@/lib/utils'
import type { Scripture } from '@prisma/client'

interface WordClientPageProps {
  today: Scripture | null
  allScriptures: Scripture[]
}

export function WordClientPage({ today, allScriptures }: WordClientPageProps) {
  const [view, setView] = useState<'today' | 'archive'>('today')

  return (
    <div className="mx-auto max-w-4xl px-6">
      <div className="mb-12 flex justify-center gap-2">
        {(['today', 'archive'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              'rfy-focus border px-6 py-2 font-body text-sm uppercase tracking-[0.2em] transition-all',
              view === v
                ? 'border-gold bg-gold text-charcoal shadow-soft'
                : 'border-theme text-text-muted hover:border-gold/40 hover:text-text-primary',
            )}
          >
            {v === 'today' ? "Today's Word" : 'Archive'}
          </button>
        ))}
      </div>

      {view === 'today' ? (
        <div className="mx-auto max-w-2xl">
          {today ? (
            <div className="space-y-8">
              <div className="text-center">
                <span className="font-body text-[10px] uppercase tracking-[0.35em] text-gold/80">
                  {today.translation}
                </span>
                <h2 className="mt-2 font-display text-3xl text-gold lg:text-4xl">{today.reference}</h2>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

              <blockquote className="text-center font-display text-xl italic leading-relaxed text-text-primary lg:text-2xl">
                &ldquo;{today.text}&rdquo;
              </blockquote>

              <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

              {today.audioUrl ? (
                <div className="space-y-3">
                  <p className="text-center font-body text-xs uppercase tracking-widest text-text-muted">
                    Audio Explanation
                  </p>
                  <AudioPlayer src={today.audioUrl} />
                </div>
              ) : null}

              <div className="flex justify-center pt-4">
                <ShareButton scriptureId={today.id} reference={today.reference} />
              </div>
            </div>
          ) : (
            <div className="py-24 text-center">
              <p className="font-display text-2xl italic text-text-muted">No scripture for today yet.</p>
              <p className="mt-2 font-body text-sm text-text-muted/80">Check back soon.</p>
            </div>
          )}
        </div>
      ) : null}

      {view === 'archive' ? (
        <div className="space-y-4">
          {allScriptures.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl italic text-text-muted">No scriptures yet.</p>
            </div>
          ) : (
            allScriptures.map((s) => (
              <div
                key={s.id}
                className="rfy-card p-6 transition-colors hover:border-gold/35"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="font-display text-lg text-gold">{s.reference}</span>
                      <span className="font-body text-[10px] uppercase tracking-widest text-text-muted">
                        {s.translation}
                      </span>
                      {s.scheduledAt ? (
                        <span className="font-body text-[10px] text-gold/50">{formatDate(s.scheduledAt)}</span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 font-body text-sm italic leading-relaxed text-text-secondary">
                      &ldquo;{s.text}&rdquo;
                    </p>
                    {s.audioUrl ? (
                      <div className="mt-4">
                        <AudioPlayer src={s.audioUrl} />
                      </div>
                    ) : null}
                  </div>
                  <ShareButton scriptureId={s.id} reference={s.reference} compact />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
