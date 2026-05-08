# ROOM FOR YOU — Phase 25 Cursor Prompt
## Mobile Navigation — Hamburger Menu Fix

---

## CONTEXT

On mobile, the navbar shows no menu. The hamburger button is missing or not rendering. This phase fixes the mobile navbar with a proper hamburger button and slide-in drawer.

---

## TASK — Rewrite Navbar with Working Mobile Menu

Open `src/components/layout/Navbar.tsx`.

Replace the entire component with the following implementation:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

// Import ThemeToggle from wherever it currently lives in the project
// e.g. import { ThemeToggle } from '@/components/shared/ThemeToggle'

const ALL_NAV_LINKS = [
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
  { label: 'Partner', href: '/partner' },
  { label: 'Contact', href: '/contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isDark = !mounted || resolvedTheme === 'dark'
  const logoSrc = isDark || scrolled ? '/images/logo-white.png' : '/images/logo-dark.png'

  return (
    <>
      {/* ── MAIN NAV BAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(15,15,15,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          padding: scrolled ? '12px 0' : '20px 0',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-10 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="shrink-0 z-10">
            <img
              src={logoSrc}
              alt="Room For You"
              style={{
                height: isDark || scrolled ? '48px' : '60px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Link>

          {/* Desktop nav — hidden below lg (1024px) */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {ALL_NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-[11px] font-medium tracking-[0.2em] uppercase transition-colors duration-300"
                style={{
                  color: pathname === link.href
                    ? '#C9A84C'
                    : isDark || scrolled
                    ? 'rgba(248,248,248,0.65)'
                    : '#3D3530',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Join Us — hidden on xs, visible from sm */}
            <Link
              href="/join"
              className="hidden sm:inline-flex items-center px-4 py-2 font-body text-[11px] font-medium tracking-[0.2em] uppercase border transition-all duration-300"
              style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
            >
              Join Us
            </Link>

            {/* Hamburger button — visible only below lg */}
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="lg:hidden flex items-center justify-center w-9 h-9 border transition-all duration-200"
              style={{
                borderColor: 'rgba(201,168,76,0.4)',
                color: isDark || scrolled ? '#F8F8F8' : '#1A1714',
                background: 'transparent',
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            />

            {/* Slide-in panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 lg:hidden flex flex-col"
              style={{
                width: 'min(320px, 85vw)',
                background: '#0F0F0F',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-6 py-5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <img
                  src="/images/logo-white.png"
                  alt="Room For You"
                  style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center transition-colors"
                  style={{ color: 'rgba(248,248,248,0.5)' }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto py-4 px-4">
                <div className="space-y-0.5">
                  {[{ label: 'Home', href: '/' }, ...ALL_NAV_LINKS].map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.035, duration: 0.25 }}
                    >
                      <Link
                        href={link.href}
                        className="flex items-center px-4 py-3.5 font-body text-sm font-medium tracking-[0.12em] uppercase transition-all duration-200"
                        style={{
                          color: pathname === link.href
                            ? '#C9A84C'
                            : 'rgba(248,248,248,0.65)',
                          background: pathname === link.href
                            ? 'rgba(201,168,76,0.08)'
                            : 'transparent',
                          borderLeft: `2px solid ${pathname === link.href ? '#C9A84C' : 'transparent'}`,
                        }}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Divider */}
                <div className="my-6 mx-4 h-px"
                  style={{ background: 'rgba(255,255,255,0.06)' }} />

                {/* Secondary links */}
                <div className="space-y-0.5 px-4">
                  {[
                    { label: 'Prayer Wall', href: '/prayer' },
                    { label: 'Testimonies', href: '/testimonies' },
                    { label: 'FAQs', href: '/faq' },
                  ].map((link, i) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center py-2.5 font-body text-xs tracking-[0.15em] uppercase transition-colors"
                      style={{ color: 'rgba(248,248,248,0.4)' }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Drawer footer CTA */}
              <div
                className="px-6 py-6 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <Link
                  href="/join"
                  className="flex items-center justify-center w-full py-4 font-body text-xs font-semibold tracking-widest uppercase transition-all"
                  style={{ background: '#C9A84C', color: '#0F0F0F' }}
                >
                  Join The Community →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

**Key points:**
- Hamburger button uses `className="lg:hidden"` — only visible below 1024px
- Desktop nav uses `className="hidden lg:flex"` — only visible 1024px and above
- `ThemeToggle` import path must match whatever exists in the project — find the correct import path and keep it
- Body scroll is locked while mobile menu is open
- Menu closes automatically on route change
- Active route shows gold left border + gold text
- Secondary links (Prayer, Testimonies, FAQs) shown below a divider in the drawer
- "Join The Community" gold CTA at the bottom of the drawer

---

## COMPLETION CHECKLIST

- [ ] Hamburger icon (☰) visible in top-right on screens below 1024px
- [ ] Hamburger not visible on desktop (≥1024px)
- [ ] Tapping hamburger opens slide-in drawer from the right
- [ ] Drawer shows all nav links with staggered animation
- [ ] Active page link highlighted in gold with left border
- [ ] Tapping a link closes the drawer and navigates
- [ ] Tapping the backdrop closes the drawer
- [ ] Body scroll locked while drawer is open
- [ ] "Join The Community" button at bottom of drawer
- [ ] Dark mode logo (white) used inside the drawer always
- [ ] `npm run build` passes

---

## NOTES FOR CURSOR

- Do NOT change the desktop nav behavior — only the mobile hamburger and drawer are new.
- The `ThemeToggle` component already exists in the project. Find its import path (likely `@/components/shared/ThemeToggle` or similar) and keep the existing import.
- If the project already has a mobile menu partially implemented, replace it entirely with this implementation rather than patching it.
- The `lg:hidden` / `hidden lg:flex` Tailwind classes are the key to showing/hiding elements based on screen size. `lg` = 1024px breakpoint.
- Test at 375px (iPhone SE), 390px (iPhone 14), and 768px (iPad) widths.
