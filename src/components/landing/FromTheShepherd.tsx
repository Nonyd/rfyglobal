'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export function FromTheShepherd({ content }: { content: Record<string, string> }) {
  const portraitUrl =
    content['shepherd.portrait'] || content['shepherd.image'] || null

  return (
    <section className="relative bg-void py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-24 items-center">
        {/* Left — content (3 cols) */}
        <div className="lg:col-span-3">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="label-text mb-10"
          >
            From the Shepherd
          </motion.p>

          <motion.blockquote
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-snow italic mb-10"
            style={{ fontSize: 'clamp(1.3rem, 3vw, 2.2rem)', lineHeight: '1.5' }}
          >
            &ldquo;{content['shepherd.quote'] || 'There is room for you here.'}&rdquo;
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="gold-line-left w-16 mb-6 opacity-60" />
            <p className="font-display text-2xl text-gold mb-1">
              {content['shepherd.name'] || 'Minister Yadah'}
            </p>
            <p className="label-text opacity-50 mb-8">
              {content['shepherd.title'] || 'Founder · Room For You'}
            </p>
            <Link
              href={content['shepherd.link'] || 'https://yadahworld.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[11px] tracking-[0.2em] uppercase text-gold hover:opacity-70 transition-opacity"
            >
              Visit yadahworld.com →
            </Link>
          </motion.div>
        </div>

        {/* Right — portrait image (2 cols) */}
        {portraitUrl ? (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: '3/4',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              <Image
                src={portraitUrl}
                alt="Minister Yadah"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(15,15,15,0.6), transparent)',
                }}
              />
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}
