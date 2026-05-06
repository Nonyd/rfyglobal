# ROOM FOR YOU — Phase 6 Cursor Prompt
## About Page · SEO · Performance · Security Hardening · Deployment

---

## CONTEXT

This is the final phase. Phases 1–5 have built the complete platform. Phase 6 finishes the site with:

1. **About Page** — Full vision, mission, story, and Yadah as founder + shepherd
2. **SEO** — Sitemap, robots.txt, structured data (JSON-LD), OpenGraph for all pages
3. **Performance** — Image optimization, bundle analysis, lazy loading, font optimization
4. **Security Hardening** — Production CSP, rate limiting review, headers audit
5. **Deployment Configuration** — Vercel (primary) and Webuzo/Node.js (secondary) production-ready config

---

## NO NEW DEPENDENCIES

All dependencies are already installed. This phase is configuration, content, and optimization only.

---

## ═══════════════════════════════════════
## MODULE 1 — ABOUT PAGE
## ═══════════════════════════════════════

### TASK 1 — About Page

Create `src/app/(public)/about/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AboutClient } from '@/components/about/AboutClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Room For You',
  description: 'Room For You is a worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations.',
  openGraph: {
    title: 'About Room For You',
    description: 'Building a community of young men and women who sing songs of salvation, study the Word, and get others saved.',
    url: 'https://rfyglobal.org/about',
  },
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <AboutClient />
      </main>
      <Footer />
    </>
  )
}
```

---

### TASK 2 — AboutClient Component

Create `src/components/about/AboutClient.tsx`:

This page tells the full story of Room For You. Build it with the same cinematic quality as the landing page.

**Page structure (top to bottom):**

#### Section 1 — Hero
- `pt-32` for navbar clearance
- Gold eyebrow: `"OUR STORY"`
- Large display heading: `"More Than a Ministry."` white, then `"A Family."` in gold italic — Cormorant Garamond, very large
- Thin gold horizontal rule below

#### Section 2 — Vision & Mission
Two-column layout on desktop, stacked mobile:

**Left column:**
- Label: `"THE VISION"` in gold, tracked wide, small
- Text: *"Building a community of young men and women who sing songs of salvation with conviction of their identity in Christ, study the Bible, pray and get others saved."*

**Right column:**
- Label: `"THE MISSION"` in gold
- Text: `"Jesus to Nations"` — large, display font, white
- Scripture: `"2 Corinthians 5:17-21"` in gold italic below

A vertical gold line divides the columns on desktop.

#### Section 3 — What We Do
Full-width section with slightly lighter background `#111111`:
- Heading: `"What Room For You Looks Like"` — display font
- Six activity cards in a 2×3 or 3×2 grid:
  1. **Monthly Meetings** — "Physical gatherings across cities where the Word comes alive and community is built."
  2. **Prayer** — "Corporate and personal prayer — we carry one another's burdens before the throne."
  3. **Online Study** — "Structured Bible study with weekly tasks and materials accessible to everyone."
  4. **Mentorship** — "One-on-one spiritual mentorship and counseling for growth and accountability."
  5. **Counseling & Support** — "A safe community to receive support and walk through life's challenges together."
  6. **Evangelical Outreach** — "Foot evangelism and outreaches — taking the Gospel beyond the walls."

Cards: dark border, gold icon/number, no hover animation needed — clean and readable.

#### Section 4 — The Confession
A full-width, centered section:
- Background: pure black
- Heading: `"We Declare"` — large, Cormorant Garamond, italic, gold
- The full confession text displayed as a beautiful typographic block — not a list, but a paragraph-style presentation in Cormorant Garamond, large, white/80, centered, with generous line height
- A gold CTA link at the bottom: `"Read the full confession →"` → `/confession`

#### Section 5 — From the Shepherd (Yadah)
The most personal section on the About page:
- Background: `#0A0A0A` with a soft warm gold glow on the right side
- Layout: Text left, photo right on desktop (reversed from landing page)
- Large display label: `"The Shepherd"` in gold italic, Cormorant Garamond
- Name: `"Minister Yadah"` — large, white, display font
- Role: `"Founder · Room For You"` — gold, small, tracked wide
- Bio text:
  > *"I started Room For You because I believe every young person deserves a community where they are not just known, but called into purpose. A place where the Word of God is not just preached but lived. Where prayer is not a ritual but a lifestyle. Where you are not alone in your faith — you are surrounded by people who are running the same race.*
  >
  > *This is that community. And there is room for you here."*
- A gold signature-style underline beneath her name (CSS or SVG line)
- Two links below:
  - `"Visit yadahworld.com →"` — gold, opens in new tab
  - `"Listen to her music →"` — white/50, links to Yadah's music platform
- Photo: `public/images/yadah-portrait.jpg` (placeholder already in repo)

#### Section 6 — Join CTA
Same as the landing page CTA section but with different copy:
- `"There is room for you."` — display, large, gold italic
- `"Come as you are. Grow as you will."` — white, Inter
- Button: `"Join the Community"` → `/forms/join-room-for-you`

```typescript
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const ACTIVITIES = [
  { number: '01', title: 'Monthly Meetings', desc: 'Physical gatherings across cities where the Word comes alive and community is built.' },
  { number: '02', title: 'Prayer', desc: 'Corporate and personal prayer — we carry one another\'s burdens before the throne.' },
  { number: '03', title: 'Online Study', desc: 'Structured Bible study with weekly tasks and materials accessible to everyone.' },
  { number: '04', title: 'Mentorship', desc: 'One-on-one spiritual mentorship and counseling for growth and accountability.' },
  { number: '05', title: 'Counseling & Support', desc: 'A safe community to receive support and walk through life\'s challenges together.' },
  { number: '06', title: 'Evangelical Outreach', desc: 'Foot evangelism and outreaches — taking the Gospel beyond the walls.' },
]

const CONFESSION_EXCERPT = `I am saved by grace through faith. I am justified and redeemed by the blood of Jesus. I have received mercy because of the sacrifice of Jesus on the cross. God's love has been shed abroad in my heart and I am sealed with the Holy Spirit. I am now a part of God's family! I am committed to learning the value of this family and I grow in both wisdom and stature. I am committed to study and prayers! I am saved and I get others saved. I am reconciled and I reconcile others. On account of me, many come to the knowledge of the Son. It's Jesus to nations — and I am a willing vessel! I live my life in honor of the one who died for me, till his return!`

export function AboutClient() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center">
        <motion.p
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="text-[10px] tracking-[0.4em] uppercase text-gold font-body mb-6">
          Our Story
        </motion.p>
        <motion.h1
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay: 0.1 } } }}
          className="font-display leading-none mb-8"
          style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}>
          <span className="text-white block">More Than a Ministry.</span>
          <span className="text-gradient-gold italic block">A Family.</span>
        </motion.h1>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-sm mx-auto" />
      </section>

      {/* ── VISION & MISSION ── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-0 relative">
          {/* Vertical divider */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px"
            style={{ background: 'rgba(201,168,76,0.2)' }} />

          {/* Vision */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="lg:pr-16 pb-12 lg:pb-0">
            <p className="text-[10px] tracking-[0.4em] uppercase text-gold font-body mb-6">
              The Vision
            </p>
            <p className="font-body text-white/70 text-lg leading-relaxed">
              Building a community of young men and women who sing songs of salvation
              with conviction of their identity in Christ, study the Bible, pray
              and get others saved.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay: 0.15 } } }}
            className="lg:pl-16">
            <p className="text-[10px] tracking-[0.4em] uppercase text-gold font-body mb-6">
              The Mission
            </p>
            <p className="font-display text-4xl lg:text-5xl text-white mb-3 leading-none">
              Jesus to Nations
            </p>
            <p className="font-display text-lg italic text-gold/70">2 Corinthians 5:17–21</p>
            <p className="font-body text-white/50 text-sm mt-4 leading-relaxed max-w-sm">
              "Therefore, if anyone is in Christ, the new creation has come: The old has gone,
              the new is here! All this is from God, who reconciled us to himself through Christ
              and gave us the ministry of reconciliation."
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="py-20 px-6" style={{ background: '#111111' }}>
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="font-display text-3xl lg:text-4xl text-white text-center mb-16">
            What Room For You Looks Like
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="font-display text-3xl text-gold/30 mb-4">{item.number}</p>
                <h3 className="font-display text-lg text-white mb-2">{item.title}</h3>
                <p className="text-white/50 font-body text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE CONFESSION ── */}
      <section className="py-24 px-6 bg-black text-center">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            className="font-display text-4xl lg:text-5xl italic text-gold mb-12">
            We Declare
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay: 0.1 } } }}
            className="font-display text-xl lg:text-2xl text-white/80 leading-[1.9] mb-12"
            style={{ fontStyle: 'italic' }}>
            {CONFESSION_EXCERPT}
          </motion.p>
          <Link href="/confession"
            className="inline-flex items-center gap-2 text-gold font-body text-sm tracking-widest uppercase hover:underline">
            Read the full confession →
          </Link>
        </div>
      </section>

      {/* ── FROM THE SHEPHERD ── */}
      <section className="py-20 px-6 relative overflow-hidden" style={{ background: '#0A0A0A' }}>
        {/* Warm glow right */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 100% 50%, rgba(201,168,76,0.06), transparent)' }} />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Text */}
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <p className="font-display text-2xl italic text-gold mb-2">The Shepherd</p>
            <h2 className="font-display text-4xl lg:text-5xl text-white mb-1">Minister Yadah</h2>
            <p className="text-[10px] tracking-[0.35em] uppercase text-gold/60 font-body mb-1">
              Founder · Room For You
            </p>
            {/* Gold underline */}
            <div className="w-24 h-px bg-gold/50 mb-8" />

            <div className="space-y-5 text-white/65 font-body leading-relaxed text-base">
              <p>
                "I started Room For You because I believe every young person deserves a community
                where they are not just known, but called into purpose. A place where the Word of
                God is not just preached but lived. Where prayer is not a ritual but a lifestyle.
                Where you are not alone in your faith — you are surrounded by people who are
                running the same race.
              </p>
              <p>
                This is that community. And there is room for you here."
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link href="https://yadahworld.com" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold font-body text-sm tracking-widest uppercase hover:underline">
                Visit yadahworld.com →
              </Link>
              <Link href="https://yadahworld.com/music" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/40 font-body text-sm tracking-widest uppercase hover:text-white/70 transition-colors">
                Listen to her music →
              </Link>
            </div>
          </motion.div>

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative">
            <div className="absolute -inset-2 border border-gold/10" />
            <Image
              src="/images/yadah-portrait.jpg"
              alt="Minister Yadah — Founder of Room For You"
              width={600}
              height={700}
              className="w-full h-[500px] lg:h-[600px] object-cover relative z-10"
              priority
            />
            {/* Gold overlay strip */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/60 to-transparent z-20" />
          </motion.div>
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="py-24 px-6 bg-black text-center">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent max-w-xs mx-auto mb-16" />
        <motion.p
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="font-display text-4xl lg:text-6xl italic text-gold mb-4 leading-none">
          There is room for you.
        </motion.p>
        <p className="text-white/50 font-body mb-10">Come as you are. Grow as you will.</p>
        <Link
          href="/forms/join-room-for-you"
          className="inline-block px-10 py-4 bg-gold text-black font-body text-sm tracking-widest uppercase font-medium hover:bg-gold-light transition-all duration-300">
          Join the Community
        </Link>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent max-w-xs mx-auto mt-16" />
      </section>
    </div>
  )
}
```

---

## ═══════════════════════════════════════
## MODULE 2 — SEO
## ═══════════════════════════════════════

### TASK 3 — Sitemap

Create `src/app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rfyglobal.org'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/word`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/study`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/partner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/confession`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.6 },
  ]

  // Dynamic blog posts
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = await db.post.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    })
    blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch { /* DB not available during build */ }

  return [...staticPages, ...blogPages]
}
```

---

### TASK 4 — Robots.txt

Create `src/app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: 'https://rfyglobal.org/sitemap.xml',
    host: 'https://rfyglobal.org',
  }
}
```

---

### TASK 5 — JSON-LD Structured Data

Create `src/components/seo/JsonLd.tsx`:

```typescript
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Room For You',
    alternateName: 'RFY',
    url: 'https://rfyglobal.org',
    logo: 'https://rfyglobal.org/images/logo-white.png',
    description: 'A worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations.',
    founder: {
      '@type': 'Person',
      name: 'Minister Yadah',
      url: 'https://yadahworld.com',
    },
    sameAs: [
      'https://instagram.com/roomforyou',
      'https://youtube.com/@roomforyou',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function WebsiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Room For You',
    url: 'https://rfyglobal.org',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://rfyglobal.org/blog?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

Add both to `src/app/layout.tsx` inside `<body>`:

```typescript
import { OrganizationJsonLd, WebsiteJsonLd } from '@/components/seo/JsonLd'

// Inside <body>:
<OrganizationJsonLd />
<WebsiteJsonLd />
{children}
```

---

### TASK 6 — Root Layout Metadata (Final)

Update `src/app/layout.tsx` with complete production metadata:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://rfyglobal.org'),
  title: {
    default: 'Room For You — with Yadah',
    template: '%s — Room For You',
  },
  description: 'A worship, prayer, study, mentorship and evangelism community founded by Minister Yadah. Jesus to Nations. rfyglobal.org',
  keywords: [
    'Room For You', 'Yadah', 'Minister Yadah', 'worship community', 'prayer',
    'bible study', 'gospel community', 'Nigeria', 'Jesus to nations',
    'rfyglobal', 'Christian community', 'evangelism',
  ],
  authors: [{ name: 'Minister Yadah', url: 'https://yadahworld.com' }],
  creator: 'SonsHub Media',
  publisher: 'Room For You',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://rfyglobal.org',
    siteName: 'Room For You',
    title: 'Room For You — with Yadah',
    description: 'Building a community of young men and women who sing songs of salvation, study the Word, and get others saved.',
    images: [
      {
        url: '/og-default.png', // Place a 1200×630 OG image at public/og-default.png
        width: 1200,
        height: 630,
        alt: 'Room For You — with Yadah',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Room For You — with Yadah',
    description: 'Jesus to Nations. A worship, prayer, study and mentorship community.',
    images: ['/og-default.png'],
    creator: '@yadahworld',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: '', // Add Google Search Console verification token when available
  },
}
```

---

### TASK 7 — Web Manifest

Create `public/site.webmanifest`:

```json
{
  "name": "Room For You",
  "short_name": "RFY",
  "description": "A worship, prayer, study and mentorship community. Jesus to Nations.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#C9A84C",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Note to Nony: Generate favicon assets at https://favicon.io and place in `/public`:
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `og-default.png` (1200×630 — create a branded image using the Room For You logo on black background with gold accents)

---

## ═══════════════════════════════════════
## MODULE 3 — PERFORMANCE
## ═══════════════════════════════════════

### TASK 8 — Next.js Performance Config

Update `next.config.mjs` with full production optimizations:

```javascript
/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co https://checkout.flutterwave.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: https://utfs.io",
      "media-src 'self' https://utfs.io blob:",
      "frame-src 'self' https://www.youtube.com https://checkout.paystack.com https://checkout.flutterwave.com https://checkout.payaza.africa",
      "connect-src 'self' https://rfyglobal.org https://api.paystack.co https://api.flutterwave.com https://api.payaza.africa https://uploadthing.com https://utfs.io https://fonts.gstatic.com",
      "worker-src 'self' blob:",
    ].join('; '),
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'uploadthing.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compress responses
  compress: true,

  // Production source maps off (security + performance)
  productionBrowserSourceMaps: false,

  // Webpack: externalize native addons
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@resvg/resvg-js']
    }
    return config
  },

  // PostInstall
  // (Keep existing postinstall: prisma generate in package.json)
}

export default nextConfig
```

---

### TASK 9 — Image Component Audit

Go through all `<Image>` usages in the codebase and ensure:
- Every `<Image>` that is above the fold has `priority` prop
- Every `<Image>` that is below the fold has `loading="lazy"` (default, but confirm)
- All `<Image>` components have meaningful `alt` text
- The Yadah portrait on the About page has `priority` since it's in the viewport on load

**Specifically ensure `priority` is set on:**
- `src/components/landing/Hero.tsx` — logo watermark
- `src/components/about/AboutClient.tsx` — Yadah portrait
- `src/components/layout/Navbar.tsx` — logo

---

### TASK 10 — Font Optimization

Ensure `src/app/layout.tsx` font loading is optimal. The current config uses `next/font/google` which is already optimal. Verify:

```typescript
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
})
```

---

### TASK 11 — Lazy Load Heavy Components

Add dynamic imports for the heavy client components that are not needed on first paint:

Update `src/app/(public)/confession/page.tsx`:
```typescript
import dynamic from 'next/dynamic'
const ConfessionPageClient = dynamic(
  () => import('@/components/confession/ConfessionPageClient').then(m => m.ConfessionPageClient),
  { ssr: false } // GSAP ScrollTrigger requires browser APIs
)
```

Update `src/components/landing/ConfessionReveal.tsx`:
```typescript
import dynamic from 'next/dynamic'
const ConfessionRevealClient = dynamic(
  () => import('@/components/landing/ConfessionRevealClient').then(m => m.ConfessionRevealClient),
  { ssr: false }
)
```

Note: If `ConfessionReveal` is already a client component using GSAP, wrap it in a dynamic import from the parent server component to prevent SSR issues.

---

## ═══════════════════════════════════════
## MODULE 4 — SECURITY HARDENING
## ═══════════════════════════════════════

### TASK 12 — Admin Login Page Hardening

Open `src/app/admin/login/page.tsx` (or wherever the admin login form lives).

Ensure:
1. Login form has **rate limiting** — max 5 attempts per IP per 15 minutes
2. Failed login attempts do not reveal whether the email exists
3. The login error message is always generic: `"Invalid credentials"`

Add rate limiting to the login route or the NextAuth credentials provider:

Create `src/app/api/auth/login-limit/route.ts` or add to the NextAuth config:

```typescript
// In src/lib/auth.ts, inside the CredentialsProvider authorize function:
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const loginLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
})

// Inside authorize():
const ip = 'login' // use a stable key; NextAuth doesn't expose IP here
const { success } = await loginLimiter.limit(`login:${credentials.email}`)
if (!success) throw new Error('Too many login attempts. Try again in 15 minutes.')
```

---

### TASK 13 — Environment Variable Validation

Create `src/lib/env.ts` — validates all required environment variables at startup:

```typescript
const required = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL',
  'BREVO_API_KEY',
  'BREVO_FROM_EMAIL',
  'UPLOADTHING_SECRET',
  'UPLOADTHING_APP_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}`
    )
  }
}
```

Call `validateEnv()` in `src/lib/db.ts` at the top (only in production):

```typescript
import { validateEnv } from './env'
if (process.env.NODE_ENV === 'production') validateEnv()
```

---

## ═══════════════════════════════════════
## MODULE 5 — DEPLOYMENT CONFIGURATION
## ═══════════════════════════════════════

### TASK 14 — Vercel Configuration (Primary)

Update `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["lhr1"],
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/api/webhooks/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

**Vercel environment variables to set in dashboard:**
```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL=https://rfyglobal.org
NEXT_PUBLIC_APP_URL=https://rfyglobal.org
BREVO_API_KEY
BREVO_FROM_EMAIL=noreply@rfyglobal.org
BREVO_FROM_NAME=Room For You
UPLOADTHING_SECRET
UPLOADTHING_APP_ID
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
PAYSTACK_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET
PAYSTACK_MONTHLY_PLAN_CODE
PAYSTACK_ANNUAL_PLAN_CODE
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
FLUTTERWAVE_SECRET_KEY
FLUTTERWAVE_WEBHOOK_SECRET
FLUTTERWAVE_MONTHLY_PLAN_ID
FLUTTERWAVE_ANNUAL_PLAN_ID
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
PAYAZA_SECRET_KEY
NEXT_PUBLIC_PAYAZA_PUBLIC_KEY
```

---

### TASK 15 — Webuzo / Node.js Deployment Config (Secondary)

Create `ecosystem.config.js` in the project root for PM2:

```javascript
module.exports = {
  apps: [
    {
      name: 'rfyglobal',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
```

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Room For You to Webuzo..."

# Pull latest
git pull origin main

# Install dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Run any pending migrations
npx prisma migrate deploy

# Build
npm run build

# Restart PM2
pm2 reload ecosystem.config.js --update-env

echo "✅ Deployment complete — rfyglobal.org"
```

Make it executable: `chmod +x scripts/deploy.sh`

Create `scripts/setup-webuzo.sh` for first-time server setup:

```bash
#!/bin/bash
set -e

echo "⚙️  First-time setup for Room For You on Webuzo..."

# Install dependencies
npm ci

# Generate Prisma
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Setup complete. App running on port 3000."
echo "Configure Nginx/Apache on Webuzo to proxy rfyglobal.org → localhost:3000"
```

---

### TASK 16 — Nginx Proxy Config (Webuzo reference)

Create `docs/nginx.conf` as a reference config for the Webuzo server:

```nginx
server {
    listen 80;
    server_name rfyglobal.org www.rfyglobal.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rfyglobal.org www.rfyglobal.org;

    # SSL — Let's Encrypt via Webuzo
    ssl_certificate /etc/letsencrypt/live/rfyglobal.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rfyglobal.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers (complement Next.js headers)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Static assets — serve directly with long cache
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Webhooks — no cache, no buffering
    location /api/webhooks/ {
        proxy_pass http://localhost:3000;
        proxy_buffering off;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
}
```

---

### TASK 17 — GitHub Actions CI/CD (Optional but recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: https://rfyglobal.org
          NEXT_PUBLIC_APP_URL: https://rfyglobal.org

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## PHASE 6 COMPLETION CHECKLIST

**About Page**
- [ ] `/about` renders all 6 sections correctly
- [ ] Vision + Mission two-column layout works on desktop and mobile
- [ ] Activities grid shows all 6 cards
- [ ] Confession excerpt displays and links to `/confession`
- [ ] Yadah section shows photo, bio, and links
- [ ] Framer Motion entrance animations trigger on scroll

**SEO**
- [ ] `/sitemap.xml` is accessible and includes all static + blog pages
- [ ] `/robots.txt` blocks `/admin` and `/api/`
- [ ] JSON-LD structured data appears in page source
- [ ] All pages have unique `<title>` and `<meta description>`
- [ ] OG image (`/og-default.png`) exists in `/public`

**Performance**
- [ ] `npm run build` output shows no large bundle warnings (> 500kb)
- [ ] Above-fold images have `priority` prop
- [ ] Confession client component is dynamically imported with `ssr: false`
- [ ] Google PageSpeed score > 85 on mobile (test after deployment)

**Security**
- [ ] Security headers visible at `https://securityheaders.com` — minimum grade A
- [ ] Admin login rate limiting active
- [ ] `validateEnv()` runs in production and catches missing vars
- [ ] No secrets visible in client bundle (check browser DevTools → Sources)

**Deployment**
- [ ] All environment variables set in Vercel dashboard
- [ ] `vercel.json` committed to repo
- [ ] `ecosystem.config.js` committed for Webuzo reference
- [ ] `docs/nginx.conf` committed for server reference
- [ ] `scripts/deploy.sh` is executable and documented

---

## FINAL NOTES FOR CURSOR

- The `og-default.png` file must be created manually — it is a 1200×630 branded image. Nony will create this using the Room For You logo on a black background with the tagline "Jesus to Nations." Place at `public/og-default.png`.
- The `ConfessionPageClient` should be dynamically imported with `ssr: false` because GSAP ScrollTrigger uses `window` and `document` — it cannot run during server-side rendering.
- The Nginx config in `docs/nginx.conf` is a **reference only** — it is not auto-applied. Nony or the server admin will copy it to the Webuzo Nginx vhost configuration.
- The `scripts/deploy.sh` assumes the server already has Node.js, npm, PM2, and Git installed. The `scripts/setup-webuzo.sh` handles first-time setup.
- `npm ci` is used instead of `npm install` in all production scripts — it uses the lockfile exactly and is faster and more reliable for CI/CD.
- After deploying to Vercel, register the webhook URLs in each payment gateway dashboard:
  - Paystack: `https://rfyglobal.org/api/webhooks/paystack`
  - Flutterwave: `https://rfyglobal.org/api/webhooks/flutterwave`
  - Payaza: `https://rfyglobal.org/api/webhooks/payaza`
- This is the final phase. The complete Room For You platform is now built across 6 phases. 🙏
