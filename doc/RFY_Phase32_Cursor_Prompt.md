# ROOM FOR YOU — Phase 32 Cursor Prompt
## Update OG Image to Cloudinary Photo

---

## CONTEXT

Replace the dynamic `/og` generated graphic with a real Cloudinary photo for social sharing. The new OG image URL is:

```
https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg
```

This image will be shown when rfyglobal.org links are shared on WhatsApp, Twitter/X, Facebook, Instagram, iMessage, and anywhere else that reads OG tags.

---

## TASK 1 — Update seo.ts

Open `src/lib/seo.ts`.

Add or update the default OG image constant:

```typescript
export const DEFAULT_OG_IMAGE = 'https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg'
```

---

## TASK 2 — Update Root Layout Metadata

Open `src/app/layout.tsx`.

Find the `openGraph.images` and `twitter.images` arrays and replace with the Cloudinary URL:

```typescript
openGraph: {
  type: 'website',
  locale: 'en_US',
  url: 'https://rfyglobal.org',
  siteName: 'Room For You',
  title: 'Room For You — A Christian Community with Minister Yadah',
  description: 'A global community of young men and women singing songs of salvation, studying the Word, praying, and getting others saved. Founded by Minister Yadah.',
  images: [
    {
      url: 'https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg',
      width: 1200,
      height: 630,
      alt: 'Room For You — A Christian Community with Minister Yadah',
    },
  ],
},

twitter: {
  card: 'summary_large_image',
  title: 'Room For You — A Christian Community with Minister Yadah',
  description: 'A global Christian community founded by Minister Yadah. Monthly gatherings. Daily Word. Prayer. Join us.',
  images: ['https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg'],
  creator: '@rfyglobal',
  site: '@rfyglobal',
},
```

---

## TASK 3 — Update Static Page Metadata

For all public pages that currently use `/og?title=...`, replace with the Cloudinary URL.

These pages use the default OG image (not page-specific):
- `src/app/(public)/page.tsx` (landing)
- `src/app/(public)/about/page.tsx`
- `src/app/(public)/join/page.tsx`
- `src/app/(public)/confession/page.tsx`
- `src/app/(public)/prayer/page.tsx`
- `src/app/(public)/testimonies/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/faq/page.tsx`
- `src/app/(public)/word/page.tsx`
- `src/app/(public)/study/page.tsx`
- `src/app/(public)/gallery/page.tsx`
- `src/app/(public)/partner/page.tsx`

For each page, update the OG image:

```typescript
openGraph: {
  // ...existing fields...
  images: [
    {
      url: 'https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg',
      width: 1200,
      height: 630,
      alt: 'Room For You — A Christian Community with Minister Yadah',
    },
  ],
},
```

**Exception — keep dynamic `/og` route for:**
- `src/app/(public)/events/[slug]/page.tsx` — uses event poster image
- `src/app/(public)/blog/[slug]/page.tsx` — uses blog cover image

These already use the event/post's own image when available, which is correct.

---

## TASK 4 — Update Blog Listing Page

Open `src/app/(public)/blog/page.tsx`.

The blog listing page (not individual posts) should use the Cloudinary OG image:

```typescript
export const metadata: Metadata = {
  title: 'Devotionals — Room For You Blog',
  description: 'Devotional articles from the Room For You community.',
  alternates: { canonical: 'https://rfyglobal.org/blog' },
  openGraph: {
    title: 'Devotionals — Room For You Blog',
    description: 'Deep teaching on salvation, identity in Christ, worship, and Christian living.',
    url: 'https://rfyglobal.org/blog',
    images: [
      {
        url: 'https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg',
        width: 1200,
        height: 630,
        alt: 'Room For You Devotionals',
      },
    ],
  },
}
```

---

## TASK 5 — Update Events Listing Page

Open `src/app/(public)/events/page.tsx`.

```typescript
openGraph: {
  title: 'Gospel Events — Room For You with Minister Yadah',
  description: 'Monthly community gatherings across cities.',
  url: 'https://rfyglobal.org/events',
  images: [
    {
      url: 'https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg',
      width: 1200,
      height: 630,
      alt: 'Room For You Events',
    },
  ],
},
```

---

## TASK 6 — Global Search and Replace

Do a global search across the entire `src/` directory for:
```
/og?title=
```

Replace every instance with the Cloudinary URL:
```
https://res.cloudinary.com/dgl6csi4b/image/upload/v1778357438/rfyglobal/cms/knspfoo0oxmpk9czylz1.jpg
```

Note: The `/og` route itself (`src/app/og/route.tsx`) should NOT be deleted — it may still be used elsewhere or in future. Just stop referencing it in metadata.

---

## COMPLETION CHECKLIST

- [ ] `src/lib/seo.ts` has `DEFAULT_OG_IMAGE` constant
- [ ] Root layout metadata uses Cloudinary URL for OG and Twitter images
- [ ] All 12 static public pages use Cloudinary URL
- [ ] Blog listing page uses Cloudinary URL
- [ ] Events listing page uses Cloudinary URL
- [ ] Individual event pages still use event poster image ✅ (unchanged)
- [ ] Individual blog post pages still use post cover image ✅ (unchanged)
- [ ] No remaining `/og?title=` references in metadata
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The Cloudinary URL is already publicly accessible — no authentication needed.
- Cloudinary automatically serves the image at the correct dimensions. The `width: 1200, height: 630` values in the metadata are hints for social platforms — the actual image should ideally be close to this ratio for best display.
- The `/og` dynamic route (`src/app/og/route.tsx`) can remain in the codebase — just don't reference it in metadata anymore. It could be useful for generating scripture share cards or other dynamic images in future.
- After deploying, test the OG image by pasting `https://rfyglobal.org` into:
  - `opengraph.xyz` — shows a preview of how the link looks when shared
  - WhatsApp — send the link to yourself and check the preview
  - Twitter/X — paste the URL in a tweet draft (don't publish) to see the card preview
