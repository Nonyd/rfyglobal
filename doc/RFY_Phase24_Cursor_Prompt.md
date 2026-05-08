# ROOM FOR YOU — Phase 24 Cursor Prompt
## Contact Page · FAQs Page · CMS Integration

---

## CONTEXT

Two new public pages:

1. **Contact page** (`/contact`) — form that creates a message thread in admin messaging system, plus social links. All content editable via Site CMS.

2. **FAQs page** (`/faq`) — grouped categories with accordion questions inside each group. All FAQ content managed via Site CMS.

Both pages wired to `/admin/cms` for content editing.

---

## TASK 1 — Prisma Schema: FAQ Model

Add to `prisma/schema.prisma`:

```prisma
model FaqCategory {
  id        String    @id @default(cuid())
  title     String
  order     Int       @default(0)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  faqs      Faq[]
}

model Faq {
  id         String      @id @default(cuid())
  question   String      @db.Text
  answer     String      @db.Text
  categoryId String
  category   FaqCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  order      Int         @default(0)
  isActive   Boolean     @default(true)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}
```

Run: `npx prisma db push`

---

## TASK 2 — Contact API Route

Create `src/app/api/contact/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'

export const runtime = 'nodejs'

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(3000),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`contact:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, subject, message } = parsed.data

  // Create a message thread in the admin messaging system
  await db.messageThread.create({
    data: {
      recipientEmail: email,
      recipientName: name,
      subject: `[Contact] ${subject}`,
      lastMessage: message,
      lastAt: new Date(),
      isRead: false,
      messages: {
        create: {
          body: `**From:** ${name} (${email})\n\n${message}`,
          fromAdmin: false, // incoming message from public
          sentAt: new Date(),
        },
      },
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
```

---

## TASK 3 — FAQ API Routes

Create `src/app/api/faq/route.ts` — public GET:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const categories = await db.faqCategory.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      faqs: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  return NextResponse.json(categories)
}
```

Create `src/app/api/admin/faq/route.ts` — admin CRUD:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await db.faqCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      faqs: { orderBy: { order: 'asc' } },
      _count: { select: { faqs: true } },
    },
  })

  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.type === 'category') {
    const maxOrder = await db.faqCategory.count()
    const category = await db.faqCategory.create({
      data: { title: body.title, order: maxOrder },
    })
    return NextResponse.json(category, { status: 201 })
  }

  if (body.type === 'faq') {
    const maxOrder = await db.faq.count({ where: { categoryId: body.categoryId } })
    const faq = await db.faq.create({
      data: {
        question: body.question,
        answer: body.answer,
        categoryId: body.categoryId,
        order: maxOrder,
      },
    })
    return NextResponse.json(faq, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
```

Create `src/app/api/admin/faq/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Try FAQ first, then category
  if (body.type === 'category') {
    const category = await db.faqCategory.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })
    return NextResponse.json(category)
  }

  const faq = await db.faq.update({
    where: { id: params.id },
    data: {
      ...(body.question !== undefined && { question: body.question }),
      ...(body.answer !== undefined && { answer: body.answer }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })
  return NextResponse.json(faq)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  if (body.type === 'category') {
    // Cascade deletes FAQs via Prisma relation
    await db.faqCategory.delete({ where: { id: params.id } })
  } else {
    await db.faq.delete({ where: { id: params.id } })
  }

  return NextResponse.json({ success: true })
}
```

---

## TASK 4 — Contact Page

Create `src/app/(public)/contact/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ContactClient } from '@/components/contact/ContactClient'
import { getContentMany } from '@/lib/content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Room For You',
  description: 'Get in touch with the Room For You team.',
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const content = await getContentMany([
    'contact.heading',
    'contact.subheading',
    'contact.email',
    'contact.whatsapp',
    'contact.instagram',
    'contact.youtube',
    'contact.twitter',
    'contact.address',
  ])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24">
        <ContactClient content={content} />
      </main>
      <Footer />
    </>
  )
}
```

Create `src/components/contact/ContactClient.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram, Youtube, Twitter, Mail, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface ContactClientProps {
  content: Record<string, string>
}

export function ContactClient({ content }: ContactClientProps) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#F8F8F8',
    padding: '14px 16px',
    fontSize: '14px',
    fontFamily: 'General Sans, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: '#A0A0A0',
    marginBottom: '8px',
    fontFamily: 'General Sans, sans-serif',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to send message')
      setSubmitted(true)
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const socialLinks = [
    {
      icon: <Instagram size={18} />,
      label: 'Instagram',
      href: content['contact.instagram'] || 'https://instagram.com/roomforyou',
      handle: '@roomforyou',
    },
    {
      icon: <Youtube size={18} />,
      label: 'YouTube',
      href: content['contact.youtube'] || 'https://youtube.com/@roomforyou',
      handle: 'Room For You',
    },
    {
      icon: <Twitter size={18} />,
      label: 'X (Twitter)',
      href: content['contact.twitter'] || 'https://x.com/roomforyou',
      handle: '@roomforyou',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6">

      {/* Header */}
      <div className="mb-16">
        <p className="label-text mb-4">Get In Touch</p>
        <h1 className="font-display text-snow font-bold mb-4"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
          {content['contact.heading'] || 'We would love\nto hear from you.'}
        </h1>
        <div className="gold-line-left w-12 mb-6 opacity-50" />
        <p className="font-body text-mist max-w-lg leading-relaxed">
          {content['contact.subheading'] || 'Reach out with questions, partnership enquiries, or just to say hello. We read every message.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

        {/* Left — form (3 cols) */}
        <div className="lg:col-span-3">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-6"
                style={{ borderColor: '#C9A84C' }}>
                <Send size={20} className="text-gold" />
              </div>
              <div className="gold-line max-w-[60px] mx-auto mb-6 opacity-30" />
              <h2 className="font-display text-snow text-3xl font-bold mb-3">Message sent.</h2>
              <p className="font-body text-mist">
                We received your message and will get back to you soon.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject *</label>
                <input
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="What is this about?"
                  required
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
              </div>

              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Write your message here..."
                  required
                  rows={7}
                  style={{ ...inputStyle, resize: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')}
                />
                <p className="font-body text-xs mt-1 text-right"
                  style={{ color: form.message.length > 2700 ? '#F87171' : '#585858' }}>
                  {form.message.length}/3000
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 font-body font-semibold text-xs tracking-widest uppercase transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#C9A84C', color: '#0F0F0F' }}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'rgba(0,0,0,0.3)', borderTopColor: 'transparent' }} />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right — contact info (2 cols) */}
        <div className="lg:col-span-2 space-y-10">

          {/* Email */}
          {content['contact.email'] && (
            <div>
              <p className="label-text mb-3">Email</p>
              <a
                href={`mailto:${content['contact.email']}`}
                className="font-body text-mist hover:text-gold transition-colors"
              >
                {content['contact.email']}
              </a>
            </div>
          )}

          {/* Address */}
          {content['contact.address'] && (
            <div>
              <p className="label-text mb-3">Location</p>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gold shrink-0 mt-0.5" />
                <p className="font-body text-mist text-sm leading-relaxed">
                  {content['contact.address']}
                </p>
              </div>
            </div>
          )}

          {/* Social links */}
          <div>
            <p className="label-text mb-4">Find Us</p>
            <div className="space-y-3">
              {socialLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group transition-all"
                >
                  <div className="w-9 h-9 flex items-center justify-center border transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#585858' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#C9A84C'
                      e.currentTarget.style.color = '#C9A84C'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.color = '#585858'
                    }}
                  >
                    {link.icon}
                  </div>
                  <div>
                    <p className="font-body text-xs text-fog">{link.label}</p>
                    <p className="font-body text-sm text-mist group-hover:text-gold transition-colors">
                      {link.handle}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Response time note */}
          <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
            <p className="font-body text-xs leading-relaxed" style={{ color: '#585858' }}>
              We typically respond within 24–48 hours.
              For urgent prayer needs, visit our{' '}
              <a href="/prayer" className="text-gold hover:opacity-70 transition-opacity">
                Prayer Wall
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## TASK 5 — FAQ Page

Create `src/app/(public)/faq/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FaqClient } from '@/components/faq/FaqClient'
import { db } from '@/lib/db'
import { getContentMany } from '@/lib/content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs — Room For You',
  description: 'Frequently asked questions about Room For You.',
}

export const dynamic = 'force-dynamic'

export default async function FaqPage() {
  const [categories, content] = await Promise.all([
    db.faqCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        faqs: { where: { isActive: true }, orderBy: { order: 'asc' } },
      },
    }),
    getContentMany([
      'faq.heading',
      'faq.subheading',
    ]),
  ])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="label-text mb-4">Help & Support</p>
          <h1 className="font-display text-snow font-bold mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            {content['faq.heading'] || 'Frequently Asked\nQuestions.'}
          </h1>
          <div className="gold-line-left w-12 mb-6 opacity-50" />
          <p className="font-body text-mist max-w-lg leading-relaxed mb-16">
            {content['faq.subheading'] || "Can't find what you're looking for? Reach out via our contact page."}
          </p>
          <FaqClient categories={categories} />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

Create `src/components/faq/FaqClient.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Minus } from 'lucide-react'
import Link from 'next/link'

interface FaqItem {
  id: string
  question: string
  answer: string
  order: number
}

interface FaqCategoryData {
  id: string
  title: string
  faqs: FaqItem[]
}

export function FaqClient({ categories }: { categories: FaqCategoryData[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')

  const toggleFaq = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredCategories = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory)

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-snow text-2xl mb-3">FAQs coming soon.</p>
        <p className="font-body text-mist">
          In the meantime,{' '}
          <Link href="/contact" className="text-gold hover:opacity-70 transition-opacity">
            contact us directly
          </Link>.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-4 py-2 font-body text-xs tracking-wide transition-all"
            style={{
              background: activeCategory === 'all' ? '#C9A84C' : 'transparent',
              color: activeCategory === 'all' ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
              border: activeCategory === 'all' ? 'none' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            All Topics
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-2 font-body text-xs tracking-wide transition-all"
              style={{
                background: activeCategory === cat.id ? '#C9A84C' : 'transparent',
                color: activeCategory === cat.id ? '#0F0F0F' : 'rgba(248,248,248,0.5)',
                border: activeCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* FAQ groups */}
      <div className="space-y-12">
        {filteredCategories.map((category, catIdx) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: catIdx * 0.05 }}
          >
            {/* Category heading */}
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-display text-gold text-xl font-semibold">
                {category.title}
              </h2>
              <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />
              <p className="font-body text-xs" style={{ color: '#585858' }}>
                {category.faqs.length} {category.faqs.length === 1 ? 'question' : 'questions'}
              </p>
            </div>

            {/* Accordion items */}
            <div className="space-y-2">
              {category.faqs.map((faq) => {
                const isOpen = openIds.has(faq.id)
                return (
                  <div
                    key={faq.id}
                    className="border transition-all duration-200"
                    style={{
                      borderColor: isOpen ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)',
                      background: isOpen ? 'rgba(201,168,76,0.03)' : 'transparent',
                    }}
                  >
                    {/* Question */}
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                    >
                      <p className="font-body font-medium text-sm leading-relaxed"
                        style={{ color: isOpen ? '#F8F8F8' : '#C8C0B4' }}>
                        {faq.question}
                      </p>
                      <span className="shrink-0 transition-transform duration-300"
                        style={{
                          color: '#C9A84C',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}>
                        <ChevronDown size={16} />
                      </span>
                    </button>

                    {/* Answer */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-6 pb-5 pt-0">
                            <div className="h-px mb-4" style={{ background: 'rgba(201,168,76,0.15)' }} />
                            <p className="font-body text-sm leading-relaxed"
                              style={{ color: '#A0A0A0' }}>
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 pt-12 border-t text-center"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="font-body text-mist mb-4">
          Still have questions?
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-3 font-body text-xs font-semibold tracking-widest uppercase border transition-all"
          style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#C9A84C'
            e.currentTarget.style.color = '#0F0F0F'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#C9A84C'
          }}
        >
          Contact Us →
        </Link>
      </div>
    </div>
  )
}
```

---

## TASK 6 — Admin FAQ Manager

Create `src/app/admin/(dashboard)/faq/page.tsx`:

```typescript
import { FaqManager } from '@/components/admin/faq/FaqManager'

export default function FaqAdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold" style={{ color: 'var(--a-text)' }}>
          FAQs
        </h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--a-text-muted)' }}>
          Manage FAQ categories and questions for the public /faq page.
        </p>
      </div>
      <FaqManager />
    </div>
  )
}
```

Create `src/components/admin/faq/FaqManager.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { AdminToggle } from '@/components/shared/Toggle'
import toast from 'react-hot-toast'

// Full FAQ manager with:
// - Left: categories list with Add Category button
// - Right: FAQs for selected category with Add FAQ button
// - Inline edit for both categories and FAQs
// - Reorder via up/down arrows
// - Delete with confirm
// - Active/inactive toggle on each item

export function FaqManager() {
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // New category form
  const [newCategoryTitle, setNewCategoryTitle] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  // New FAQ form
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' })
  const [addingFaq, setAddingFaq] = useState(false)

  // Edit states
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [editCategoryTitle, setEditCategoryTitle] = useState('')
  const [editFaqId, setEditFaqId] = useState<string | null>(null)
  const [editFaq, setEditFaq] = useState({ question: '', answer: '' })

  useEffect(() => { loadFaqs() }, [])

  const loadFaqs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/faq')
      const data = await res.json()
      setCategories(data)
      if (!selectedCategoryId && data.length > 0) {
        setSelectedCategoryId(data[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  const addCategory = async () => {
    if (!newCategoryTitle.trim()) return
    const res = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category', title: newCategoryTitle }),
    })
    if (res.ok) {
      toast.success('Category added')
      setNewCategoryTitle('')
      setAddingCategory(false)
      await loadFaqs()
    }
  }

  const addFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim() || !selectedCategoryId) return
    const res = await fetch('/api/admin/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faq', ...newFaq, categoryId: selectedCategoryId }),
    })
    if (res.ok) {
      toast.success('FAQ added')
      setNewFaq({ question: '', answer: '' })
      setAddingFaq(false)
      await loadFaqs()
    }
  }

  const updateCategory = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/faq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category', ...data }),
    })
    if (res.ok) { await loadFaqs() }
    else { toast.error('Failed to update') }
  }

  const updateFaq = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/faq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { toast.success('Saved'); await loadFaqs() }
    else { toast.error('Failed to update') }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its FAQs?')) return
    await fetch(`/api/admin/faq/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category' }),
    })
    toast.success('Category deleted')
    if (selectedCategoryId === id) setSelectedCategoryId(null)
    await loadFaqs()
  }

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    await fetch(`/api/admin/faq/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'faq' }),
    })
    toast.success('FAQ deleted')
    await loadFaqs()
  }

  return (
    <div className="flex gap-6">
      {/* Left: categories */}
      <div className="w-64 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-xs uppercase tracking-widest"
            style={{ color: 'var(--a-text-muted)' }}>Categories</p>
          <button
            onClick={() => setAddingCategory(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-body"
            style={{ background: 'var(--a-gold)', color: '#0F0F0F' }}
          >
            <Plus size={11} /> Add
          </button>
        </div>

        {/* Add category form */}
        {addingCategory && (
          <div className="mb-3 p-3 border" style={{ borderColor: 'var(--a-border)' }}>
            <input
              value={newCategoryTitle}
              onChange={e => setNewCategoryTitle(e.target.value)}
              placeholder="Category title"
              className="w-full px-3 py-2 text-sm font-body border mb-2"
              style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={addCategory}
                className="flex-1 py-1.5 text-xs font-body font-medium text-white"
                style={{ background: 'var(--a-gold)' }}>
                Add
              </button>
              <button onClick={() => { setAddingCategory(false); setNewCategoryTitle('') }}
                className="px-3 py-1.5 text-xs font-body border"
                style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category list */}
        <div className="space-y-1">
          {categories.map(cat => (
            <div key={cat.id}>
              {editCategoryId === cat.id ? (
                <div className="p-2 border" style={{ borderColor: 'var(--a-gold-border)' }}>
                  <input
                    value={editCategoryTitle}
                    onChange={e => setEditCategoryTitle(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm font-body border mb-2"
                    style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        updateCategory(cat.id, { title: editCategoryTitle })
                        setEditCategoryId(null)
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button onClick={() => { updateCategory(cat.id, { title: editCategoryTitle }); setEditCategoryId(null) }}
                      className="flex-1 py-1 text-xs font-body text-white"
                      style={{ background: 'var(--a-gold)' }}>Save</button>
                    <button onClick={() => setEditCategoryId(null)}
                      className="px-2 py-1 text-xs font-body border"
                      style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>✕</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left border transition-all group"
                  style={{
                    borderColor: selectedCategoryId === cat.id ? 'var(--a-gold-border)' : 'var(--a-border)',
                    background: selectedCategoryId === cat.id ? 'var(--a-gold-light)' : 'var(--a-surface)',
                  }}
                >
                  <p className="flex-1 font-body text-xs font-medium truncate"
                    style={{ color: selectedCategoryId === cat.id ? 'var(--a-gold)' : 'var(--a-text)' }}>
                    {cat.title}
                  </p>
                  <span className="text-[10px] font-body opacity-50"
                    style={{ color: 'var(--a-text-muted)' }}>
                    {cat._count?.faqs ?? cat.faqs?.length ?? 0}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <span onClick={e => { e.stopPropagation(); setEditCategoryId(cat.id); setEditCategoryTitle(cat.title) }}
                      className="p-0.5 transition-colors"
                      style={{ color: 'var(--a-text-muted)' }}>
                      <Pencil size={10} />
                    </span>
                    <span onClick={e => { e.stopPropagation(); deleteCategory(cat.id) }}
                      className="p-0.5 transition-colors"
                      style={{ color: 'var(--a-text-muted)' }}>
                      <Trash2 size={10} />
                    </span>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: FAQs */}
      <div className="flex-1 min-w-0">
        {!selectedCategory ? (
          <div className="flex items-center justify-center h-48 border border-dashed"
            style={{ borderColor: 'var(--a-border)' }}>
            <p className="font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
              Select or create a category
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold"
                  style={{ color: 'var(--a-text)' }}>
                  {selectedCategory.title}
                </h2>
                <p className="font-body text-xs mt-0.5"
                  style={{ color: 'var(--a-text-muted)' }}>
                  {selectedCategory.faqs?.length ?? 0} questions
                </p>
              </div>
              <button
                onClick={() => setAddingFaq(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-body font-medium text-white"
                style={{ background: 'var(--a-gold)' }}
              >
                <Plus size={12} /> Add FAQ
              </button>
            </div>

            {/* Add FAQ form */}
            {addingFaq && (
              <div className="mb-4 p-4 border" style={{ borderColor: 'var(--a-gold-border)', background: 'var(--a-gold-light)' }}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-body mb-1"
                      style={{ color: 'var(--a-text-secondary)' }}>Question *</label>
                    <input
                      value={newFaq.question}
                      onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))}
                      placeholder="Enter the question..."
                      className="w-full px-3 py-2.5 text-sm font-body border"
                      style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-body mb-1"
                      style={{ color: 'var(--a-text-secondary)' }}>Answer *</label>
                    <textarea
                      value={newFaq.answer}
                      onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))}
                      placeholder="Enter the answer..."
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm font-body border resize-none"
                      style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addFaq}
                      className="px-4 py-2 text-xs font-body font-medium text-white"
                      style={{ background: 'var(--a-gold)' }}>
                      Add FAQ
                    </button>
                    <button onClick={() => { setAddingFaq(false); setNewFaq({ question: '', answer: '' }) }}
                      className="px-4 py-2 text-xs font-body border"
                      style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ list */}
            <div className="space-y-2">
              {(selectedCategory.faqs ?? []).map((faq: any) => (
                <div key={faq.id} className="border"
                  style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}>
                  {editFaqId === faq.id ? (
                    <div className="p-4 space-y-3">
                      <input
                        value={editFaq.question}
                        onChange={e => setEditFaq(p => ({ ...p, question: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm font-body border"
                        style={{ background: 'var(--a-bg)', borderColor: 'var(--a-gold-border)', color: 'var(--a-text)' }}
                        placeholder="Question"
                        autoFocus
                      />
                      <textarea
                        value={editFaq.answer}
                        onChange={e => setEditFaq(p => ({ ...p, answer: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2.5 text-sm font-body border resize-none"
                        style={{ background: 'var(--a-bg)', borderColor: 'var(--a-border)', color: 'var(--a-text)' }}
                        placeholder="Answer"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { updateFaq(faq.id, { question: editFaq.question, answer: editFaq.answer }); setEditFaqId(null) }}
                          className="px-4 py-2 text-xs font-body font-medium text-white"
                          style={{ background: 'var(--a-gold)' }}>
                          Save
                        </button>
                        <button onClick={() => setEditFaqId(null)}
                          className="px-4 py-2 text-xs font-body border"
                          style={{ borderColor: 'var(--a-border)', color: 'var(--a-text-muted)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium mb-1"
                          style={{ color: 'var(--a-text)' }}>
                          {faq.question}
                        </p>
                        <p className="font-body text-xs leading-relaxed line-clamp-2"
                          style={{ color: 'var(--a-text-muted)' }}>
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <AdminToggle
                          checked={faq.isActive}
                          onChange={val => updateFaq(faq.id, { isActive: val })}
                          size="sm"
                        />
                        <button
                          onClick={() => { setEditFaqId(faq.id); setEditFaq({ question: faq.question, answer: faq.answer }) }}
                          className="p-1.5 transition-colors"
                          style={{ color: 'var(--a-text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteFaq(faq.id)}
                          className="p-1.5 transition-colors"
                          style={{ color: 'var(--a-text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--a-red)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--a-text-muted)')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {(selectedCategory.faqs ?? []).length === 0 && !addingFaq && (
                <div className="flex flex-col items-center justify-center h-32 border border-dashed"
                  style={{ borderColor: 'var(--a-border)' }}>
                  <p className="font-body text-sm mb-2" style={{ color: 'var(--a-text-muted)' }}>
                    No FAQs in this category yet
                  </p>
                  <button onClick={() => setAddingFaq(true)}
                    className="font-body text-xs"
                    style={{ color: 'var(--a-gold)' }}>
                    + Add first FAQ
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

---

## TASK 7 — Wire Contact + FAQ to Site CMS

Open `src/app/admin/(dashboard)/cms/page.tsx`.

Add two new CMS sections to the existing CMS editor:

```typescript
// Add to CMS_SECTIONS array:
{
  title: 'Contact Page',
  fields: [
    { key: 'contact.heading', label: 'Page Heading', type: 'TEXT', description: 'Main heading on the contact page' },
    { key: 'contact.subheading', label: 'Subheading', type: 'TEXT', description: 'Paragraph below the heading' },
    { key: 'contact.email', label: 'Contact Email', type: 'TEXT', description: 'Email address shown on the contact page' },
    { key: 'contact.address', label: 'Address / Location', type: 'TEXT', description: 'Physical address or city shown on contact page' },
    { key: 'contact.instagram', label: 'Instagram URL', type: 'TEXT', description: 'Full URL e.g. https://instagram.com/roomforyou' },
    { key: 'contact.youtube', label: 'YouTube URL', type: 'TEXT', description: 'Full URL e.g. https://youtube.com/@roomforyou' },
    { key: 'contact.twitter', label: 'X (Twitter) URL', type: 'TEXT', description: 'Full URL e.g. https://x.com/roomforyou' },
  ],
},
{
  title: 'FAQs Page',
  fields: [
    { key: 'faq.heading', label: 'Page Heading', type: 'TEXT', description: 'Main heading on the FAQ page' },
    { key: 'faq.subheading', label: 'Subheading', type: 'TEXT', description: 'Paragraph below the heading' },
  ],
},
```

Note: FAQ questions and answers themselves are managed via `/admin/faq`, not the CMS. The CMS only controls the page header text.

---

## TASK 8 — Add to Sidebar Navigation

Open `src/components/admin/AdminSidebar.tsx`.

Add to CONTENT section:
```typescript
{ label: 'FAQs', href: '/admin/faq', icon: HelpCircle },
```

Import `HelpCircle` from lucide-react.

---

## TASK 9 — Add to Navbar and Footer

**Navbar** — add Contact to nav links:
```typescript
{ label: 'Contact', href: '/contact' },
```

**Footer** — add FAQ and Contact links to the community links section (in `FooterInteractive.tsx`):
```typescript
// Add to FooterCommunityLinks or create a new footer section:
<a href="/contact" ...>Contact</a>
<a href="/faq" ...>FAQs</a>
```

---

## TASK 10 — Seed Default FAQ Content

Add a seed call at the end of `prisma/seed.ts` (or create a one-time seed) to populate default FAQ content:

```typescript
// Default FAQ categories and questions for Room For You
const faqData = [
  {
    title: 'About Room For You',
    faqs: [
      {
        question: 'What is Room For You?',
        answer: 'Room For You is a community of young men and women singing songs of salvation, studying the Word, praying, and getting others saved. It is founded and led by Minister Yadah, an international gospel minister.',
      },
      {
        question: 'Who is Room For You for?',
        answer: 'Room For You is for anyone who wants to grow in their faith, build community with other believers, and be equipped to live out the Gospel. You do not need to have any prior church background — you just need to be willing.',
      },
      {
        question: 'Is Room For You a church?',
        answer: 'Room For You is a community movement, not a denominational church. We gather monthly across cities for worship, prayer, and Bible study. We encourage members to be rooted in a local church while also being part of this community.',
      },
    ],
  },
  {
    title: 'Joining & Membership',
    faqs: [
      {
        question: 'How do I join Room For You?',
        answer: 'Simply fill out the Join form on our website at rfyglobal.org/join. It takes less than two minutes. Once you submit, you will receive a confirmation email and be added to our WhatsApp community.',
      },
      {
        question: 'Is there a membership fee?',
        answer: 'No. Joining Room For You is completely free. We believe there should never be a financial barrier to community and fellowship.',
      },
      {
        question: 'Can I join if I am not in Nigeria?',
        answer: 'Absolutely. Room For You is a global community. While our physical gatherings currently focus on Nigerian cities, our online community, daily Word, study portal, and resources are available to everyone worldwide.',
      },
    ],
  },
  {
    title: 'Events & Gatherings',
    faqs: [
      {
        question: 'How often does Room For You gather?',
        answer: 'We gather monthly in various cities. Each gathering features worship, prayer, and teaching from the Word. Check the Events page for upcoming dates and locations near you.',
      },
      {
        question: 'Do I need to register for events?',
        answer: 'Yes, we ask that you register in advance so we can plan appropriately. Registration is free and takes only a moment. You can register on the Events page for each specific gathering.',
      },
      {
        question: 'Are events open to the public?',
        answer: 'Yes, our gatherings are open to everyone — you do not need to be a registered community member to attend. However, we encourage you to join the community so you can stay connected and receive updates.',
      },
    ],
  },
  {
    title: 'Prayer & Testimonies',
    faqs: [
      {
        question: 'How does the Prayer Wall work?',
        answer: 'You can submit a prayer request on our Prayer Wall page. Your request is completely private — only Minister Yadah and the Room For You prayer team will see it. You must be a registered community member to submit a prayer request.',
      },
      {
        question: 'Can I submit a testimony anonymously?',
        answer: 'Yes. When submitting a testimony, you can choose to submit anonymously. Your name will not appear on the public testimony page, though your email is required to verify your community membership.',
      },
    ],
  },
  {
    title: 'Giving & Partnership',
    faqs: [
      {
        question: 'How can I partner with Room For You financially?',
        answer: 'You can give via the Partner page on our website. We accept one-time gifts, monthly giving, and annual partnerships via Paystack, Flutterwave, and direct bank transfer. Every gift goes toward funding gatherings, study resources, and outreach.',
      },
      {
        question: 'Is my giving tax-deductible?',
        answer: 'Room For You operates under SonsHub Media Ltd in Nigeria. Tax deductibility depends on your country of residence and local tax laws. We recommend consulting a tax adviser in your jurisdiction.',
      },
      {
        question: 'Can I request a refund on my gift?',
        answer: 'All financial gifts to Room For You are voluntary and generally non-refundable. However, if a duplicate payment or technical error occurred, please contact us at partner@rfyglobal.org within 14 days and we will review your request.',
      },
    ],
  },
]

// Seed the data (run once):
for (const category of faqData) {
  const cat = await db.faqCategory.create({
    data: { title: category.title, order: faqData.indexOf(category) },
  })
  for (const [i, faq] of category.faqs.entries()) {
    await db.faq.create({
      data: { question: faq.question, answer: faq.answer, categoryId: cat.id, order: i },
    })
  }
}
```

Run seeding with:
```powershell
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

Or add to the existing seed script and run `npx prisma db seed`.

---

## PHASE 24 COMPLETION CHECKLIST

**Schema**
- [ ] `FaqCategory` model created
- [ ] `Faq` model created
- [ ] `npx prisma db push` succeeds

**Contact Page**
- [ ] `/contact` loads correctly
- [ ] Form submits and creates thread in `/admin/messages`
- [ ] Success state shows after submission
- [ ] Social links show (Instagram, YouTube, X)
- [ ] Admin receives the message in `/admin/messages` with `[Contact]` prefix in subject

**FAQ Page**
- [ ] `/faq` loads with seeded content
- [ ] Category filter pills work
- [ ] Accordion expands/collapses smoothly
- [ ] "Contact Us" CTA at bottom links to `/contact`

**Admin FAQ Manager**
- [ ] `/admin/faq` in sidebar
- [ ] Add category works
- [ ] Add FAQ to category works
- [ ] Edit category title works
- [ ] Edit FAQ question/answer works
- [ ] Delete category (with all FAQs) works
- [ ] Delete individual FAQ works
- [ ] Active/inactive toggle works

**CMS Integration**
- [ ] Contact section in `/admin/cms`
- [ ] FAQ heading/subheading in `/admin/cms`
- [ ] Changes reflect immediately on public pages

**Navigation**
- [ ] Contact link in navbar
- [ ] FAQ and Contact links in footer

**Build**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Contact form messages are stored as `MessageThread` with `fromAdmin: false` on the `Message` — this marks them as incoming (from the public). The admin can see them in `/admin/messages` with the `[Contact]` prefix in the subject making them easy to identify.
- The FAQ seed data should only run once. Add a check: `const existing = await db.faqCategory.count(); if (existing > 0) return` at the start of the FAQ seeding block to prevent duplicate seeding on re-runs.
- `FaqClient` uses `AnimatePresence` with `height: 0` → `height: auto` — this is the standard Framer Motion accordion pattern. The `overflow: hidden` on the motion div is required for the height animation to work.
- The admin FAQ manager is a two-panel layout (categories left, FAQs right) similar to the gallery manager — consistent with the admin UI pattern used throughout the app.
- The CMS only manages page-level content (headings, subheadings). The actual FAQ questions/answers are managed via the dedicated `/admin/faq` page, not the CMS. This is the right separation — CMS for static text, dedicated managers for structured data.
