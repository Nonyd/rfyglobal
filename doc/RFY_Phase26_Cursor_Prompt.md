# ROOM FOR YOU — Phase 26 Cursor Prompt
## Full SEO + AI Search Optimization

---

## CONTEXT

Full technical SEO, structured data (JSON-LD schema), and AI search optimization for rfyglobal.org.

**Target audience:** Global English-speaking Christian audience
**Primary search intents:**
1. Christian community discovery ("Christian community Abuja", "gospel community Nigeria")
2. Minister Yadah ("Minister Yadah", "Yadah gospel artist", "Yadah Room For You")
3. Gospel events ("gospel events Abuja", "Room For You event")

**Rules:**
- Nothing visible changes on the public site
- No changes to any text, layout, colors, or UI elements
- No changes to browser tab titles or visible headings
- Only metadata, structured data, sitemaps, and invisible optimization

---

## TASK 1 — Root Metadata in layout.tsx

Open `src/app/layout.tsx`.

Replace or update the root `metadata` export with a comprehensive base metadata object:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://rfyglobal.org'),

  title: {
    default: 'Room For You — A Christian Community with Minister Yadah',
    template: '%s | Room For You',
  },

  description:
    'Room For You is a global Christian community founded by Minister Yadah. We gather monthly across cities for worship, prayer, and Bible study. Join us — there is room for you here.',

  keywords: [
    'Room For You',
    'Minister Yadah',
    'Yadah',
    'Christian community',
    'gospel community Nigeria',
    'Christian community Abuja',
    'gospel events Abuja',
    'Christian events Nigeria',
    'SonsHub Media',
    'gospel ministry',
    'Room For You with Yadah',
    'Jesus to Nations',
    'Christian worship community',
    'evangelical community Nigeria',
    'Yadah music ministry',
  ],

  authors: [{ name: 'SonsHub Media', url: 'https://rfyglobal.org' }],
  creator: 'SonsHub Media',
  publisher: 'SonsHub Media',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rfyglobal.org',
    siteName: 'Room For You',
    title: 'Room For You — A Christian Community with Minister Yadah',
    description:
      'A global community of young men and women singing songs of salvation, studying the Word, praying, and getting others saved. Founded by Minister Yadah.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Room For You — A Christian Community with Minister Yadah',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Room For You — A Christian Community with Minister Yadah',
    description:
      'A global Christian community founded by Minister Yadah. Monthly gatherings. Daily Word. Prayer. Join us.',
    images: ['/og-image.jpg'],
    creator: '@roomforyou',
    site: '@roomforyou',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  manifest: '/site.webmanifest',

  alternates: {
    canonical: 'https://rfyglobal.org',
  },

  category: 'religion',
}
```

---

## TASK 2 — Page-Level Metadata for Every Public Page

Add specific `metadata` exports to each public page. These override the root metadata template.

### Landing page (`src/app/(public)/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Room For You — A Christian Community with Minister Yadah',
  description:
    'Room For You is a global Christian community founded by Minister Yadah. Monthly gatherings in Abuja, Lagos, and cities worldwide. Worship. Prayer. Bible Study. There is room for you.',
  alternates: { canonical: 'https://rfyglobal.org' },
  openGraph: {
    title: 'Room For You — A Christian Community with Minister Yadah',
    description: 'Join a community of young believers on fire for Jesus. Monthly gatherings. Daily Word. Prayer wall. Founded by Minister Yadah.',
    url: 'https://rfyglobal.org',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}
```

### About (`src/app/(public)/about/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'About — Room For You with Minister Yadah',
  description:
    'Learn about Room For You — a Christian community movement founded by Minister Yadah and SonsHub Media. Our vision: Jesus to Nations. Our mission: building community through worship, prayer, and the Word.',
  alternates: { canonical: 'https://rfyglobal.org/about' },
  openGraph: {
    title: 'About Room For You — Minister Yadah\'s Community Ministry',
    description: 'Room For You was born out of a conviction that every young person deserves a community where they are known and called into purpose.',
    url: 'https://rfyglobal.org/about',
  },
}
```

### Events (`src/app/(public)/events/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Events — Gospel Gatherings with Room For You',
  description:
    'Monthly gospel community gatherings hosted by Room For You with Minister Yadah. Physical meetings across Abuja, Lagos, and cities worldwide. Free to attend — come as you are.',
  alternates: { canonical: 'https://rfyglobal.org/events' },
  openGraph: {
    title: 'Gospel Events — Room For You with Minister Yadah',
    description: 'Monthly community gatherings across cities. Worship, prayer, and the Word. Free to attend.',
    url: 'https://rfyglobal.org/events',
  },
}
```

### Gallery (`src/app/(public)/gallery/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Gallery — Moments from Room For You Gatherings',
  description:
    'Photos from Room For You community gatherings with Minister Yadah. Real people. Real community. Real encounters with God.',
  alternates: { canonical: 'https://rfyglobal.org/gallery' },
}
```

### Word (`src/app/(public)/word/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Daily Word — Scripture from Room For You',
  description:
    'One scripture every day with audio commentary from Minister Yadah and the Room For You team. Rooted in the Word. Grounded in grace.',
  alternates: { canonical: 'https://rfyglobal.org/word' },
}
```

### Study (`src/app/(public)/study/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Study Portal — Bible Study Resources from Room For You',
  description:
    'Free Bible study materials, tasks, and resources from Room For You. Identity in Christ, the discipline of prayer, and more. Open to everyone.',
  alternates: { canonical: 'https://rfyglobal.org/study' },
}
```

### Blog (`src/app/(public)/blog/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Devotionals — Room For You Blog',
  description:
    'Devotional articles from the Room For You community. Deep teaching on salvation, identity in Christ, worship, and Christian living.',
  alternates: { canonical: 'https://rfyglobal.org/blog' },
}
```

### Partner (`src/app/(public)/partner/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Partner — Support the Room For You Mission',
  description:
    'Partner with Room For You to fuel the Gospel mission. Every gift supports community gatherings, Bible study resources, and evangelical outreach. Give today.',
  alternates: { canonical: 'https://rfyglobal.org/partner' },
}
```

### Join (`src/app/(public)/join/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Join — Become Part of Room For You',
  description:
    'Join the Room For You community with Minister Yadah. Free membership. Daily Word. Monthly gatherings. Prayer support. There is room for you here.',
  alternates: { canonical: 'https://rfyglobal.org/join' },
}
```

### Prayer (`src/app/(public)/prayer/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Prayer Wall — Room For You',
  description:
    'Submit your prayer request to Minister Yadah and the Room For You prayer team. Every request is prayed over personally. Private and confidential.',
  alternates: { canonical: 'https://rfyglobal.org/prayer' },
}
```

### Testimonies (`src/app/(public)/testimonies/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Testimonies — What God Has Done in Room For You',
  description:
    'Real testimonies from the Room For You community. Stories of healing, salvation, breakthrough, and God\'s faithfulness. To God be the glory.',
  alternates: { canonical: 'https://rfyglobal.org/testimonies' },
}
```

### Contact (`src/app/(public)/contact/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'Contact — Room For You',
  description:
    'Get in touch with the Room For You team. Questions about membership, events, partnership, or prayer — we read every message.',
  alternates: { canonical: 'https://rfyglobal.org/contact' },
}
```

### FAQ (`src/app/(public)/faq/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'FAQs — Room For You',
  description:
    'Frequently asked questions about Room For You — joining, events, prayer, giving, testimonies, and more.',
  alternates: { canonical: 'https://rfyglobal.org/faq' },
}
```

### Confession (`src/app/(public)/confession/page.tsx`)
```typescript
export const metadata: Metadata = {
  title: 'The Confession — Room For You',
  description:
    'The declaration of every member of Room For You. I am saved by grace through faith. Jesus to Nations. Read the full confession.',
  alternates: { canonical: 'https://rfyglobal.org/confession' },
}
```

---

## TASK 3 — Dynamic Metadata for Event Pages

Open `src/app/(public)/events/[slug]/page.tsx`.

Add dynamic metadata generation:

```typescript
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const event = await db.event.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  })

  if (!event) {
    return {
      title: 'Event — Room For You',
      description: 'A Room For You community gathering.',
    }
  }

  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  return {
    title: `${event.title} — Room For You`,
    description:
      event.description ??
      `Join Room For You for ${event.title}${event.city ? ` in ${event.city}` : ''}${eventDate ? ` on ${eventDate}` : ''}. Free to attend.`,
    openGraph: {
      title: event.title,
      description: event.description ?? `A Room For You gathering in ${event.city ?? 'your city'}.`,
      images: event.imageUrl ? [{ url: event.imageUrl, width: 1200, height: 630 }] : [{ url: '/og-image.jpg' }],
      url: `https://rfyglobal.org/events/${params.slug}`,
      type: 'website',
    },
    alternates: { canonical: `https://rfyglobal.org/events/${params.slug}` },
  }
}
```

---

## TASK 4 — Dynamic Metadata for Blog Posts

Open `src/app/(public)/blog/[slug]/page.tsx`.

```typescript
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await db.blogPost.findUnique({ where: { slug: params.slug } })

  if (!post) return { title: 'Post — Room For You' }

  return {
    title: `${post.title} — Room For You`,
    description: post.excerpt ?? post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? post.title,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl, width: 1200, height: 630 }]
        : [{ url: '/og-image.jpg' }],
      url: `https://rfyglobal.org/blog/${params.slug}`,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: ['Minister Yadah', 'Room For You'],
    },
    alternates: { canonical: `https://rfyglobal.org/blog/${params.slug}` },
  }
}
```

---

## TASK 5 — JSON-LD Structured Data

Create `src/components/seo/JsonLd.tsx`:

```typescript
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

### Organization Schema — add to root layout

In `src/app/layout.tsx`, import `JsonLd` and add before `</body>`:

```typescript
import { JsonLd } from '@/components/seo/JsonLd'

// Organization schema:
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Room For You',
  alternateName: ['Room For You with Yadah', 'RFY'],
  url: 'https://rfyglobal.org',
  logo: 'https://rfyglobal.org/images/logo-dark.png',
  sameAs: [
    'https://instagram.com/roomforyouyadah',
    'https://youtube.com/@yadah',
    'https://x.com/roomforyou',
  ],
  description: 'Room For You is a global Christian community movement founded by Minister Yadah and SonsHub Media. Monthly gatherings. Daily scripture. Prayer support.',
  founder: {
    '@type': 'Person',
    name: 'Minister Yadah',
    alternateName: 'Yadah',
    jobTitle: 'Gospel Minister & Founder',
    url: 'https://yadahworld.com',
  },
  parentOrganization: {
    '@type': 'Organization',
    name: 'SonsHub Media',
    url: 'https://sonshubmedia.com',
  },
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Global',
  },
  knowsAbout: [
    'Christian community',
    'Gospel music',
    'Bible study',
    'Evangelical outreach',
    'Prayer ministry',
  ],
}

// WebSite schema (enables sitelinks search box):
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Room For You',
  url: 'https://rfyglobal.org',
  description: 'A global Christian community with Minister Yadah',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://rfyglobal.org/blog?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

// In the layout JSX:
<JsonLd data={[organizationSchema, websiteSchema]} />
```

### Person Schema for Minister Yadah — add to About page

In `src/app/(public)/about/page.tsx`:

```typescript
const yadahPersonSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Minister Yadah',
  alternateName: ['Yadah', 'Yadah Kukeurim Daniel'],
  jobTitle: 'Gospel Music Minister',
  description: 'International gospel music minister with over 100 million streams globally. Founder of Room For You Christian community.',
  url: 'https://yadahworld.com',
  image: 'https://rfyglobal.org/images/logo-dark.png',
  sameAs: [
    'https://instagram.com/iamyadah',
    'https://youtube.com/@yadah',
    'https://yadahworld.com',
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'SonsHub Media',
  },
  founder: {
    '@type': 'Organization',
    name: 'Room For You',
    url: 'https://rfyglobal.org',
  },
  performerIn: {
    '@type': 'Organization',
    name: 'Room For You',
  },
  knowsAbout: [
    'Gospel music',
    'Christian ministry',
    'Evangelical outreach',
    'Worship',
    'Bible teaching',
  ],
  nationality: {
    '@type': 'Country',
    name: 'Nigeria',
  },
}

// Add JsonLd to About page:
<JsonLd data={yadahPersonSchema} />
```

### Event Schema — add to event pages

In `src/app/(public)/events/[slug]/page.tsx`:

```typescript
// Build event schema from the event data:
const eventSchema = event ? {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.title,
  description: event.description ?? `A Room For You community gathering in ${event.city}.`,
  startDate: event.date?.toISOString(),
  location: {
    '@type': 'Place',
    name: event.venue ?? event.city ?? 'TBD',
    address: {
      '@type': 'PostalAddress',
      addressLocality: event.city ?? '',
      addressCountry: 'NG',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: 'Room For You',
    url: 'https://rfyglobal.org',
  },
  performer: {
    '@type': 'Person',
    name: 'Minister Yadah',
  },
  image: event.imageUrl ?? 'https://rfyglobal.org/og-image.jpg',
  url: `https://rfyglobal.org/events/${event.slug ?? event.id}`,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'NGN',
    availability: 'https://schema.org/InStock',
    url: `https://rfyglobal.org/events/${event.slug ?? event.id}`,
  },
} : null

// Add to event page:
{eventSchema && <JsonLd data={eventSchema} />}
```

### BlogPosting Schema — add to blog post pages

In `src/app/(public)/blog/[slug]/page.tsx`:

```typescript
const blogSchema = post ? {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt ?? post.title,
  image: post.coverImageUrl ?? 'https://rfyglobal.org/og-image.jpg',
  url: `https://rfyglobal.org/blog/${post.slug}`,
  datePublished: post.publishedAt?.toISOString(),
  dateModified: post.updatedAt?.toISOString(),
  author: {
    '@type': 'Organization',
    name: 'Room For You',
    url: 'https://rfyglobal.org',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Room For You',
    logo: {
      '@type': 'ImageObject',
      url: 'https://rfyglobal.org/images/logo-dark.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://rfyglobal.org/blog/${post.slug}`,
  },
  keywords: ['Christian devotional', 'gospel teaching', 'Room For You', 'Minister Yadah', 'Bible'],
} : null
```

### FAQ Schema — add to FAQ page

In `src/app/(public)/faq/page.tsx`:

```typescript
// Build FAQ schema from the categories and questions:
const faqSchema = categories.length > 0 ? {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: categories.flatMap(cat =>
    cat.faqs.map((faq: any) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    }))
  ),
} : null

// Add JsonLd:
{faqSchema && <JsonLd data={faqSchema} />}
```

---

## TASK 6 — Sitemap

Create `src/app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rfyglobal.org'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/word`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/study`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/partner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/join`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/prayer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/testimonies`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/confession`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  // Dynamic event pages
  let eventPages: MetadataRoute.Sitemap = []
  try {
    const events = await db.event.findMany({
      where: { isActive: true },
      select: { slug: true, id: true, updatedAt: true },
    })
    eventPages = events
      .filter(e => e.slug)
      .map(e => ({
        url: `${baseUrl}/events/${e.slug}`,
        lastModified: e.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
  } catch {}

  // Dynamic blog pages
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = await db.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    })
    blogPages = posts.map(p => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {}

  return [...staticPages, ...eventPages, ...blogPages]
}
```

---

## TASK 7 — Robots.txt

Create `src/app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/_next/',
        ],
      },
      // Allow AI crawlers explicitly
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: 'GoogleOther',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: 'https://rfyglobal.org/sitemap.xml',
    host: 'https://rfyglobal.org',
  }
}
```

---

## TASK 8 — AI Search Optimization (llms.txt)

Create `public/llms.txt` — this is the emerging standard for helping AI models understand a website:

```
# Room For You — rfyglobal.org

## About
Room For You is a global Christian community movement founded by Minister Yadah (Yadah Kukeurim Daniel) and operated by SonsHub Media Ltd, based in Abuja, Nigeria. The community gathers monthly across cities for worship, prayer, and Bible study.

## Mission
Jesus to Nations — based on 2 Corinthians 5:17-21. Building a community of young men and women who sing songs of salvation, study the Bible, pray, and get others saved.

## Founder
Minister Yadah is an international gospel music minister with over 100 million streams globally. She is the founder of Room For You and signed to SonsHub Media. Her official website is yadahworld.com.

## What Room For You Offers
- Monthly physical gatherings in cities across Nigeria and globally
- Daily scripture with audio commentary at rfyglobal.org/word
- Free Bible study materials and tasks at rfyglobal.org/study
- Devotional blog at rfyglobal.org/blog
- Private prayer request submission at rfyglobal.org/prayer
- Community testimony sharing at rfyglobal.org/testimonies
- Free community membership at rfyglobal.org/join
- Partnership/giving at rfyglobal.org/partner
- Gospel events calendar at rfyglobal.org/events
- Gallery of community moments at rfyglobal.org/gallery

## Key Facts
- Founded: By Minister Yadah, operated under SonsHub Media Ltd
- Location: Abuja, Nigeria (gatherings across multiple cities)
- Audience: Global English-speaking Christian community
- Membership: Free — no financial barrier to community
- Tagline: "There is room for you here"
- The Confession: "I am saved by grace through faith. Jesus to nations — and I am a willing vessel."

## Contact
- Website: https://rfyglobal.org
- Email: info@rfyglobal.org
- Partner/giving: partner@rfyglobal.org

## Social Media
- Instagram: @roomforyouyadah
- YouTube: Yadah
- X (Twitter): @roomforyou

## Parent Organization
SonsHub Media Ltd — a gospel music label and media company based in Abuja, Nigeria. Home to Minister Yadah.
```

---

## TASK 9 — Web App Manifest

Create `public/site.webmanifest`:

```json
{
  "name": "Room For You",
  "short_name": "RFY",
  "description": "A global Christian community with Minister Yadah",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F0F0F",
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
  ],
  "categories": ["religion", "lifestyle", "education"]
}
```

---

## TASK 10 — OG Image

Create `public/og-image.jpg` — a 1200×630px image for social sharing.

Since we cannot generate the image programmatically in this prompt, create an OG image API route that generates it dynamically using Next.js `ImageResponse`:

Create `src/app/og/route.tsx`:

```typescript
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'Room For You'
  const subtitle = searchParams.get('subtitle') ?? 'A Christian Community with Minister Yadah'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0F0F0F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Gold top border */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)',
          display: 'flex',
        }} />

        {/* Background texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 80% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)',
          display: 'flex',
        }} />

        {/* Label */}
        <p style={{
          color: '#C9A84C',
          fontSize: '14px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          margin: '0 0 20px 0',
          fontFamily: 'Arial, sans-serif',
        }}>
          ROOM FOR YOU · RFYGLOBAL.ORG
        </p>

        {/* Title */}
        <h1 style={{
          color: '#F8F8F8',
          fontSize: title.length > 40 ? '52px' : '68px',
          fontWeight: 700,
          lineHeight: 1.1,
          margin: '0 0 20px 0',
          maxWidth: '800px',
        }}>
          {title}
        </h1>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(248,248,248,0.6)',
          fontSize: '24px',
          margin: 0,
          fontFamily: 'Arial, sans-serif',
          maxWidth: '700px',
        }}>
          {subtitle}
        </p>

        {/* Gold bottom line */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
        }}>
          <p style={{
            color: '#C9A84C',
            fontSize: '13px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
            fontFamily: 'Arial, sans-serif',
          }}>
            Minister Yadah
          </p>
          <p style={{
            color: 'rgba(201,168,76,0.5)',
            fontSize: '11px',
            margin: 0,
            fontFamily: 'Arial, sans-serif',
          }}>
            Jesus to Nations — 2 Cor 5:17-21
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

Update the OG image references in metadata to use this route:
```typescript
// In root layout metadata:
images: [
  {
    url: '/og?title=Room+For+You&subtitle=A+Christian+Community+with+Minister+Yadah',
    width: 1200,
    height: 630,
    alt: 'Room For You — A Christian Community with Minister Yadah',
  },
],
```

---

## TASK 11 — Canonical URL Helper

Create `src/lib/seo.ts`:

```typescript
export const SITE_URL = 'https://rfyglobal.org'
export const SITE_NAME = 'Room For You'
export const SITE_DESCRIPTION = 'A global Christian community with Minister Yadah. Monthly gatherings. Daily Word. Prayer. Join us — there is room for you here.'

export function canonical(path: string): string {
  return `${SITE_URL}${path}`
}

export function ogImageUrl(title: string, subtitle?: string): string {
  const params = new URLSearchParams({ title })
  if (subtitle) params.set('subtitle', subtitle)
  return `${SITE_URL}/og?${params.toString()}`
}
```

---

## PHASE 26 COMPLETION CHECKLIST

**Metadata**
- [ ] Root layout has comprehensive base metadata
- [ ] Every public page has specific title + description
- [ ] Event pages have dynamic metadata from DB
- [ ] Blog post pages have dynamic metadata from DB
- [ ] All pages have `alternates.canonical` set

**Open Graph**
- [ ] OG title and description on every page
- [ ] OG image set to `/og?title=...` dynamic route
- [ ] Twitter card metadata on every page

**Structured Data (JSON-LD)**
- [ ] Organization schema in root layout
- [ ] WebSite schema in root layout
- [ ] Person schema (Minister Yadah) on About page
- [ ] Event schema on individual event pages
- [ ] BlogPosting schema on individual blog post pages
- [ ] FAQPage schema on /faq page

**Technical SEO**
- [ ] `src/app/sitemap.ts` generates all public URLs
- [ ] `src/app/robots.ts` allows all pages, blocks /admin and /api
- [ ] AI crawlers (GPTBot, ClaudeBot, PerplexityBot) explicitly allowed

**AI Optimization**
- [ ] `public/llms.txt` created with full site description
- [ ] Dynamic OG image API route at `/og`

**Web App**
- [ ] `public/site.webmanifest` created
- [ ] Theme color `#C9A84C` in manifest

**General**
- [ ] Zero visible changes on public site
- [ ] Zero changes to any page titles or headings
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The `metadata` export on individual pages OVERRIDES the root layout `metadata.title.template`. So a page with `title: 'Events — Room For You'` will show exactly that in the browser tab — NOT `Events — Room For You | Room For You`.
- The `JsonLd` component uses `dangerouslySetInnerHTML` — this is the correct and standard way to inject JSON-LD in Next.js. It is safe because we control the data entirely.
- `src/app/sitemap.ts` and `src/app/robots.ts` are special Next.js files that automatically generate `/sitemap.xml` and `/robots.txt` at build time. No additional configuration needed.
- The OG image route at `src/app/og/route.tsx` uses `next/og` `ImageResponse` which runs on the edge runtime. It generates images dynamically based on URL parameters.
- `public/llms.txt` is a static file served at `rfyglobal.org/llms.txt`. AI crawlers like ChatGPT, Perplexity, and Claude look for this file to understand the site's content and purpose. It does not affect anything visible.
- `public/site.webmanifest` enables the site to be installed as a PWA on mobile devices. The gold theme color `#C9A84C` shows in the browser chrome on Android when the site is installed.
- All social media handles in the schemas should be updated to the actual handles once confirmed. Use placeholders that match the actual accounts.
- The `generateMetadata` functions for events and blog posts make DB calls — these are cached by Next.js automatically and do not cause performance issues.
