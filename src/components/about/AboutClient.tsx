'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const EASE = [0.25, 0.46, 0.45, 0.94] as const

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

function aboutActivities(content: Record<string, string>) {
  return [1, 2, 3, 4, 5, 6].map((n) => ({
    number: String(n).padStart(2, '0'),
    title: content[`about.activities.${n}.title`] ?? '',
    desc: content[`about.activities.${n}.desc`] ?? '',
  }))
}

export function AboutClient({ content }: { content: Record<string, string> }) {
  const activities = aboutActivities(content)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = !mounted || resolvedTheme === 'dark'

  const rawImage = (content['about.yadah.image'] ?? '').trim()
  const fallbackPortrait = '/images/yadah-portrait.svg'
  const portrait = rawImage || fallbackPortrait

  /**
   * CMS uploads are usually https://res.cloudinary.com/.../image/upload/...
   * Apply light transforms for raster photos only. Skip for SVGs (optimizer/Cloudinary crop quirks).
   * Avoid `g_face` — it can fail when no face is detected, which breaks the image on the page.
   */
  const isRasterCloudinary =
    /^https?:\/\/res\.cloudinary\.com\//i.test(portrait) && !/\.svg(\?|#|$)/i.test(portrait.split('?')[0])

  const portraitUrl = isRasterCloudinary
    ? portrait.replace('/upload/', '/upload/w_600,h_700,c_fill,f_auto,q_auto/')
    : portrait

  const portraitUnoptimized = /\.svg(\?|#|$)/i.test(portraitUrl)
  const bioParagraphs = content['about.yadah.bio'].split(/\n\n+/).filter(Boolean)

  return (
    <div>
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-32 text-center">
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-6 font-body text-[10px] uppercase tracking-[0.4em] text-gold"
        >
          {content['about.hero.eyebrow'] || 'Our Story'}
        </motion.p>
        <motion.h1
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            ...fadeUp,
            show: {
              ...fadeUp.show,
              transition: { duration: 0.7, ease: EASE, delay: 0.1 },
            },
          }}
          className="mb-8 font-display leading-none"
          style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
        >
          <span className="block text-text-primary">{content['about.hero.headline1']}</span>
          <span className="text-gradient-gold block italic">{content['about.hero.headline2']}</span>
        </motion.h1>
        <div className="mx-auto h-px max-w-sm bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-2">
          <div
            className="absolute left-1/2 top-0 hidden bottom-0 w-px lg:block"
            style={{ background: 'rgba(201,168,76,0.2)' }}
          />

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="pb-12 lg:pb-0 lg:pr-16"
          >
            <p className="mb-6 font-body text-[10px] uppercase tracking-[0.4em] text-gold">The Vision</p>
            <p className="font-body text-lg leading-relaxed text-text-secondary">{content['about.vision.text']}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              ...fadeUp,
              show: {
                ...fadeUp.show,
                transition: { duration: 0.7, ease: EASE, delay: 0.15 },
              },
            }}
            className="lg:pl-16"
          >
            <p className="mb-6 font-body text-[10px] uppercase tracking-[0.4em] text-gold">The Mission</p>
            <p className="font-display text-4xl leading-none text-text-primary lg:text-5xl">
              {content['about.mission.heading']}
            </p>
            <p className="font-display text-lg italic text-gold/70">{content['about.mission.scripture']}</p>
            <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-text-secondary">
              {content['about.mission.text']}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-charcoal-soft px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-16 text-center font-display text-3xl text-text-primary lg:text-4xl"
          >
            {content['about.activities.heading'] || 'What Room For You Looks Like'}
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((item, i) => (
              <motion.div
                key={item.number}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } },
                }}
                className="rfy-card p-6"
              >
                <p className="mb-4 font-display text-3xl text-gold/30">{item.number}</p>
                <h3 className="mb-2 font-display text-lg text-text-primary">{item.title}</h3>
                <p className="font-body text-sm leading-relaxed text-text-secondary">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="px-6 py-24 text-center"
        style={{ background: isDark ? '#0F0F0F' : '#EDE7DB' }}
      >
        <div className="mx-auto max-w-3xl">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 font-display text-4xl italic text-gold lg:text-5xl"
          >
            {content['about.confession.heading'] || 'We Declare'}
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              ...fadeUp,
              show: {
                ...fadeUp.show,
                transition: { duration: 0.7, ease: EASE, delay: 0.1 },
              },
            }}
            className="mb-12 font-display text-xl leading-[1.9] lg:text-2xl"
            style={{
              fontStyle: 'italic',
              color: isDark ? 'rgba(248,248,248,0.7)' : '#2C2520',
            }}
          >
            {content['about.confession.text']}
          </motion.p>
          <Link
            href="/confession"
            className="inline-flex items-center gap-2 font-body text-sm uppercase tracking-widest text-gold hover:underline"
          >
            {content['about.confession.link'] || 'Read the full confession →'}
          </Link>
        </div>
      </section>

      <section
        className={cn('relative overflow-hidden px-6 py-20', isDark && 'bg-charcoal')}
        style={!isDark ? { background: '#E8E2D6' } : undefined}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-1/2"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 80% 60% at 100% 50%, rgba(201,168,76,0.06), transparent)'
              : 'radial-gradient(ellipse 80% 60% at 100% 50%, rgba(139,90,0,0.05), transparent)',
          }}
        />

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <p className="font-display mb-2 text-2xl italic text-gold">
              {content['about.shepherd.heading'] || 'The Shepherd'}
            </p>
            <h2
              className="font-display mb-1 text-4xl lg:text-5xl"
              style={{ color: isDark ? '#F5F0E8' : '#0F0C08' }}
            >
              {content['about.shepherd.name'] || 'Minister Yadah'}
            </h2>
            <p className="mb-1 font-body text-[10px] uppercase tracking-[0.35em] text-gold/60">
              {content['about.shepherd.role'] || 'Founder · Room For You'}
            </p>
            <div className="mb-8 h-px w-24 bg-gold/50" />

            <div
              className="space-y-5 font-body text-base leading-relaxed"
              style={{ color: isDark ? 'rgba(245,240,232,0.8)' : '#3D3530' }}
            >
              {bioParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="https://yadahworld.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-sm uppercase tracking-widest text-gold hover:underline"
              >
                {content['about.shepherd.websiteLink'] || 'Visit yadahworld.com →'}
              </Link>
              <Link
                href={content['about.yadah.musicLink']}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-sm uppercase tracking-widest transition-colors hover:underline"
                style={{
                  color: isDark ? 'rgba(245,240,232,0.5)' : '#7A7066',
                }}
              >
                {content['about.shepherd.musicLinkLabel'] || 'Listen to her music →'}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-2 border border-gold/10" />
            <Image
              src={portraitUrl}
              alt="Minister Yadah — Founder of Room For You"
              width={600}
              height={700}
              className="relative z-10 h-[500px] w-full object-cover lg:h-[600px]"
              priority
              unoptimized={portraitUnoptimized}
            />
            <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-gradient-to-r from-gold/60 to-transparent" />
          </motion.div>
        </div>
      </section>

      <section className="surface px-6 py-24 text-center">
        <div className="mx-auto mb-16 h-px max-w-xs bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="font-display mb-4 text-4xl leading-none italic text-gold lg:text-6xl"
        >
          {content['about.cta.headline']}
        </motion.p>
        <p className="mb-10 font-body text-text-secondary">{content['about.cta.subtext']}</p>
        <Link
          href="/join"
          className="inline-block bg-gold px-10 py-4 font-body text-sm font-medium uppercase tracking-widest text-black transition-all duration-300 hover:bg-gold-light"
        >
          {content['about.cta.button'] || 'Join the Community'}
        </Link>
        <div className="mx-auto mt-16 h-px max-w-xs bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </section>
    </div>
  )
}
