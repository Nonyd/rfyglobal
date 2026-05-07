'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'

const words = [
  { text: 'THERE IS', delay: 0.2 },
  { text: 'ROOM', style: 'text-gold-gradient', delay: 0.5 },
  { text: 'FOR YOU.', delay: 0.8 },
]

export function Hero() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <section className="relative min-h-screen bg-void overflow-hidden flex flex-col">
      <Navbar />

      <div
        className="absolute pointer-events-none animate-breathe"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139,90,0,0.05) 0%, transparent 70%)',
          top: '50%',
          right: '10%',
          transform: 'translateY(-50%)',
        }}
      />

      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none hidden lg:block">
        <div className="absolute inset-0 cinematic-overlay z-10" />
        <Image
          src="/images/yadah-portrait.jpg"
          alt=""
          fill
          className="object-cover object-top opacity-30"
          priority
        />
      </div>

      <div className="relative z-10 flex flex-col justify-center flex-1 px-6 lg:px-16 xl:px-24 pt-28 pb-20 max-w-7xl mx-auto w-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="label-text mb-10"
        >
          Worship · Prayer · Study · Community
        </motion.p>

        <div className="space-y-2 mb-12">
          {words.map((word, i) => (
            <motion.h1
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: word.delay, ease: [0.16, 1, 0.3, 1] }}
              className={`font-display font-bold leading-none ${
                i === 0 ? (isDark ? 'text-outline' : 'text-outline-gold') : word.style ?? ''
              }`}
              style={{
                fontSize: 'clamp(4rem, 11vw, 10rem)',
                ...(i === 2 ? { color: isDark ? '#F8F8F8' : '#0F0C08' } : {}),
              }}
            >
              {word.text}
            </motion.h1>
          ))}
        </div>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="gold-line-left w-48 mb-10 origin-left"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="font-body text-mist text-lg leading-relaxed max-w-lg mb-12"
          style={{ color: isDark ? '#A0A0A0' : '#3D3530' }}
        >
          A community of young men and women singing songs of salvation,
          studying the Word, and getting others saved.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="flex flex-wrap gap-4"
        >
          <Link
            href="/join"
            className="inline-flex items-center px-8 py-4 bg-gold text-void font-body text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-gold-bright transition-all duration-300"
          >
            Join the Community
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-8 py-4 border border-ash text-mist font-body text-[11px] tracking-[0.2em] uppercase hover:border-gold hover:text-gold transition-all duration-300"
          >
            Our Story
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-10 left-6 lg:left-16 xl:left-24 flex items-center gap-8"
        >
          {[
            { value: '100M+', label: 'Streams' },
            { value: '600K+', label: 'Followers' },
            { value: 'Nations', label: 'Jesus to' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span
                className="font-display text-snow text-xl font-semibold"
                style={{ color: isDark ? '#F8F8F8' : '#0F0C08' }}
              >
                {stat.value}
              </span>
              <span className="label-text opacity-60">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 right-10 hidden lg:flex flex-col items-center gap-2"
      >
        <div
          className="w-px h-16 opacity-40"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom, transparent, #C9A84C)'
              : 'linear-gradient(to bottom, transparent, #8B5A00)',
          }}
        />
        <div className="w-1 h-1 rounded-full bg-gold animate-pulse" />
      </motion.div>
    </section>
  )
}
