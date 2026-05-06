# ROOM FOR YOU — Phase 10 Cursor Prompt
## Complete Fresh Redesign — Cinematic · Clean · Immersive

---

## CONTEXT

This is a complete visual reset of the public-facing website. Every landing page section, the navbar, and the footer are rebuilt from scratch. The design language is: **Apple-level minimal, cinematic, immersive**. Deep soft black, Cormorant Garamond elegance, General Sans clarity, gold used like light — sparingly and intentionally.

**Design principles for this phase:**
- Full-screen sections — each one is its own world
- Typography IS the design — no decorative noise
- Silence and space — generous whitespace, nothing fights for attention
- Gold appears like light breaking through — never decorative, always meaningful
- Transitions feel like scenes changing, not pages scrolling

**What this phase replaces:**
Every component inside `src/components/landing/` is rewritten. The Navbar and Footer are rewritten. All public page layouts get the new design tokens.

---

## TASK 1 — Updated Design Tokens

Update `tailwind.config.ts` — simplified, clean:

```typescript
import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Core palette
        void: '#0F0F0F',           // main background
        ink: '#1A1A1A',            // surface
        smoke: '#242424',          // elevated surface
        ash: '#2E2E2E',            // borders
        // Text
        snow: '#F8F8F8',           // primary text
        mist: '#A0A0A0',           // secondary text
        fog: '#585858',            // muted text
        // Accent
        gold: {
          DEFAULT: '#C9A84C',
          bright: '#E8C96A',
          dim: '#8A6F2E',
          glow: 'rgba(201,168,76,0.12)',
        },
        // Light mode
        paper: '#F5F0E8',
        parchment: '#EDE7DB',
        // Admin (unchanged)
        cream: {
          DEFAULT: '#F5F0E8',
          soft: '#FAF7F2',
          muted: '#EDE8DF',
          border: '#D8D0C4',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['General Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['clamp(3.5rem, 9vw, 8.5rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'title': ['clamp(2.5rem, 6vw, 5.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'heading': ['clamp(1.8rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'subheading': ['clamp(1.2rem, 2.5vw, 2rem)', { lineHeight: '1.2' }],
      },
      animation: {
        'breathe': 'breathe 6s ease-in-out infinite',
        'fade-in': 'fadeIn 1s ease forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gold-line': 'goldLine 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        goldLine: {
          from: { width: '0', opacity: '0' },
          to: { width: '100%', opacity: '1' },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
```

---

## TASK 2 — Updated Global CSS

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root, .dark {
    --color-bg: 15 15 15;
    --color-surface: 26 26 26;
    --color-border: 46 46 46;
    --color-text-primary: 248 248 248;
    --color-text-secondary: 160 160 160;
    --color-text-muted: 88 88 88;
  }

  .light {
    --color-bg: 245 240 232;
    --color-surface: 250 247 242;
    --color-border: 224 217 206;
    --color-text-primary: 15 15 15;
    --color-text-secondary: 60 55 50;
    --color-text-muted: 120 115 108;
  }

  /* Admin always light */
  .admin-layout {
    --admin-bg: #F7F3EE;
    --admin-surface: #FFFFFF;
    --admin-sidebar: #F0EAE0;
    --admin-border: #D8D0C4;
    --admin-text: #1A1714;
    --admin-text-secondary: #3D3830;
    --admin-text-muted: #7A7066;
    --admin-gold: #C9960A;
    --admin-gold-light: rgba(201,150,10,0.1);
    --admin-gold-border: rgba(201,150,10,0.3);
    --admin-active-bg: rgba(201,150,10,0.08);
    --admin-hover-bg: rgba(26,23,20,0.04);
  }
}

@layer base {
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
  }

  body {
    background-color: #0F0F0F;
    color: #F8F8F8;
    font-family: 'General Sans', system-ui, sans-serif;
    overflow-x: hidden;
  }

  .light body {
    background-color: #F5F0E8;
    color: #0F0F0F;
  }

  ::selection {
    background: rgba(201, 168, 76, 0.25);
  }

  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: #0F0F0F; }
  ::-webkit-scrollbar-thumb { background: #C9A84C; }
}

@layer utilities {
  /* Gold gradient text */
  .text-gold-gradient {
    background: linear-gradient(135deg, #C9A84C 0%, #E8C96A 60%, #C9A84C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Outlined text */
  .text-outline {
    color: transparent;
    -webkit-text-stroke: 1px rgba(248, 248, 248, 0.4);
  }

  .text-outline-gold {
    color: transparent;
    -webkit-text-stroke: 1px rgba(201, 168, 76, 0.6);
  }

  /* Gold divider line */
  .gold-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent);
  }

  .gold-line-left {
    height: 1px;
    background: linear-gradient(90deg, #C9A84C, transparent);
  }

  /* Section label style */
  .label-text {
    font-family: 'General Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #C9A84C;
  }

  /* Cinematic image overlay */
  .cinematic-overlay {
    background: linear-gradient(
      to right,
      #0F0F0F 0%,
      #0F0F0F 35%,
      rgba(15,15,15,0.7) 60%,
      rgba(15,15,15,0.2) 100%
    );
  }

  /* Hover lift */
  .hover-lift {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hover-lift:hover {
    transform: translateY(-4px);
  }
}

/* Prose styles for blog */
.prose-rfy {
  color: #A0A0A0;
  line-height: 1.8;
}
.prose-rfy h1, .prose-rfy h2, .prose-rfy h3 {
  font-family: 'Cormorant Garamond', serif;
  color: #F8F8F8;
  font-weight: 600;
}
.prose-rfy p { margin-bottom: 1.2rem; }
.prose-rfy a { color: #C9A84C; }
.prose-rfy blockquote {
  border-left: 2px solid #C9A84C;
  padding-left: 1.5rem;
  font-style: italic;
  color: #A0A0A0;
}
.prose-rfy img { max-width: 100%; }
.prose-rfy hr { border-color: #2E2E2E; }

/* Tiptap */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #585858;
  pointer-events: none;
  height: 0;
}

/* Theme transitions */
*, *::before, *::after {
  transition-property: background-color, border-color, color, opacity;
  transition-duration: 0.15s;
  transition-timing-function: ease;
}
img, video, canvas { transition: none; }
```

---

## TASK 3 — New Navbar

Rewrite `src/components/layout/Navbar.tsx` completely:

**Design:** Ultra-minimal. Almost invisible until needed. On scroll it picks up a frosted glass backdrop.

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Partner', href: '/partner' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-void/90 backdrop-blur-xl border-b border-ash/40 py-4'
            : 'bg-transparent py-6'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo-white.png"
              alt="Room For You"
              width={100}
              height={50}
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav — centered */}
          <div className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-mist hover:text-snow transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle className="hidden md:flex" />
            <Link
              href="/forms/join-room-for-you"
              className="hidden md:inline-flex items-center px-5 py-2 text-[11px] font-body font-medium tracking-[0.2em] uppercase border border-gold text-gold hover:bg-gold hover:text-void transition-all duration-300"
            >
              Join Us
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden text-mist hover:text-snow transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Full-screen mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-void flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6">
              <Image src="/images/logo-white.png" alt="Room For You" width={100} height={50} className="h-8 w-auto" />
              <button onClick={() => setMenuOpen(false)} className="text-mist hover:text-snow">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="font-display text-4xl text-snow hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/forms/join-room-for-you"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 px-8 py-3 border border-gold text-gold text-[11px] font-body tracking-[0.2em] uppercase hover:bg-gold hover:text-void transition-all"
                >
                  Join the Community
                </Link>
              </motion.div>
            </div>

            <div className="gold-line mx-6 mb-8 opacity-20" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## TASK 4 — New Hero Section

Rewrite `src/components/landing/Hero.tsx` completely:

**Concept:** Split composition. Left side: pure typography dominating the space. Right side: a portrait image (Yadah or abstract) bleeding in at low opacity, creating depth. A single gold horizontal line cuts through the middle like a shaft of light. Animated entrance — words appear one by one.

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'

const words = [
  { text: 'THERE IS', style: 'text-outline', delay: 0.2 },
  { text: 'ROOM', style: 'text-gold-gradient', delay: 0.5 },
  { text: 'FOR YOU.', style: 'text-snow', delay: 0.8 },
]

export function Hero() {
  return (
    <section className="relative min-h-screen bg-void overflow-hidden flex flex-col">
      <Navbar />

      {/* Background orb — breathing gold light */}
      <div
        className="absolute pointer-events-none animate-breathe"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
          top: '50%',
          right: '10%',
          transform: 'translateY(-50%)',
        }}
      />

      {/* Right image — cinematic bleed */}
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col justify-center flex-1 px-6 lg:px-16 xl:px-24 pt-28 pb-20 max-w-7xl mx-auto w-full">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="label-text mb-10"
        >
          Worship · Prayer · Study · Community
        </motion.p>

        {/* Giant headline */}
        <div className="space-y-2 mb-12">
          {words.map((word, i) => (
            <motion.h1
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: word.delay, ease: [0.16, 1, 0.3, 1] }}
              className={`font-display font-bold leading-none ${word.style}`}
              style={{ fontSize: 'clamp(4rem, 11vw, 10rem)' }}
            >
              {word.text}
            </motion.h1>
          ))}
        </div>

        {/* Gold line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="gold-line-left w-48 mb-10 origin-left"
        />

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="font-body text-mist text-lg leading-relaxed max-w-lg mb-12"
        >
          A community of young men and women singing songs of salvation,
          studying the Word, and getting others saved.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="flex flex-wrap gap-4"
        >
          <Link
            href="/forms/join-room-for-you"
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

        {/* Bottom stat strip */}
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
              <span className="font-display text-snow text-xl font-semibold">{stat.value}</span>
              <span className="label-text opacity-60">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-10 right-10 hidden lg:flex flex-col items-center gap-2"
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-gold opacity-40" />
        <div className="w-1 h-1 rounded-full bg-gold animate-pulse" />
      </motion.div>
    </section>
  )
}
```

---

## TASK 5 — New Scripture Strip

Rewrite `src/components/landing/ScriptureStrip.tsx`:

**Concept:** Full-width dark section. Almost nothing on it. Just the verse, perfectly centered, breathing.

```typescript
'use client'

import { useEffect, useState } from 'react'
import { AudioPlayer } from '@/components/shared/AudioPlayer'
import { ShareButton } from '@/components/shared/ShareButton'
import { motion } from 'framer-motion'

export function ScriptureStrip() {
  const [scripture, setScripture] = useState<{
    id: string; reference: string; text: string; translation: string; audioUrl?: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/scripture/today')
      .then(r => r.json())
      .then(setScripture)
      .catch(() => setScripture({
        id: 'fallback',
        reference: '2 Corinthians 5:17',
        text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
        translation: 'NIV',
      }))
  }, [])

  if (!scripture) return <div className="h-64 bg-ink" />

  return (
    <section className="bg-ink py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto text-center"
      >
        {/* Translation badge */}
        <p className="label-text mb-6 opacity-60">{scripture.translation}</p>

        {/* Reference */}
        <p className="font-display text-gold text-2xl lg:text-3xl mb-6">
          {scripture.reference}
        </p>

        {/* Gold line */}
        <div className="gold-line max-w-[120px] mx-auto mb-8 opacity-40" />

        {/* Text */}
        <blockquote className="font-display text-snow text-xl lg:text-2xl italic leading-relaxed mb-10">
          "{scripture.text}"
        </blockquote>

        {/* Audio + Share */}
        <div className="flex flex-col items-center gap-4">
          {scripture.audioUrl && (
            <AudioPlayer src={scripture.audioUrl} className="w-full max-w-sm" />
          )}
          <ShareButton
            scriptureId={scripture.id}
            reference={scripture.reference}
          />
        </div>
      </motion.div>
    </section>
  )
}
```

---

## TASK 6 — New Vision Section

Rewrite `src/components/landing/VisionSection.tsx`:

**Concept:** Two-panel. Left: a single massive statement. Right: mission + activities. Clean, breathing, no clutter.

```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function VisionSection({ content }: { content: Record<string, string> }) {
  const activities = [
    'Monthly community gatherings across cities',
    'Corporate prayer and intercession',
    'Structured online Bible study',
    'One-on-one mentorship and counseling',
    'Foot evangelism and outreaches',
  ]

  return (
    <section className="bg-void py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">

        {/* Left — vision statement */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="label-text mb-8">The Vision</p>
          <h2
            className="font-display text-snow leading-tight mb-8"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 4.5rem)' }}
          >
            {content['landing.vision.heading'] || 'Building a community'}
            <br />
            <span className="text-gold-gradient italic">
              {content['landing.vision.subheading'] || 'Jesus to Nations'}
            </span>
          </h2>
          <p className="font-body text-mist leading-relaxed text-lg max-w-md">
            {content['landing.vision.text'] || 'Building a community of young men and women who sing songs of salvation with conviction of their identity in Christ.'}
          </p>
        </motion.div>

        {/* Right — mission + activities */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          {/* Mission */}
          <div>
            <p className="label-text mb-4">The Mission</p>
            <p className="font-display text-4xl text-snow mb-2">Jesus to Nations</p>
            <p className="font-display text-lg italic text-gold opacity-70">
              2 Corinthians 5:17–21
            </p>
          </div>

          {/* Gold separator */}
          <div className="gold-line-left w-24 opacity-30" />

          {/* Activities */}
          <div className="space-y-4">
            {activities.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-4"
              >
                <div className="w-px h-4 bg-gold opacity-60 mt-1 shrink-0" />
                <p className="font-body text-mist text-sm leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## TASK 7 — New Confession Section (Landing)

Rewrite `src/components/landing/ConfessionReveal.tsx` — this is the most important fix.

**The confession section on the landing page should be ONE clean moment — not the full GSAP scroll experience (that lives at `/confession`). On the landing page it's a teaser — a powerful excerpt that invites visitors to read the full confession.**

```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const EXCERPT_LINES = [
  'I am saved by grace through faith.',
  'I am justified and redeemed by the blood of Jesus.',
  'I am now a part of God\'s family.',
  'I am saved — and I get others saved.',
  'It\'s Jesus to nations, and I am a willing vessel.',
]

export function ConfessionReveal() {
  return (
    <section className="bg-ink py-32 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="label-text mb-16 text-center"
        >
          The Confession
        </motion.p>

        {/* Lines */}
        <div className="space-y-6 mb-16">
          {EXCERPT_LINES.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-snow"
              style={{
                fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
                lineHeight: '1.2',
                opacity: i === EXCERPT_LINES.length - 1 ? 1 : 0.7 - i * 0.05,
              }}
            >
              {line}
            </motion.p>
          ))}
        </div>

        {/* Gold separator + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="gold-line w-24 opacity-30" />
          <p className="font-body text-mist text-sm max-w-md">
            This is the declaration of every member of Room For You.
            Make it yours.
          </p>
          <Link
            href="/confession"
            className="inline-flex items-center gap-2 font-body text-[11px] tracking-[0.2em] uppercase text-gold hover:opacity-70 transition-opacity"
          >
            Read the full confession →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## TASK 8 — New From the Shepherd Section

Rewrite `src/components/landing/FromTheShepherd.tsx`:

**Concept:** Editorial. Full-bleed portrait. Words float over a dark overlay. Intimate and cinematic.

```typescript
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export function FromTheShepherd({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative bg-void overflow-hidden">
      {/* Full-bleed image */}
      <div className="absolute inset-0">
        <Image
          src={content['shepherd.image'] || '/images/yadah-portrait.jpg'}
          alt="Minister Yadah"
          fill
          className="object-cover object-top opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-40">
        <div className="max-w-2xl">
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
            "{content['shepherd.quote'] || 'There is room for you here.'}"
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* Gold line */}
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
      </div>
    </section>
  )
}
```

---

## TASK 9 — New Community Highlights Section

Rewrite `src/components/landing/CommunityHighlights.tsx`:

**Concept:** Clean 2x2 grid. Each card is minimal — just a number, title, and one line. No noise.

```typescript
'use client'

import { motion } from 'framer-motion'

export function CommunityHighlights({ content }: { content: Record<string, string> }) {
  const highlights = [
    { n: '01', title: content['highlights.1.title'] || 'Monthly Meetings', desc: content['highlights.1.desc'] || 'Physical gatherings across cities.' },
    { n: '02', title: content['highlights.2.title'] || 'Prayer', desc: content['highlights.2.desc'] || 'Corporate and personal intercession.' },
    { n: '03', title: content['highlights.3.title'] || 'Bible Study', desc: content['highlights.3.desc'] || 'Structured study with weekly tasks.' },
    { n: '04', title: content['highlights.4.title'] || 'Mentorship', desc: content['highlights.4.desc'] || 'One-on-one counseling and growth.' },
  ]

  return (
    <section className="bg-void py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="label-text mb-4">What We Do</p>
            <h2 className="font-display text-snow" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
              Community <span className="italic text-gold-gradient">life.</span>
            </h2>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ash">
          {highlights.map((h, i) => (
            <motion.div
              key={h.n}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-void p-10 hover-lift group cursor-default"
            >
              {/* Number */}
              <p className="font-display text-6xl text-ash group-hover:text-gold/20 transition-colors duration-500 mb-8 font-bold">
                {h.n}
              </p>
              {/* Title */}
              <h3 className="font-display text-snow text-2xl mb-3 group-hover:text-gold transition-colors duration-300">
                {h.title}
              </h3>
              {/* Description */}
              <p className="font-body text-fog text-sm leading-relaxed">{h.desc}</p>
              {/* Gold bottom border on hover */}
              <div className="gold-line-left w-0 group-hover:w-12 transition-all duration-500 mt-6 opacity-60" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## TASK 10 — New CTA Section

Rewrite `src/components/landing/CTASection.tsx`:

**Concept:** Full-bleed gold. Inverted. Maximum contrast. Feels like a disruption — the site's emotional climax.

```typescript
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function CTASection({ content }: { content: Record<string, string> }) {
  return (
    <section className="relative bg-gold overflow-hidden py-40 px-6">
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-void font-bold leading-none mb-8"
          style={{ fontSize: 'clamp(3rem, 10vw, 9rem)' }}
        >
          {content['landing.cta.headline'] || 'The door is open.'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-body text-void/70 text-lg mb-12"
        >
          {content['landing.cta.subtext'] || 'Step in. There is room for you.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Link
            href="/forms/join-room-for-you"
            className="inline-flex items-center px-10 py-4 bg-void text-snow font-body text-[11px] font-semibold tracking-[0.25em] uppercase hover:bg-smoke transition-all duration-300"
          >
            {content['landing.cta.button'] || 'Join the Community'}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
```

---

## TASK 11 — New Footer

Rewrite `src/components/layout/Footer.tsx` — always dark, always minimal:

```typescript
import Link from 'next/link'
import Image from 'next/image'
import { getContentMany } from '@/lib/content'

const NAV_LINKS = [
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Partner', href: '/partner' },
  { label: 'About', href: '/about' },
]

export async function Footer() {
  const content = await getContentMany([
    'footer.tagline',
    'footer.copyright',
    'footer.instagram',
    'footer.youtube',
    'footer.twitter',
  ])

  return (
    <footer className="bg-void border-t border-ash/40 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 mb-16">
          {/* Logo + tagline */}
          <div>
            <Image
              src="/images/logo-white.png"
              alt="Room For You"
              width={120}
              height={60}
              className="h-10 w-auto mb-4"
            />
            <p className="label-text opacity-40">
              {content['footer.tagline'] || 'Jesus to Nations — 2 Cor 5:17-21'}
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-[11px] tracking-[0.15em] uppercase text-fog hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social links */}
          <div className="flex items-center gap-6">
            {[
              { href: content['footer.instagram'], label: 'IG' },
              { href: content['footer.youtube'], label: 'YT' },
              { href: content['footer.twitter'], label: 'TW' },
            ].filter(s => s.href).map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[11px] tracking-[0.15em] text-fog hover:text-gold transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        {/* Gold divider */}
        <div className="gold-line opacity-20 mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-fog">
            {content['footer.copyright'] || '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.'}
          </p>
          <Link href="/confession" className="font-body text-xs text-fog hover:text-gold transition-colors">
            The Confession →
          </Link>
        </div>
      </div>
    </footer>
  )
}
```

---

## TASK 12 — Update Landing Page Composition

Update `src/app/(public)/page.tsx` to use all new components:

```typescript
import { getContentMany } from '@/lib/content'
import { Hero } from '@/components/landing/Hero'
import { ScriptureStrip } from '@/components/landing/ScriptureStrip'
import { VisionSection } from '@/components/landing/VisionSection'
import { ConfessionReveal } from '@/components/landing/ConfessionReveal'
import { FromTheShepherd } from '@/components/landing/FromTheShepherd'
import { CommunityHighlights } from '@/components/landing/CommunityHighlights'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/layout/Footer'

export default async function HomePage() {
  const content = await getContentMany([
    'landing.vision.heading',
    'landing.vision.subheading',
    'landing.vision.text',
    'landing.cta.headline',
    'landing.cta.subtext',
    'landing.cta.button',
    'shepherd.quote',
    'shepherd.name',
    'shepherd.title',
    'shepherd.image',
    'shepherd.link',
    'highlights.1.title', 'highlights.1.desc',
    'highlights.2.title', 'highlights.2.desc',
    'highlights.3.title', 'highlights.3.desc',
    'highlights.4.title', 'highlights.4.desc',
  ])

  return (
    <main>
      <Hero />
      <ScriptureStrip />
      <VisionSection content={content} />
      <ConfessionReveal />
      <FromTheShepherd content={content} />
      <CommunityHighlights content={content} />
      <CTASection content={content} />
      <Footer />
    </main>
  )
}
```

---

## PHASE 10 COMPLETION CHECKLIST

- [ ] New design tokens in `tailwind.config.ts` — `void`, `ink`, `smoke`, `snow`, `mist`, `fog`
- [ ] New globals.css with clean CSS variables
- [ ] Navbar — ultra minimal, frosted on scroll, mobile menu works
- [ ] Hero — split composition, outlined text, portrait bleed, stat strip
- [ ] Scripture strip — centered, breathing, minimal
- [ ] Vision section — two panel, no clutter
- [ ] Confession reveal — 5-line excerpt, clean, links to `/confession`
- [ ] From the Shepherd — full-bleed editorial
- [ ] Community highlights — 2x2 grid, hover states
- [ ] CTA section — gold background, maximum impact
- [ ] Footer — always dark, minimal, clean
- [ ] Landing page composes correctly with CMS content
- [ ] Theme toggle still works
- [ ] No confession lines repeating
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The confession section on the LANDING PAGE (`ConfessionReveal.tsx`) is now a simple excerpt — NOT the full GSAP scroll experience. The full experience lives only at `/confession`. Do NOT import GSAP or ScrollTrigger in the landing version.
- `void` is the new name for the primary background color (`#0F0F0F`). In Tailwind use `bg-void`, `text-void`. This replaces `bg-black`, `bg-charcoal` everywhere on public pages.
- The highlights grid uses `gap-px bg-ash` technique — the grid gap is 1px and the grid background is ash-colored, creating hairline dividers between cards. Each card has `bg-void` which covers the ash. This is a clean CSS trick for bordered grids without border artifacts.
- `cinematic-overlay` is a CSS utility class defined in globals.css — it creates the left-to-right fade from solid black to transparent, used on the hero portrait bleed. Do not recreate it inline.
- The Footer is an async server component (it calls `getContentMany`). It cannot be used inside a `'use client'` component. If any parent tries to import it as a client component, move Footer outside the client boundary.
- After deploying, the very first thing to check is the hero on mobile — `clamp(4rem, 11vw, 10rem)` for font size. On very small screens (320px) this could be too large. If so, adjust the min clamp value to `3rem`.
