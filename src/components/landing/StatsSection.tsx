'use client'

import { useEffect, useRef, useState } from 'react'

function useCountUp(target: number, active: boolean, duration = 2000) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return

    let start: number | null = null
    let frame: number

    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])

  return value
}

function StatItem({
  number,
  suffix,
  label,
  active,
}: {
  number: string
  suffix: string
  label: string
  active: boolean
}) {
  const numericTarget = parseInt(number.replace(/\D/g, ''), 10) || 0
  const count = useCountUp(numericTarget, active)

  return (
    <div className="text-center">
      <p
        className="font-display font-bold leading-none mb-2"
        style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: 'var(--color-text-primary)' }}
      >
        {count}
        <span style={{ color: 'var(--color-accent)' }}>{suffix}</span>
      </p>
      <p
        className="font-body uppercase"
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </p>
    </div>
  )
}

export function StatsSection({ content }: { content: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const stats = [1, 2, 3, 4].map((i) => ({
    number: content[`stats.stat${i}.number`] || '0',
    suffix: content[`stats.stat${i}.suffix`] || '',
    label: content[`stats.stat${i}.label`] || '',
  }))

  return (
    <section
      ref={ref}
      className="reveal py-20 px-6"
      style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
        {stats.map((stat, i) => (
          <StatItem key={i} {...stat} active={active} />
        ))}
      </div>
    </section>
  )
}
