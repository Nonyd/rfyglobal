'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { cn } from '@/lib/utils'

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

const DESKTOP_NAV_LINKS = NAV_LINKS.filter((l) => l.href !== '/')
const MOBILE_NAV_LINKS = NAV_LINKS

function linkActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isDark = !mounted || resolvedTheme === 'dark'

  const logoSrc =
    isDark || scrolled ? '/images/logo-white.png' : '/images/logo-dark.png'

  const navLinkColor =
    isDark || scrolled ? 'rgba(248,248,248,0.7)' : '#2C2520'

  const navLinkHoverColor =
    isDark || scrolled ? '#F8F8F8' : '#0F0C08'

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
            : 'bg-transparent py-6',
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <img
              src={logoSrc}
              alt="Room For You"
              style={{
                height: isDark ? '52px' : '60px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {DESKTOP_NAV_LINKS.map((link) => {
              const active = linkActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  className="text-[11px] font-body font-medium tracking-[0.2em] uppercase transition-colors duration-300"
                  style={{ color: active ? '#C9A84C' : navLinkColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = active ? '#C9A84C' : navLinkHoverColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = active ? '#C9A84C' : navLinkColor
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle className="hidden md:flex" />
            <Link
              href="/join"
              prefetch
              className="hidden md:inline-flex items-center px-5 py-2 text-[11px] font-body font-medium tracking-[0.2em] uppercase border transition-all duration-300 hover:bg-gold hover:text-void"
              style={{
                borderColor: '#C9A84C',
                color: isDark || scrolled ? '#C9A84C' : '#8B5A00',
              }}
            >
              Join Us
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden transition-colors"
              style={{ color: navLinkColor }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </motion.nav>

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
              <img
                src="/images/logo-white.png"
                alt="Room For You"
                style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="text-mist hover:text-snow"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 gap-8">
              {MOBILE_NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                >
                  <Link
                    href={link.href}
                    prefetch
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'font-display text-4xl transition-colors',
                      linkActive(pathname, link.href) ? 'text-gold' : 'text-snow hover:text-gold',
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/join"
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
