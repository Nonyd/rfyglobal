'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

const CONFESSION_LINES = [
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

export function ConfessionPageClient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [showSparkle, setShowSparkle] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('.confession-line')

      lines.forEach((line, i) => {
        const isLast = i === lines.length - 1

        ScrollTrigger.create({
          trigger: line,
          start: 'top 60%',
          onEnter: () => {
            lines.slice(0, i).forEach((prev) => {
              gsap.to(prev, { opacity: 0.25, duration: 0.4 })
            })
            gsap.to(line, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out',
            })

            const intensity = (i + 1) / lines.length
            if (glowRef.current) {
              gsap.to(glowRef.current, {
                opacity: intensity * 0.4,
                duration: 0.8,
              })
            }

            if (isLast) {
              setShowSparkle(true)
              if (glowRef.current) {
                gsap.to(glowRef.current, {
                  opacity: 1,
                  scale: 1.5,
                  duration: 1.2,
                  ease: 'power2.out',
                })
              }
              gsap.to('.confession-container', {
                backgroundColor: 'rgba(201,168,76,0.05)',
                duration: 1,
              })
              gsap.to(line, {
                textShadow: '0 0 40px rgba(201,168,76,0.8)',
                repeat: 2,
                yoyo: true,
                duration: 0.6,
                delay: 0.3,
              })
            }
          },
          onLeaveBack: () => {
            if (isLast) setShowSparkle(false)
            if (i > 0) {
              gsap.to(lines[i - 1], { opacity: 1, duration: 0.3 })
            }
            gsap.to(line, { opacity: 0.15, duration: 0.3 })
          },
        })

        gsap.set(line, {
          opacity: i === 0 ? 0.15 : 0.05,
          y: 20,
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="confession-container relative bg-black">
      <div
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.15), transparent)',
          opacity: 0,
          transformOrigin: '50% 50%',
        }}
      />

      {showSparkle ? (
        <div
          className="pointer-events-none fixed inset-0 z-[5] animate-pulse-gold opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(201,168,76,0.4) 0, transparent 2px),
              radial-gradient(circle at 80% 20%, rgba(201,168,76,0.35) 0, transparent 2px),
              radial-gradient(circle at 50% 70%, rgba(201,168,76,0.3) 0, transparent 2px),
              radial-gradient(circle at 10% 80%, rgba(201,168,76,0.25) 0, transparent 2px),
              radial-gradient(circle at 90% 60%, rgba(201,168,76,0.3) 0, transparent 2px)`,
            backgroundSize: '100% 100%',
          }}
          aria-hidden
        />
      ) : null}

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-6 font-body text-[10px] uppercase tracking-[0.4em] text-gold/60">Room For You</p>
        <h1 className="mb-8 font-display text-5xl leading-none text-gold lg:text-7xl">The Confession</h1>
        <p className="font-body text-lg text-white/40">Scroll to declare.</p>
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <div className="h-16 w-px bg-gradient-to-b from-transparent to-gold/40" />
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
        </div>
      </section>

      <section className="relative z-10 min-h-screen py-32">
        <div className="mx-auto max-w-3xl space-y-24 px-6">
          {CONFESSION_LINES.map((line, i) => (
            <div
              key={i}
              className={cn(
                'confession-line text-center',
                i === CONFESSION_LINES.length - 1 && 'confession-last',
              )}
            >
              <p
                className="font-display leading-tight"
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                  color: '#FAFAFA',
                }}
              >
                {line}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-16 h-px w-48 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <p className="mb-4 font-display text-4xl leading-tight text-white lg:text-6xl">
          Make this your confession.
        </p>
        <p className="mb-12 max-w-md font-body text-white/40">
          There is a community waiting to grow with you. Step in — there is room for you.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/join"
            className="animate-pulse-gold bg-gold px-10 py-4 font-body text-sm font-medium uppercase tracking-widest text-black transition-all duration-300 hover:bg-gold-light"
          >
            Join the Community
          </Link>
          <Link
            href="/"
            className="border border-white/20 px-10 py-4 font-body text-sm uppercase tracking-widest text-white/60 transition-all duration-300 hover:border-gold/40 hover:text-white"
          >
            Back to Home
          </Link>
        </div>
        <div className="mt-16 h-px w-48 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <p className="mt-8 font-body text-xs tracking-wide text-white/20">
          rfyglobal.org · Room For You · A SonsHub Media Initiative
        </p>
      </section>
    </div>
  )
}
