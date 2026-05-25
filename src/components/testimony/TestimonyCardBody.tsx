'use client'

import { useId, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

/** Roughly four lines at text-sm — show "Read more" when body exceeds this. */
const CLAMP_CHAR_THRESHOLD = 240

type TestimonyCardBodyProps = {
  body: string
}

export function TestimonyCardBody({ body }: TestimonyCardBodyProps) {
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()

  const isLong = useMemo(() => body.trim().length > CLAMP_CHAR_THRESHOLD, [body])

  if (!isLong) {
    return (
      <p
        className="mb-4 font-body text-sm leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {body}
      </p>
    )
  }

  return (
    <div className="relative mb-4">
      <motion.div
        id={contentId}
        initial={false}
        animate={{ height: expanded ? 'auto' : '6.5rem' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p
          className="font-body text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {body}
        </p>
      </motion.div>

      {!expanded && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
          style={{
            background: `linear-gradient(to bottom, transparent, var(--color-bg, #FAF5EE))`,
          }}
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="group mt-2 inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest transition-colors"
        style={{ color: 'var(--color-accent, #8B0000)' }}
      >
        <span>{expanded ? 'Show less' : 'Read more'}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${expanded ? 'rotate-180' : 'group-hover:translate-y-0.5'}`}
          aria-hidden
        />
      </button>
    </div>
  )
}
