# ROOM FOR YOU — Phase 1 Cursor Prompt
## Project Setup, Design System & Landing Page

---

## CONTEXT

You are building **Room For You** — a worship, prayer, study, mentorship and evangelism community website founded by Minister Yadah. The website is a full-stack Next.js 14 application. This is Phase 1: project initialization, design system, security foundation, and the complete public landing page.

The brand is bold, modern, high-contrast — black, white, gold, with red as a micro-accent only. The feeling is cinematic, sacred, and intentional. Every pixel should make a visitor feel *received*.

---

## TECH STACK

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion + GSAP
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** NextAuth.js v5 (admin only)
- **Email:** Resend
- **File Storage:** Uploadthing
- **Payments:** Paystack, Flutterwave, Payaza
- **Share Cards:** satori + @resvg/resvg-js (Node.js runtime only — NOT edge)
- **Rate Limiting:** Upstash Redis
- **Deployment:** Vercel (primary), Webuzo/Node.js (secondary — all code must be edge-runtime-free unless explicitly stated)

---

## PHASE 1 TASKS

### TASK 1 — Project Initialization

Initialize a Next.js 14 project with the following configuration:

```bash
npx create-next-app@latest room-for-you \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

Install all dependencies:

```bash
npm install framer-motion gsap @gsap/react prisma @prisma/client \
  next-auth@beta bcryptjs \
  resend \
  uploadthing @uploadthing/next \
  @upstash/redis @upstash/ratelimit \
  satori @resvg/resvg-js \
  sharp \
  zod \
  react-hook-form @hookform/resolvers \
  lucide-react \
  clsx tailwind-merge \
  @types/bcryptjs
```

Install dev dependencies:

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

---

### TASK 2 — Folder Structure

Create the following folder structure inside `src/`:

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  ← Landing page
│   │   ├── about/page.tsx
│   │   ├── word/page.tsx
│   │   ├── study/page.tsx
│   │   ├── events/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   ├── partner/page.tsx
│   │   ├── confession/page.tsx
│   │   └── forms/[slug]/page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── scripture/page.tsx
│   │       ├── forms/page.tsx
│   │       ├── forms/[id]/entries/page.tsx
│   │       ├── blog/page.tsx
│   │       ├── study/page.tsx
│   │       ├── events/page.tsx
│   │       └── partner/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── scripture/route.ts
│   │   ├── forms/route.ts
│   │   ├── forms/[id]/route.ts
│   │   ├── forms/[id]/entries/route.ts
│   │   ├── blog/route.ts
│   │   ├── events/route.ts
│   │   └── og/scripture/route.ts     ← Satori share card (Node runtime)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                           ← Reusable primitives
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── ScriptureStrip.tsx
│   │   ├── VisionSection.tsx
│   │   ├── ConfessionReveal.tsx
│   │   ├── FromTheShepherd.tsx
│   │   ├── CommunityHighlights.tsx
│   │   └── CTASection.tsx
│   └── shared/
│       ├── AudioPlayer.tsx
│       └── ShareCard.tsx
├── lib/
│   ├── auth.ts                       ← NextAuth config
│   ├── db.ts                         ← Prisma client singleton
│   ├── utils.ts                      ← clsx + twMerge helper
│   ├── ratelimit.ts                  ← Upstash rate limiter
│   └── validations/                  ← Zod schemas
├── middleware.ts                     ← Route protection
├── types/
│   └── index.ts
└── styles/
    └── fonts.ts
```

---

### TASK 3 — Environment Variables

Create `.env.local` with the following keys (leave values as placeholders):

```env
# Database
DATABASE_URL=""

# NextAuth
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# Admin Credentials (seed)
ADMIN_EMAIL=""
ADMIN_PASSWORD=""

# Resend
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@roomforyou.org"

# Uploadthing
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=""
PAYSTACK_SECRET_KEY=""
PAYSTACK_WEBHOOK_SECRET=""

# Flutterwave
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=""
FLUTTERWAVE_SECRET_KEY=""
FLUTTERWAVE_WEBHOOK_SECRET=""

# Payaza
NEXT_PUBLIC_PAYAZA_PUBLIC_KEY=""
PAYAZA_SECRET_KEY=""
PAYAZA_WEBHOOK_SECRET=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Create `.env.example` with the same keys but empty values. Add `.env.local` to `.gitignore`.

---

### TASK 4 — Security: Middleware

Create `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiAdminRoute = pathname.startsWith('/api/admin')
  const isAuthRoute = pathname.startsWith('/api/auth')

  if (isAuthRoute) return NextResponse.next()

  if (isAdminRoute || isApiAdminRoute) {
    if (!req.auth) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

---

### TASK 5 — Security: Rate Limiter

Create `src/lib/ratelimit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
})

export const strictRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 requests per minute (forms, payments)
  analytics: true,
})
```

---

### TASK 6 — Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── AUTH ─────────────────────────────────────────────────────────────

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  SUPER_ADMIN
}

// ─── DAILY SCRIPTURE ──────────────────────────────────────────────────

model Scripture {
  id          String    @id @default(cuid())
  reference   String    // e.g. "John 3:16"
  text        String    @db.Text
  translation String    @default("KJV")
  audioUrl    String?   // Uploadthing URL
  scheduledAt DateTime? // null = random pool
  isActive    Boolean   @default(true)
  displayedOn DateTime? // set when it goes live
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// ─── FORM BUILDER ─────────────────────────────────────────────────────

model Form {
  id               String      @id @default(cuid())
  title            String
  description      String?     @db.Text
  slug             String      @unique
  isActive         Boolean     @default(false)
  notifyEmail      String?     // email to notify on submission
  fields           FormField[]
  submissions      FormSubmission[]
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}

model FormField {
  id           String    @id @default(cuid())
  formId       String
  form         Form      @relation(fields: [formId], references: [id], onDelete: Cascade)
  label        String
  type         FieldType
  placeholder  String?
  required     Boolean   @default(false)
  options      Json?     // For dropdown, radio, checkboxes
  order        Int
  createdAt    DateTime  @default(now())
}

enum FieldType {
  SHORT_TEXT
  LONG_TEXT
  EMAIL
  PHONE
  NUMBER
  DROPDOWN
  RADIO
  CHECKBOXES
  DATE
  FILE_UPLOAD
  LOCATION
}

model FormSubmission {
  id        String                @id @default(cuid())
  formId    String
  form      Form                  @relation(fields: [formId], references: [id], onDelete: Cascade)
  values    FormSubmissionValue[]
  ipAddress String?
  createdAt DateTime              @default(now())
}

model FormSubmissionValue {
  id           String         @id @default(cuid())
  submissionId String
  submission   FormSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  fieldId      String
  fieldLabel   String         // snapshot at time of submission
  value        String         @db.Text
}

// ─── BLOG / DEVOTIONALS ───────────────────────────────────────────────

model Post {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  excerpt     String?     @db.Text
  content     String      @db.Text
  coverImage  String?
  isPublished Boolean     @default(false)
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

// ─── STUDY PORTAL ─────────────────────────────────────────────────────

model StudySeries {
  id          String        @id @default(cuid())
  title       String
  description String?       @db.Text
  order       Int           @default(0)
  materials   StudyMaterial[]
  tasks       StudyTask[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model StudyMaterial {
  id          String      @id @default(cuid())
  seriesId    String
  series      StudySeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  title       String
  fileUrl     String
  fileType    String
  order       Int         @default(0)
  createdAt   DateTime    @default(now())
}

model StudyTask {
  id          String      @id @default(cuid())
  seriesId    String
  series      StudySeries @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  title       String
  description String?     @db.Text
  dueDate     DateTime?
  order       Int         @default(0)
  createdAt   DateTime    @default(now())
}

// ─── EVENTS ───────────────────────────────────────────────────────────

model Event {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  city        String
  venue       String
  date        DateTime
  time        String?
  imageUrl    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── PARTNERSHIP / GIVING ─────────────────────────────────────────────

model GivingRecord {
  id            String        @id @default(cuid())
  donorName     String?
  donorEmail    String?
  amount        Float
  currency      String        @default("NGN")
  gateway       PaymentGateway
  reference     String        @unique
  status        PaymentStatus @default(PENDING)
  meta          Json?
  createdAt     DateTime      @default(now())
}

enum PaymentGateway {
  PAYSTACK
  FLUTTERWAVE
  PAYAZA
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}
```

Run:
```bash
npx prisma generate
npx prisma db push
```

---

### TASK 7 — Design System

#### 7a. Tailwind Config

Update `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#0A0A0A',
          soft: '#111111',
          muted: '#1A1A1A',
        },
        white: {
          DEFAULT: '#FAFAFA',
          soft: '#F0F0F0',
          muted: '#E0E0E0',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C97E',
          dark: '#A8892F',
          glow: 'rgba(201,168,76,0.15)',
        },
        red: {
          brand: '#D0021B',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        'display-2xl': ['clamp(3rem, 8vw, 7rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-xl': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      animation: {
        'gold-shimmer': 'goldShimmer 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        goldShimmer: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
          '50%': { boxShadow: '0 0 24px 4px rgba(201,168,76,0.25)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

#### 7b. Global CSS

Update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-cormorant: 'Cormorant Garamond', serif;
    --font-inter: 'Inter', sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: #0A0A0A;
    color: #FAFAFA;
    font-family: var(--font-inter);
    overflow-x: hidden;
  }

  ::selection {
    background-color: rgba(201, 168, 76, 0.3);
    color: #FAFAFA;
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    background: #0A0A0A;
  }

  ::-webkit-scrollbar-thumb {
    background: #C9A84C;
    border-radius: 2px;
  }
}

@layer utilities {
  .text-gradient-gold {
    background: linear-gradient(135deg, #C9A84C 0%, #E2C97E 50%, #A8892F 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .border-gold-subtle {
    border-color: rgba(201, 168, 76, 0.2);
  }

  .bg-gold-glow {
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 70%);
  }

  .noise-overlay {
    position: relative;
  }

  .noise-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.04;
  }
}
```

#### 7c. Fonts

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Room For You — with Yadah',
  description: 'A worship, prayer, study, mentorship and evangelism community. Jesus to Nations.',
  keywords: ['Room For You', 'Yadah', 'worship', 'prayer', 'bible study', 'community', 'gospel'],
  openGraph: {
    title: 'Room For You — with Yadah',
    description: 'Building a community of young men and women who sing songs of salvation.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

### TASK 8 — Utility Helpers

Create `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
```

---

### TASK 9 — Navbar Component

Create `src/components/layout/Navbar.tsx`:

The navbar must:
- Be **fully transparent** on the landing page, transitioning to a solid `#0A0A0A` background with a subtle gold bottom border on scroll
- Use the **Room For You logo** (place logo file at `public/images/logo-white.png`)
- Show navigation links: **Word · Study · Events · Blog · Partner**
- Have a **"Join Us"** CTA button styled in gold outline, filled on hover
- Be responsive — collapse to a hamburger menu on mobile
- The hamburger opens a full-screen overlay menu in black with gold accents
- Animate with Framer Motion (slide down on mount, smooth scroll-based background transition)

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Blog', href: '/blog' },
  { label: 'Partner', href: '/partner' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setScrolled(latest > 80)
    })
    return unsubscribe
  }, [scrollY])

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-black border-b border-gold-subtle py-3'
            : 'bg-transparent py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/images/logo-white.png"
              alt="Room For You"
              width={120}
              height={60}
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-sm tracking-widest uppercase text-white/70 hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-4">
            <Link
              href="/forms/join-room-for-you"
              className="hidden md:inline-flex items-center px-5 py-2 border border-gold text-gold font-body text-sm tracking-widest uppercase hover:bg-gold hover:text-black transition-all duration-300"
            >
              Join Us
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden text-white"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <Image
                src="/images/logo-white.png"
                alt="Room For You"
                width={120}
                height={60}
                className="h-10 w-auto"
              />
              <button onClick={() => setIsOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 gap-10">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-4xl font-light text-white hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.08 }}
              >
                <Link
                  href="/forms/join-room-for-you"
                  onClick={() => setIsOpen(false)}
                  className="px-8 py-3 border border-gold text-gold font-body tracking-widest uppercase text-sm hover:bg-gold hover:text-black transition-all duration-300"
                >
                  Join Us
                </Link>
              </motion.div>
            </div>

            {/* Bottom gold line */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-6 mb-8" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

### TASK 10 — Landing Page Sections

Build `src/app/(public)/page.tsx` that imports and composes all sections below.

---

#### 10a. Hero Section — `src/components/landing/Hero.tsx`

The hero must deliver immediate cinematic impact:

- **Full viewport height** (`min-h-screen`)
- **Background:** Deep matte black `#0A0A0A` with a subtle radial gold glow at center bottom — `radial-gradient(ellipse 80% 40% at 50% 100%, rgba(201,168,76,0.08), transparent)`
- **Noise texture overlay** (see globals.css utility)
- **Center-aligned content:**
  - Small gold eyebrow text: `"WORSHIP · PRAYER · STUDY · COMMUNITY"` in Inter, 10px, tracked wide, gold color
  - Large display headline using Cormorant Garamond: `"There Is Room"` — massive, bold, white. Then on next line in italic: `"For You."` in gold. Font size: clamp(4rem, 10vw, 9rem)
  - Subtext in Inter Light: `"A community of young men and women singing songs of salvation, studying the Word, and getting others saved. Jesus to nations."` — white/60 opacity, max-w-xl
  - Two CTAs side by side: **"Join the Community"** (gold filled button) and **"Learn More"** (ghost/outline button)
- **Scroll indicator:** A thin vertical line with a small dot that pulses gold, centered at bottom of hero
- **Logo watermark:** The Room For You logo placed large and very low opacity (5%) as a background element, centered
- **Animations:** All elements stagger in with Framer Motion on mount. The gold glow subtly breathes with a CSS animation.
- Add the `Navbar` inside this component so it overlays the hero properly.

```typescript
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } }
  },
  item: {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
  }
}

export function Hero() {
  return (
    <section className="relative min-h-screen bg-black noise-overlay flex flex-col">
      <Navbar />

      {/* Gold glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(201,168,76,0.08), transparent)' }}
      />

      {/* Logo watermark */}
      {/* Place <Image> of logo here at opacity-5, centered, large */}

      {/* Content */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center justify-center flex-1 text-center px-6 pt-24 pb-20"
      >
        <motion.p
          variants={stagger.item}
          className="font-body text-[10px] tracking-[0.35em] uppercase text-gold mb-8"
        >
          Worship · Prayer · Study · Community
        </motion.p>

        <motion.h1
          variants={stagger.item}
          className="font-display font-bold leading-none mb-6"
          style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}
        >
          <span className="text-white block">There Is Room</span>
          <span className="text-gradient-gold italic block">For You.</span>
        </motion.h1>

        <motion.p
          variants={stagger.item}
          className="font-body text-white/60 text-lg max-w-xl mx-auto mb-12 leading-relaxed"
        >
          A community of young men and women singing songs of salvation,
          studying the Word, and getting others saved. Jesus to nations.
        </motion.p>

        <motion.div variants={stagger.item} className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/forms/join-room-for-you"
            className="px-8 py-4 bg-gold text-black font-body text-sm tracking-widest uppercase font-medium hover:bg-gold-light transition-all duration-300 animate-pulse-gold"
          >
            Join the Community
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 border border-white/20 text-white font-body text-sm tracking-widest uppercase hover:border-gold hover:text-gold transition-all duration-300"
          >
            Learn More
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-gold opacity-60" />
        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
      </div>
    </section>
  )
}
```

---

#### 10b. Daily Scripture Strip — `src/components/landing/ScriptureStrip.tsx`

- Fetches today's scripture from `/api/scripture/today` (GET — public, no auth)
- Displays as a full-width dark section with subtle gold top/bottom borders
- Shows: scripture reference (gold, display font), scripture text (white, large, italic), a small custom audio player if audio exists
- The audio player is minimal: play/pause button (gold), progress bar (gold on dark), time display
- A **"Share"** button opens a share modal with auto-generated card preview
- If no scripture today, show a fallback: `"2 Corinthians 5:17"` with the full text

---

#### 10c. Vision Section — `src/components/landing/VisionSection.tsx`

- Two-column layout on desktop, stacked on mobile
- Left: Large display text — `"Building a community"` in Cormorant Garamond, very large, with `"Jesus to Nations"` in gold italic
- Right: Vision text, Mission text (2 Cor 5:17-21 reference), list of community activities (meetings, prayer, study, mentorship, counseling, evangelism)
- Subtle gold vertical divider between columns on desktop
- Background: slightly lighter black `#111111` with the noise overlay
- Scroll-triggered entrance animations with Framer Motion `whileInView`

---

#### 10d. Confession Reveal — `src/components/landing/ConfessionReveal.tsx`

This is the most important section on the page. Build it with maximum care.

- **Full viewport height section**, centered content
- Background: Pure black with a very slow, breathing gold radial glow in the center
- A small label above: `"THE CONFESSION"` in gold, tracked wide
- The confession text is broken into **individual lines/phrases** that animate in **one by one** as the user scrolls through the section
- Use GSAP ScrollTrigger to pin the section and reveal each line sequentially
- Each line fades in and slightly moves up as it enters
- Lines that have passed are slightly dimmed (white/40) while the current line is full white and slightly larger
- The final line `"till his return!"` should trigger a gold glow explosion on the section background
- At the end, a CTA: `"Make This Your Confession"` linking to `/confession`

Confession lines to animate (split exactly as below):
```
"I am saved by grace through faith."
"I am justified and redeemed by the blood of Jesus."
"I have received mercy because of the sacrifice of Jesus on the cross."
"God's love has been shed abroad in my heart"
"and I am sealed with the Holy Spirit."
"I am now a part of God's family!"
"I am committed to learning the value of this family"
"and I grow in both wisdom and stature."
"I am committed to study and prayers!"
"I am saved and I get others saved."
"I am reconciled and I reconcile others."
"On account of me, many come to the knowledge of the Son."
"It's Jesus to nations —"
"and I am a willing vessel!"
"I live my life in honor of the one who died for me,"
"till his return!"
```

---

#### 10e. From The Shepherd — `src/components/landing/FromTheShepherd.tsx`

- A personal, intimate section featuring Minister Yadah
- Background: `#0A0A0A` with a soft warm glow on one side
- Layout: Photo of Yadah on one side (use a placeholder `public/images/yadah-portrait.jpg` for now), personal note on the other
- The note reads (use this as placeholder text, can be updated via CMS later):
  > *"Room For You was born out of a deep conviction — that every young person deserves a community where they are seen, known, and called into purpose. This is not just a ministry. It is a family. And there is room for you here."*
  > **— Minister Yadah**
- Her name should display with the script/signature feel — use Cormorant Garamond italic, large
- A gold signature-style underline beneath her name
- Small Yadah World link at the bottom: `"Visit yadahworld.com →"` in gold

---

#### 10f. Community Highlights — `src/components/landing/CommunityHighlights.tsx`

- A grid of 4 feature cards highlighting what Room For You offers:
  1. **Monthly Meetings** — "Physical gatherings across cities where the Word comes alive."
  2. **Prayer** — "Corporate and personal prayer — we carry each other's burdens."
  3. **Bible Study** — "Deep, consistent study of the Word with structured tasks."
  4. **Mentorship** — "One-on-one counseling and spiritual mentorship."
- Cards are dark (`#111111`) with gold top border, icon (Lucide), title, and description
- Hover state: card lifts, gold glow appears beneath
- Stagger entrance animation with Framer Motion `whileInView`

---

#### 10g. CTA Section — `src/components/landing/CTASection.tsx`

- Full-width section, black background
- Centered bold display text: `"The door is open."` in Cormorant Garamond, very large, italic, gold
- Below: `"Step in. There is room for you."` in white, Inter
- A single CTA button: `"Join the Community"` — gold, large
- A thin horizontal gold line above and below the section

---

### TASK 11 — Footer

Create `src/components/layout/Footer.tsx`:

- Black background, gold top border line
- Logo on the left
- Links: Word · Study · Events · Blog · Partner · About
- Mission statement: `"Jesus to Nations — 2 Cor 5:17-21"`
- Social links (icons): Instagram, YouTube, Twitter/X — use Lucide or simple SVGs
- Copyright: `"© 2025 Room For You. A SonsHub Media Initiative."`
- All in Inter, small, white/50 opacity

---

### TASK 12 — Compose Landing Page

Update `src/app/(public)/page.tsx`:

```typescript
import { Hero } from '@/components/landing/Hero'
import { ScriptureStrip } from '@/components/landing/ScriptureStrip'
import { VisionSection } from '@/components/landing/VisionSection'
import { ConfessionReveal } from '@/components/landing/ConfessionReveal'
import { FromTheShepherd } from '@/components/landing/FromTheShepherd'
import { CommunityHighlights } from '@/components/landing/CommunityHighlights'
import { CTASection } from '@/components/landing/CTASection'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ScriptureStrip />
      <VisionSection />
      <ConfessionReveal />
      <FromTheShepherd />
      <CommunityHighlights />
      <CTASection />
      <Footer />
    </main>
  )
}
```

---

### TASK 13 — Scripture API Route (Public)

Create `src/app/api/scripture/today/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // First: check for a scheduled scripture for today
    let scripture = await db.scripture.findFirst({
      where: {
        scheduledAt: { gte: today, lt: tomorrow },
        isActive: true,
      },
    })

    // Fallback: pick randomly from the pool (no scheduledAt)
    if (!scripture) {
      const pool = await db.scripture.findMany({
        where: { scheduledAt: null, isActive: true },
      })
      if (pool.length > 0) {
        // Seed random by date so it's consistent for the full day
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
        const index = seed % pool.length
        scripture = pool[index]
      }
    }

    if (!scripture) {
      // Hardcoded fallback
      return NextResponse.json({
        reference: '2 Corinthians 5:17',
        text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
        translation: 'NIV',
        audioUrl: null,
      })
    }

    return NextResponse.json(scripture)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scripture' }, { status: 500 })
  }
}
```

---

### TASK 14 — Prisma Client Singleton

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

---

### TASK 15 — Security Headers

Update `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.paystack.co https://api.flutterwave.com",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' }, // Uploadthing
    ],
  },
}

export default nextConfig
```

---

### TASK 16 — Vercel Config

Create `vercel.json` in the project root:

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["lhr1"]
}
```

---

## PHASE 1 COMPLETION CHECKLIST

Before moving to Phase 2, verify:

- [ ] `npm run dev` runs without errors
- [ ] Landing page renders all 7 sections
- [ ] Navbar scroll behavior works correctly
- [ ] Mobile menu opens and closes
- [ ] Confession reveal animates on scroll
- [ ] Scripture strip shows fallback when DB is empty
- [ ] All TypeScript errors resolved
- [ ] `npm run build` completes successfully
- [ ] Deployed to Vercel with environment variables set
- [ ] Security headers present (verify via https://securityheaders.com)

---

## NOTES FOR CURSOR

- All components are `'use client'` only when they use hooks or browser APIs. Keep server components as default wherever possible.
- Never use `any` type — use `unknown` and narrow properly.
- All API routes must be `export const runtime = 'nodejs'` — never edge runtime.
- Keep the design system strictly to: `#0A0A0A`, `#FAFAFA`, `#C9A84C`, `#D0021B` (micro-accent only).
- Red (`#D0021B`) is never used for buttons or backgrounds — only for small typographic accents, badges, or highlights, mirroring its use in the logo.
- The logo file path is `public/images/logo-white.png` — Nony will place the actual PNG there.
- `yadahworld.com` should be referenced as Yadah's personal website where relevant.
- Phase 2 will build the full Form Builder system.
