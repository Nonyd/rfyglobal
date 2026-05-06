'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const EASE = [0.25, 0.46, 0.45, 0.94] as const

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

const ACTIVITIES = [
  {
    number: '01',
    title: 'Monthly Meetings',
    desc: 'Physical gatherings across cities where the Word comes alive and community is built.',
  },
  {
    number: '02',
    title: 'Prayer',
    desc: "Corporate and personal prayer — we carry one another's burdens before the throne.",
  },
  {
    number: '03',
    title: 'Online Study',
    desc: 'Structured Bible study with weekly tasks and materials accessible to everyone.',
  },
  {
    number: '04',
    title: 'Mentorship',
    desc: 'One-on-one spiritual mentorship and counseling for growth and accountability.',
  },
  {
    number: '05',
    title: 'Counseling & Support',
    desc: "A safe community to receive support and walk through life's challenges together.",
  },
  {
    number: '06',
    title: 'Evangelical Outreach',
    desc: 'Foot evangelism and outreaches — taking the Gospel beyond the walls.',
  },
]

const CONFESSION_EXCERPT = `I am saved by grace through faith. I am justified and redeemed by the blood of Jesus. I have received mercy because of the sacrifice of Jesus on the cross. God's love has been shed abroad in my heart and I am sealed with the Holy Spirit. I am now a part of God's family! I am committed to learning the value of this family and I grow in both wisdom and stature. I am committed to study and prayers! I am saved and I get others saved. I am reconciled and I reconcile others. On account of me, many come to the knowledge of the Son. It's Jesus to nations — and I am a willing vessel! I live my life in honor of the one who died for me, till his return!`

export function AboutClient({ content }: { content: Record<string, string> }) {
  const portrait = content['about.yadah.image']
  const portraitUrl = portrait.includes('cloudinary.com')
    ? portrait.replace('/upload/', '/upload/w_600,h_700,c_fill,f_auto,q_auto,g_face/')
    : portrait
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
          Our Story
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
          <span className="block text-white">{content['about.hero.headline1']}</span>
          <span className="text-gradient-gold block italic">{content['about.hero.headline2']}</span>        </motion.h1>
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
            <p className="font-body text-lg leading-relaxed text-white/70">{content['about.vision.text']}</p>          </motion.div>

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
            <p className="font-display text-4xl leading-none text-white lg:text-5xl">
              {content['about.mission.heading']}
            </p>
            <p className="font-display text-lg italic text-gold/70">{content['about.mission.scripture']}</p>
            <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-white/50">
              {content['about.mission.text']}
            </p>          </motion.div>
        </div>
      </section>

      <section className="px-6 py-20" style={{ background: '#111111' }}>
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-16 text-center font-display text-3xl text-white lg:text-4xl"
          >
            What Room For You Looks Like
          </motion.h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ACTIVITIES.map((item, i) => (
              <motion.div
                key={item.number}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } },
                }}
                className="border border-white/10 p-6"
              >
                <p className="mb-4 font-display text-3xl text-gold/30">{item.number}</p>
                <h3 className="mb-2 font-display text-lg text-white">{item.title}</h3>
                <p className="font-body text-sm leading-relaxed text-white/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-12 font-display text-4xl italic text-gold lg:text-5xl"
          >
            We Declare
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
            className="mb-12 font-display text-xl leading-[1.9] text-white/80 lg:text-2xl"
            style={{ fontStyle: 'italic' }}
          >
            {CONFESSION_EXCERPT}
          </motion.p>
          <Link
            href="/confession"
            className="inline-flex items-center gap-2 font-body text-sm uppercase tracking-widest text-gold hover:underline"
          >
            Read the full confession →
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-20" style={{ background: '#0A0A0A' }}>
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-1/2"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 100% 50%, rgba(201,168,76,0.06), transparent)',
          }}
        />

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <p className="font-display mb-2 text-2xl italic text-gold">The Shepherd</p>
            <h2 className="font-display mb-1 text-4xl text-white lg:text-5xl">Minister Yadah</h2>
            <p className="mb-1 font-body text-[10px] uppercase tracking-[0.35em] text-gold/60">
              Founder · Room For You
            </p>
            <div className="mb-8 h-px w-24 bg-gold/50" />

            <div className="space-y-5 font-body text-base leading-relaxed text-white/65">
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
                Visit yadahworld.com →
              </Link>
              <Link
                href={content['about.yadah.musicLink']}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-sm uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
              >
                Listen to her music →
              </Link>            </div>
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
            />            <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-gradient-to-r from-gold/60 to-transparent" />
          </motion.div>
        </div>
      </section>

      <section className="bg-black px-6 py-24 text-center">
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
        <p className="mb-10 font-body text-white/50">{content['about.cta.subtext']}</p>        <Link
          href="/forms/join-room-for-you"
          className="inline-block bg-gold px-10 py-4 font-body text-sm font-medium uppercase tracking-widest text-black transition-all duration-300 hover:bg-gold-light"
        >
          Join the Community
        </Link>
        <div className="mx-auto mt-16 h-px max-w-xs bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </section>
    </div>
  )
}
