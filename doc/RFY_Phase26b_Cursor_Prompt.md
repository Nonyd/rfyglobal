# ROOM FOR YOU — Phase 26b Cursor Prompt
## Fix OG Image Route · llms.txt · Sitemap Missing Pages

---

## CONTEXT

Three fixes from Phase 26 deployment verification:

1. `/og` route returns 404 — OG image generation not working
2. `/llms.txt` returns 404 — file missing or not committed
3. Sitemap missing 6 pages — join, gallery, prayer, testimonies, contact, faq

---

## TASK 1 — Fix OG Image Route

Check if `src/app/og/route.tsx` exists. If it does not exist, create it. If it exists, verify it has the correct structure.

The file must start with `export const runtime = 'edge'` and use `ImageResponse` from `next/og`:

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

        {/* Background glow */}
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
          display: 'flex',
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
          display: 'flex',
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
          display: 'flex',
        }}>
          {subtitle}
        </p>

        {/* Bottom right credit */}
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
            display: 'flex',
          }}>
            Minister Yadah
          </p>
          <p style={{
            color: 'rgba(201,168,76,0.5)',
            fontSize: '11px',
            margin: 0,
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
          }}>
            Jesus to Nations — 2 Cor 5:17-21
          </p>
        </div>

        {/* Gold bottom border */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #C9A84C, #E8C96A, #C9A84C)',
          display: 'flex',
        }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

**Important notes for the OG route:**
- Every JSX element inside `ImageResponse` must have `display: 'flex'` in its style — this is required by the Satori renderer that powers `next/og`
- The file must be at `src/app/og/route.tsx` — NOT `src/app/api/og/route.tsx`
- The runtime must be `'edge'` — not `'nodejs'`
- Do not import any Node.js modules inside this file

---

## TASK 2 — Fix llms.txt

Check if `public/llms.txt` exists:

```powershell
dir "C:\Users\DELL\Documents\YADAH\rfyglobal\public\llms.txt"
```

If it does not exist, create it at `public/llms.txt` with this exact content:

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
- FAQ at rfyglobal.org/faq
- Contact at rfyglobal.org/contact

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

Then ensure the file is committed to git:

```powershell
git add public/llms.txt
```

If the file already exists but is not committed (shows as untracked in `git status`), just add and commit it.

---

## TASK 3 — Fix Sitemap Missing Pages

Open `src/app/sitemap.ts`.

The following 6 pages are missing from the sitemap. Add them to the `staticPages` array:

```typescript
{ url: `${baseUrl}/join`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.9 },
{ url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
{ url: `${baseUrl}/prayer`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
{ url: `${baseUrl}/testimonies`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
{ url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
{ url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
```

The complete `staticPages` array should now include all 20 public pages:
- `/` (priority 1.0)
- `/about` (0.9)
- `/events` (0.9)
- `/join` (0.9)
- `/word` (0.9)
- `/gallery` (0.8)
- `/blog` (0.8)
- `/study` (0.8)
- `/partner` (0.7)
- `/prayer` (0.7)
- `/testimonies` (0.7)
- `/confession` (0.7)
- `/contact` (0.6)
- `/faq` (0.6)
- `/privacy` (0.5)
- `/cookies` (0.5)
- `/refund` (0.5)

Also add the policy pages since they are indexed:

```typescript
{ url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.5 },
{ url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.5 },
{ url: `${baseUrl}/refund`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.5 },
```

---

## COMPLETION CHECKLIST

- [ ] `src/app/og/route.tsx` exists with correct edge runtime
- [ ] Visiting `/og?title=Room+For+You&subtitle=A+Christian+Community` returns a 1200×630 image
- [ ] `public/llms.txt` exists and is committed to git
- [ ] Visiting `/llms.txt` returns the text file content
- [ ] `src/app/sitemap.ts` includes all 20 public pages
- [ ] Visiting `/sitemap.xml` shows all pages including `/join`, `/gallery`, `/prayer`, `/testimonies`, `/contact`, `/faq`
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- The most common reason `next/og` returns 404 is that every JSX element inside `ImageResponse` must have `display: 'flex'` explicitly set in its inline style. The Satori renderer (which powers `next/og`) does not support all CSS — it requires flex layout. Add `display: 'flex'` to every `<div>`, `<p>`, `<h1>` etc. inside the ImageResponse.
- `public/llms.txt` is a plain static file. Next.js serves everything in the `public/` folder at the root URL automatically. If the file exists in `public/llms.txt`, it should be accessible at `/llms.txt`. The most common issue is that the file was not committed to git (it exists locally but Vercel never received it).
- The sitemap `changeFrequency` and `priority` values must be typed with `as const` in TypeScript to avoid type errors.
