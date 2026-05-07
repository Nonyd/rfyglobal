# ROOM FOR YOU — Phase 17 Cursor Prompt
## Shepherd Portrait · CMS Cache Fix · Navbar · Footer Policies · GDPR · Event Cards · Page Transitions

---

## CONTEXT

Phase 17 covers eight interconnected improvements to the public site:

1. **Shepherd portrait** — Yadah's image on the From the Shepherd section, managed via Site CMS
2. **CMS cache fix** — CMS changes not reflecting immediately on the frontend
3. **Navbar** — Add "Home" and "About" links
4. **Footer redesign** — Add Privacy Policy, Cookie Policy, Refund Policy links
5. **Policy pages** — Three professional policy pages at `/privacy`, `/cookies`, `/refund`
6. **GDPR cookie banner** — Simple bottom banner with Accept/Decline
7. **Event cards portrait** — 3:4 ratio on the events listing page
8. **Page transitions** — Ensure fast navigation using Next.js Link prefetching

---

## ═══════════════════════════════════════
## MODULE 1 — SHEPHERD PORTRAIT + CMS
## ═══════════════════════════════════════

### TASK 1 — Update FromTheShepherd Component

Open `src/components/landing/FromTheShepherd.tsx`.

Add a portrait image on the right side of the section. The layout should be:
- Left ~60%: label, quote, name, title, link (existing content)
- Right ~40%: Yadah's portrait image

```typescript
export function FromTheShepherd({ content }: { content: Record<string, string> }) {
  const portraitUrl = content['shepherd.portrait'] || null

  return (
    <section className="relative bg-void py-32 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-24 items-center">

        {/* Left — content (3 cols) */}
        <div className="lg:col-span-3">
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

        {/* Right — portrait image (2 cols) */}
        {portraitUrl && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: '3/4',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              <Image
                src={portraitUrl}
                alt="Minister Yadah"
                fill
                className="object-cover object-top"
              />
              {/* Subtle gold gradient overlay at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(15,15,15,0.6), transparent)',
                }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
```

---

### TASK 2 — Add Shepherd Portrait to CMS Keys

Open `src/app/admin/(dashboard)/cms/page.tsx` or wherever the CMS sections are defined.

Add a new CMS entry for the shepherd portrait image:

```typescript
// Add to the shepherd section CMS fields:
{
  key: 'shepherd.portrait',
  label: 'Shepherd Portrait Image',
  type: 'IMAGE', // upload via Cloudinary
  description: 'Portrait photo of Minister Yadah — shown on the landing page Shepherd section',
}
```

The CMS editor for image fields should show an `UploadZone` with `folder="portraits"` (or `folder="cms"`). On upload, save the Cloudinary URL to `SiteContent`.

Also add `shepherd.portrait` to the `getContentMany` call in `src/app/(public)/page.tsx`:

```typescript
const content = await getContentMany([
  // ... existing keys ...
  'shepherd.portrait',
])
```

---

## ═══════════════════════════════════════
## MODULE 2 — CMS CACHE FIX
## ═══════════════════════════════════════

### TASK 3 — Fix CMS Not Reflecting Immediately

The issue: when admin saves CMS content, the frontend still shows old cached values because Next.js caches server component data.

Open every CMS API route that handles saving content (e.g. `src/app/api/cms/route.ts` or similar).

After saving, add `revalidatePath` calls:

```typescript
import { revalidatePath } from 'next/cache'

// After saving CMS content in the API route:
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, value } = await req.json()

  await db.siteContent.upsert({
    where: { key },
    create: { key, value, type: 'TEXT' },
    update: { value },
  })

  // Revalidate all public pages that use CMS content
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/partner')
  revalidatePath('/confession')

  return NextResponse.json({ success: true })
}
```

Also add `export const revalidate = 0` or `export const dynamic = 'force-dynamic'` to all public pages that use `getContentMany`:

```typescript
// Add to src/app/(public)/page.tsx (landing page):
export const dynamic = 'force-dynamic'

// Add to src/app/(public)/about/page.tsx:
export const dynamic = 'force-dynamic'

// Add to src/app/(public)/partner/page.tsx:
export const dynamic = 'force-dynamic'
```

Alternatively, use `revalidatePath` after every CMS save — this is the cleaner approach that doesn't disable caching globally.

---

## ═══════════════════════════════════════
## MODULE 3 — NAVBAR UPDATES
## ═══════════════════════════════════════

### TASK 4 — Add Home and About to Navbar

Open `src/components/layout/Navbar.tsx`.

Update `NAV_LINKS`:

```typescript
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Partner', href: '/partner' },
]
```

On desktop this may be too many links. Use a slightly smaller font size for nav links or drop "Home" from the desktop nav (since the logo already links home) but keep it in the mobile menu:

```typescript
// Desktop nav — exclude Home (logo = home):
const DESKTOP_NAV_LINKS = NAV_LINKS.filter(l => l.href !== '/')

// Mobile nav — include all including Home:
const MOBILE_NAV_LINKS = NAV_LINKS
```

Add active state to nav links using `usePathname`:

```typescript
import { usePathname } from 'next/navigation'

const pathname = usePathname()

// On each link:
className={cn(
  'text-[11px] font-body font-medium tracking-[0.2em] uppercase transition-colors duration-300',
  pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
    ? 'text-gold'
    : 'text-mist hover:text-snow'
)}
```

---

## ═══════════════════════════════════════
## MODULE 4 — FOOTER + POLICY PAGES
## ═══════════════════════════════════════

### TASK 5 — Update Footer with Policy Links

Open `src/components/layout/Footer.tsx`.

Add policy links to the bottom strip:

```typescript
{/* Bottom row */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
  <p className="font-body text-xs text-fog">
    {content['footer.copyright'] || '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.'}
  </p>

  {/* Policy links */}
  <div className="flex items-center gap-6">
    <Link href="/privacy"
      className="font-body text-xs text-fog hover:text-gold transition-colors">
      Privacy Policy
    </Link>
    <Link href="/cookies"
      className="font-body text-xs text-fog hover:text-gold transition-colors">
      Cookie Policy
    </Link>
    <Link href="/refund"
      className="font-body text-xs text-fog hover:text-gold transition-colors">
      Refund Policy
    </Link>
    <Link href="/confession"
      className="font-body text-xs text-fog hover:text-gold transition-colors">
      The Confession →
    </Link>
  </div>
</div>
```

---

### TASK 6 — Privacy Policy Page

Create `src/app/(public)/privacy/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Room For You',
  description: 'How Room For You collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="label-text mb-4">Legal</p>
          <h1 className="font-display text-snow text-4xl lg:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="font-body text-mist text-sm mb-12">
            Last updated: May 2026
          </p>
          <div className="gold-line-left w-12 mb-12 opacity-40" />

          <div className="prose-rfy space-y-10">

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">1. Introduction</h2>
              <p className="font-body text-mist leading-relaxed">
                Room For You ("we", "our", or "us") is operated by SonsHub Media Ltd, a Christian media
                company based in Abuja, Nigeria. We are committed to protecting your personal information
                and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard
                your information when you visit rfyglobal.org or join our community.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">2. Information We Collect</h2>
              <p className="font-body text-mist leading-relaxed mb-4">
                We collect information you voluntarily provide when you:
              </p>
              <ul className="space-y-2 font-body text-mist">
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Join the Room For You community (name, email, phone, location)</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Register for an event (name, email, phone, location, expectations)</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Make a financial gift or partnership contribution (name, email, payment details processed by third-party gateways)</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Submit a form on our website</li>
              </ul>
              <p className="font-body text-mist leading-relaxed mt-4">
                We also automatically collect certain technical information including IP addresses, browser
                type, and pages visited through standard web server logs and cookies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">3. How We Use Your Information</h2>
              <p className="font-body text-mist leading-relaxed mb-4">We use your information to:</p>
              <ul className="space-y-2 font-body text-mist">
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Send you community updates, daily scripture, and event reminders (you can unsubscribe at any time)</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Confirm your event registrations and partnership gifts</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Improve our website and community programs</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Comply with legal obligations</li>
              </ul>
              <p className="font-body text-mist leading-relaxed mt-4">
                We do not sell, trade, or rent your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">4. Data Storage and Security</h2>
              <p className="font-body text-mist leading-relaxed">
                Your data is stored securely on servers provided by Neon (PostgreSQL) and hosted via
                Vercel. We implement industry-standard security measures including encryption in transit
                (HTTPS) and at rest. Payment credentials are encrypted using AES-256-GCM before storage
                and are never returned in plain text. Despite our best efforts, no method of transmission
                over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">5. Your Rights</h2>
              <p className="font-body text-mist leading-relaxed mb-4">You have the right to:</p>
              <ul className="space-y-2 font-body text-mist">
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Access the personal data we hold about you</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Request correction of inaccurate data</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Request deletion of your data</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Unsubscribe from all emails at any time using the unsubscribe link in any email</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> Withdraw consent for data processing</li>
              </ul>
              <p className="font-body text-mist leading-relaxed mt-4">
                To exercise any of these rights, contact us at privacy@rfyglobal.org.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">6. Third-Party Services</h2>
              <p className="font-body text-mist leading-relaxed">
                We use the following third-party services which have their own privacy policies:
                Brevo (email delivery), Paystack, Flutterwave, and Payaza (payment processing),
                Cloudinary (media storage), and Vercel (hosting). We encourage you to review their
                respective privacy policies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">7. Cookies</h2>
              <p className="font-body text-mist leading-relaxed">
                We use cookies to maintain your session and remember your preferences. See our
                {' '}<a href="/cookies" className="text-gold hover:opacity-70 transition-opacity">Cookie Policy</a>{' '}
                for full details.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">8. Changes to This Policy</h2>
              <p className="font-body text-mist leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any
                significant changes by posting the new policy on this page with an updated date.
                Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">9. Contact Us</h2>
              <p className="font-body text-mist leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@rfyglobal.org" className="text-gold hover:opacity-70 transition-opacity">
                  privacy@rfyglobal.org
                </a>
                {' '}or write to SonsHub Media Ltd, Abuja, Nigeria.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

---

### TASK 7 — Cookie Policy Page

Create `src/app/(public)/cookies/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy — Room For You',
  description: 'How Room For You uses cookies on rfyglobal.org.',
}

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="label-text mb-4">Legal</p>
          <h1 className="font-display text-snow text-4xl lg:text-5xl font-bold mb-4">
            Cookie Policy
          </h1>
          <p className="font-body text-mist text-sm mb-12">Last updated: May 2026</p>
          <div className="gold-line-left w-12 mb-12 opacity-40" />

          <div className="space-y-10">

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">What Are Cookies</h2>
              <p className="font-body text-mist leading-relaxed">
                Cookies are small text files placed on your device when you visit a website. They help
                websites remember your preferences and provide a better browsing experience.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Cookies We Use</h2>
              <div className="space-y-6">
                <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
                  <p className="font-display text-gold text-lg mb-2">Strictly Necessary Cookies</p>
                  <p className="font-body text-mist text-sm leading-relaxed">
                    These cookies are essential for the website to function. They include session cookies
                    that keep you logged in to the admin dashboard and security tokens that protect
                    against cross-site request forgery. These cannot be disabled.
                  </p>
                </div>
                <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <p className="font-display text-snow text-lg mb-2">Preference Cookies</p>
                  <p className="font-body text-mist text-sm leading-relaxed">
                    We store your theme preference (dark/light mode) and cookie consent choice in your
                    browser's local storage. These are not transmitted to our servers.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Managing Cookies</h2>
              <p className="font-body text-mist leading-relaxed">
                You can control cookies through your browser settings. Most browsers allow you to refuse
                cookies or delete existing ones. Note that disabling cookies may affect your ability to
                use certain features of this website, including the admin dashboard.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Your Consent</h2>
              <p className="font-body text-mist leading-relaxed">
                When you first visit rfyglobal.org, you will see a cookie notice banner. By clicking
                "Accept", you consent to our use of cookies as described in this policy. You can
                withdraw consent at any time by clearing your browser cookies and declining on your
                next visit.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Contact</h2>
              <p className="font-body text-mist leading-relaxed">
                Questions about our cookie use? Contact us at{' '}
                <a href="mailto:privacy@rfyglobal.org" className="text-gold hover:opacity-70 transition-opacity">
                  privacy@rfyglobal.org
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

---

### TASK 8 — Refund Policy Page

Create `src/app/(public)/refund/page.tsx`:

```typescript
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy — Room For You',
  description: 'Room For You refund and cancellation policy for gifts and partnership contributions.',
}

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="label-text mb-4">Legal</p>
          <h1 className="font-display text-snow text-4xl lg:text-5xl font-bold mb-4">
            Refund Policy
          </h1>
          <p className="font-body text-mist text-sm mb-12">Last updated: May 2026</p>
          <div className="gold-line-left w-12 mb-12 opacity-40" />

          <div className="space-y-10">

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Gifts and Donations</h2>
              <p className="font-body text-mist leading-relaxed">
                All financial gifts and partnership contributions made to Room For You (operated by
                SonsHub Media Ltd) are voluntary and are used to fund the mission and operations of
                the Room For You community. As these are freewill gifts to a ministry, they are
                generally non-refundable.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Exceptional Circumstances</h2>
              <p className="font-body text-mist leading-relaxed mb-4">
                We may consider a refund request in the following exceptional circumstances:
              </p>
              <ul className="space-y-2 font-body text-mist">
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> A duplicate payment was made in error</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> An unauthorized transaction occurred on your payment method</li>
                <li className="flex gap-3"><span className="text-gold shrink-0">—</span> A technical error resulted in an incorrect amount being charged</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">How to Request a Refund</h2>
              <p className="font-body text-mist leading-relaxed">
                To request a refund, please contact us within 14 days of the transaction at{' '}
                <a href="mailto:partner@rfyglobal.org" className="text-gold hover:opacity-70 transition-opacity">
                  partner@rfyglobal.org
                </a>{' '}
                with your full name, email address, transaction reference, amount, and reason for
                the refund request. We will review your request and respond within 5 business days.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Event Registrations</h2>
              <p className="font-body text-mist leading-relaxed">
                Room For You events are currently free to attend. There is no charge for event
                registration, and therefore no refund is applicable for event registrations.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Processing Time</h2>
              <p className="font-body text-mist leading-relaxed">
                Approved refunds will be processed within 7-10 business days and returned to the
                original payment method. Processing times may vary depending on your bank or card issuer.
              </p>
            </section>

            <section>
              <h2 className="font-display text-snow text-2xl mb-4">Contact</h2>
              <p className="font-body text-mist leading-relaxed">
                For all refund enquiries, please contact{' '}
                <a href="mailto:partner@rfyglobal.org" className="text-gold hover:opacity-70 transition-opacity">
                  partner@rfyglobal.org
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

---

## ═══════════════════════════════════════
## MODULE 5 — GDPR COOKIE BANNER
## ═══════════════════════════════════════

### TASK 9 — Cookie Consent Banner Component

Create `src/components/shared/CookieBanner.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('rfy-cookie-consent')
    if (!consent) {
      // Small delay so it doesn't flash on first render
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('rfy-cookie-consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('rfy-cookie-consent', 'declined')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[300]"
        >
          <div
            className="p-5 flex flex-col gap-4"
            style={{
              background: '#1A1A1A',
              border: '1px solid rgba(201,168,76,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* Text */}
            <div>
              <p className="font-display text-snow text-base font-semibold mb-1">
                We use cookies
              </p>
              <p className="font-body text-mist text-xs leading-relaxed">
                We use cookies to remember your preferences and improve your experience.
                By using this site, you agree to our{' '}
                <Link href="/cookies"
                  className="text-gold hover:opacity-70 transition-opacity underline">
                  Cookie Policy
                </Link>
                {' '}and{' '}
                <Link href="/privacy"
                  className="text-gold hover:opacity-70 transition-opacity underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={accept}
                className="flex-1 py-2.5 font-body text-xs font-semibold tracking-widest uppercase transition-all"
                style={{ background: '#C9A84C', color: '#0F0F0F' }}
              >
                Accept
              </button>
              <button
                onClick={decline}
                className="flex-1 py-2.5 font-body text-xs tracking-widest uppercase border transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(248,248,248,0.6)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                  e.currentTarget.style.color = '#F8F8F8'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.color = 'rgba(248,248,248,0.6)'
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### TASK 10 — Add Cookie Banner to Root Layout

Open `src/app/layout.tsx`.

Add the `CookieBanner` component:

```typescript
import { CookieBanner } from '@/components/shared/CookieBanner'

// Inside the body, after ThemeProvider children:
<ThemeProvider>
  {children}
  <CookieBanner />
</ThemeProvider>
```

---

## ═══════════════════════════════════════
## MODULE 6 — EVENT CARDS PORTRAIT
## ═══════════════════════════════════════

### TASK 11 — Fix Event Listing Cards to Portrait Shape

Open `src/components/events/EventsClientPage.tsx`.

The event cards currently use a fixed height image area. Change to `3:4` portrait aspect ratio:

```typescript
{/* Image area — portrait 3:4 */}
<div
  className="relative overflow-hidden w-full"
  style={{ aspectRatio: '3/4', background: '#0F0F0F' }}
>
  {event.imageUrl ? (
    <Image
      src={event.imageUrl}
      alt={event.title}
      fill
      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
    />
  ) : (
    <div className="flex items-center justify-center h-full">
      <span
        className="font-display font-bold select-none"
        style={{
          fontSize: '5rem',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(201,168,76,0.15)',
        }}
      >
        RFY
      </span>
    </div>
  )}
  {/* Date badge — bottom left */}
  <div
    className="absolute bottom-3 left-3 px-2.5 py-2 text-center z-10"
    style={{
      background: 'rgba(15,15,15,0.92)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(201,168,76,0.35)',
    }}
  >
    <p className="font-display text-xl text-gold font-bold leading-none">
      {format(new Date(event.date), 'dd')}
    </p>
    <p className="label-text opacity-60 text-[9px] mt-0.5">
      {format(new Date(event.date), 'MMM').toUpperCase()}
    </p>
  </div>
</div>

{/* Card content below image */}
<div className="p-4">
  <p className="label-text opacity-40 mb-1.5">{event.city}</p>
  <h3 className="font-display text-snow text-lg leading-tight group-hover:text-gold transition-colors mb-2">
    {event.title}
  </h3>
  {event.time && (
    <p className="font-body text-mist text-xs mb-2">{event.time}</p>
  )}
  {event.description && (
    <p className="font-body text-fog text-xs leading-relaxed line-clamp-2">
      {event.description}
    </p>
  )}
</div>
```

Also update the grid to 3 columns to accommodate the taller portrait cards better:

```typescript
// Grid: 1 col mobile, 2 col tablet, 3 col desktop
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
```

---

## ═══════════════════════════════════════
## MODULE 7 — PAGE TRANSITIONS & PREFETCHING
## ═══════════════════════════════════════

### TASK 12 — Ensure Fast Page Navigation

Next.js `<Link>` components already prefetch pages by default in production. Verify the following:

**Check 1 — All navigation uses `<Link>` not `<a>`:**
Search for bare `<a href="/">` tags in nav components and replace with `<Link href="/">`.

**Check 2 — Add loading state for slow pages:**

Create `src/app/(public)/loading.tsx` (root loading state for public pages):

```typescript
export default function Loading() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-8 h-8 border-2 animate-spin"
          style={{
            borderColor: 'rgba(201,168,76,0.2)',
            borderTopColor: '#C9A84C',
            borderRadius: '50%',
          }}
        />
        <p className="label-text opacity-40">Loading</p>
      </div>
    </div>
  )
}
```

**Check 3 — Add `prefetch` prop where needed:**

For the most important navigation links (Events, Blog, Word), ensure prefetch is not disabled:

```typescript
// Good — prefetches by default:
<Link href="/events">Events</Link>

// Also good — explicit prefetch:
<Link href="/events" prefetch={true}>Events</Link>

// Never use this for main nav:
<Link href="/events" prefetch={false}>Events</Link>
```

**Check 4 — Ensure all public pages have appropriate caching:**

Pages that show static content (privacy, cookies, refund) can be statically generated — no `force-dynamic` needed.

Pages that show DB content should use either:
- `export const dynamic = 'force-dynamic'` for always-fresh data
- Or `export const revalidate = 3600` for hourly revalidation (good for blog, events)

```typescript
// Blog listing — revalidate every hour:
export const revalidate = 3600

// Events listing — revalidate every hour:
export const revalidate = 3600

// Landing page — force dynamic (uses CMS content that changes):
export const dynamic = 'force-dynamic'
```

---

## PHASE 17 COMPLETION CHECKLIST

**Shepherd Portrait**
- [ ] `shepherd.portrait` CMS key supported
- [ ] Portrait image shows on right side of Shepherd section on landing page
- [ ] CMS admin has image upload field for shepherd portrait

**CMS Cache Fix**
- [ ] Saving CMS content calls `revalidatePath('/')`
- [ ] Changes reflect on the frontend within seconds of saving
- [ ] No need to redeploy to see CMS updates

**Navbar**
- [ ] "Home" in mobile menu
- [ ] "About" in desktop and mobile nav
- [ ] Active state highlights current page link in gold

**Footer + Policies**
- [ ] Privacy Policy, Cookie Policy, Refund Policy links in footer
- [ ] `/privacy` page loads with professional content
- [ ] `/cookies` page loads with professional content
- [ ] `/refund` page loads with professional content
- [ ] All policy pages use the site design system (dark background, gold accents)

**GDPR Banner**
- [ ] Cookie banner appears on first visit after 1.5s delay
- [ ] Accept button saves consent and hides banner
- [ ] Decline button saves choice and hides banner
- [ ] Banner does not appear again after consent is given
- [ ] Banner links to /cookies and /privacy

**Event Cards**
- [ ] Event listing cards are portrait shaped (3:4 ratio)
- [ ] Full event poster image shows without cropping
- [ ] Date badge on bottom-left of each card
- [ ] Grid is 3 columns on desktop

**Page Transitions**
- [ ] All nav links use Next.js `<Link>`
- [ ] Loading spinner shows for slow pages
- [ ] Blog and events pages use `revalidate = 3600`
- [ ] Landing page uses `force-dynamic`

**General**
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- `revalidatePath` must be called in a Server Action or Route Handler — not in a client component. The CMS save API route is the right place.
- The `CookieBanner` uses `localStorage` so it must be `'use client'`. The `useEffect` pattern prevents SSR hydration issues.
- The cookie banner appears after 1.5 seconds to avoid it flashing immediately on load — this is intentional.
- For the Shepherd portrait CMS field: the `CMSEditor` component needs to handle `type: 'IMAGE'` fields. If it currently only handles text fields, add a conditional render: when `field.type === 'IMAGE'`, show an `UploadZone` instead of a text input, and on upload completion, call the same save endpoint with the Cloudinary URL as the value.
- The policy pages are server components with static content — no DB calls, no `force-dynamic` needed. They will be statically generated at build time.
- `revalidate = 3600` means the page is regenerated at most once per hour. For a community site this is perfectly fine — events don't change by the minute.
