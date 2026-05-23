'use client'

import { useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const LINES = [
  'I am saved by grace through faith.',
  'I am justified and redeemed by the blood of Jesus.',
  'I have received mercy because of the sacrifice of Jesus on the cross.',
  "God's love has been shed abroad in my heart",
  'and I am sealed with the Holy Spirit.',
  "I am now a part of God's family!",
  'I am committed to learning the value of this family',
  'and I grow in both wisdom and stature.',
  'I am committed to study and prayers!',
  'I am saved and I get others saved.',
  'I am reconciled and I reconcile others.',
  'On account of me, many come to the knowledge of the Son.',
  "It's Jesus to nations —",
  'and I am a willing vessel!',
  'I live my life in honor of the one who died for me,',
  'till his return!',
]

export function ConfessionRevealClient() {
  const sectionRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([])

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const section = sectionRef.current
    const glow = glowRef.current
    const items = lineRefs.current.filter((n): n is HTMLParagraphElement => Boolean(n))
    if (!section || items.length === 0) return

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0.28, y: 18, scale: 0.98 })
      if (glow) gsap.set(glow, { opacity: 0, scale: 0.85 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.max(2200, items.length * 140)}`,
          pin: true,
          scrub: 0.85,
          anticipatePin: 1,
        },
      })

      items.forEach((el, i) => {
        if (i > 0) {
          tl.to(
            items[i - 1],
            { opacity: 0.4, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' },
            '>',
          )
        }
        tl.to(
          el,
          {
            opacity: 1,
            y: 0,
            scale: i === items.length - 1 ? 1.08 : 1.04,
            duration: 0.55,
            ease: 'power2.out',
          },
          '>',
        )
      })

      if (glow) {
        tl.to(glow, { opacity: 1, scale: 1.35, duration: 0.9, ease: 'power2.out' }, '>-0.1')
      }
    }, section)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6 py-24"
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(139,0,0,0.12) 0%, transparent 55%)',
        }}
      />
      <div className="section-number absolute left-8 top-8 opacity-20">02</div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <p className="mb-10 font-body text-[10px] uppercase tracking-[0.35em] text-crimson">The confession</p>
        <div className="space-y-4">
          {LINES.map((line, i) => (
            <p
              key={`${i}-${line}`}
              ref={(el) => {
                lineRefs.current[i] = el
              }}
              className={`font-display leading-snug md:text-xl ${
                i === LINES.length - 1
                  ? 'text-crimson-gradient text-3xl'
                  : 'text-lg border-l-2 border-crimson pl-3 text-text-primary'
              }`}
              style={{ opacity: i < LINES.length - 1 ? undefined : 1 }}
            >
              {line}
            </p>
          ))}
        </div>
        <Link
          href="/confession"
          className="mt-14 inline-block border border-crimson bg-crimson px-8 py-3 font-body text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-crimson-bright"
        >
          Make This Your Confession
        </Link>
      </div>
    </section>
  )
}
