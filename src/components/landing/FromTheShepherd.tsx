'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export function FromTheShepherd({ content }: { content: Record<string, string> }) {
  const portrait = content['shepherd.image']
  const portraitUrl = portrait.includes('cloudinary.com')
    ? portrait.replace('/upload/', '/upload/w_600,h_700,c_fill,f_auto,q_auto,g_face/')
    : portrait
  const isRemote = portraitUrl.startsWith('http')

  return (
    <section className="relative overflow-hidden bg-bg py-24">
      <div className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.12),transparent_65%)]" />
      <div className="relative z-10 grid items-stretch lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="relative min-h-[460px] w-full overflow-hidden"
        >
          {isRemote ? (
            <Image
              src={portraitUrl}
              alt={content['shepherd.name'] || 'Minister Yadah'}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 28rem"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitUrl} alt={content['shepherd.name'] || 'Minister Yadah'} className="h-full w-full object-cover" />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8 }}
          className="relative surface px-6 py-12 lg:px-14"
        >
          <div className="section-number absolute right-6 top-4 opacity-20">03</div>
          <p className="font-body text-[10px] uppercase tracking-[0.35em] text-gold">FROM THE SHEPHERD</p>
          <p className="mt-4 font-display text-3xl italic leading-relaxed text-text-primary md:text-4xl">
            <span>&ldquo;{content['shepherd.quote']}&rdquo;</span>
          </p>
          <div className="mt-10">
            <p className="font-display text-3xl text-gold md:text-4xl">{content['shepherd.name']}</p>
            <p className="mt-1 font-body text-xs uppercase tracking-[0.2em] text-text-muted">
              {content['shepherd.title']}
            </p>
            <div className="mt-3 h-px w-48 bg-gradient-to-r from-gold to-transparent" />
          </div>
          <Link
            href={content['shepherd.link']}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex font-body text-sm text-gold hover:text-gold-light"
          >
            Visit yadahworld.com →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
