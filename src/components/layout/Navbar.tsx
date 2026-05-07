'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
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
            : 'bg-transparent py-6',
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            <BrandLogo
              variant="onDark"
              href={null}
              width={280}
              height={93}
              imgClassName="h-12 w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden lg:flex items-center gap-7 xl:gap-8">
            {DESKTOP_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={cn(
                  'text-[10px] xl:text-[11px] font-body font-medium tracking-[0.18em] xl:tracking-[0.2em] uppercase transition-colors duration-300',
                  linkActive(pathname, link.href) ? 'text-gold' : 'text-mist hover:text-snow',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle className="hidden md:flex" />
            <Link
              href="/join"
              className="hidden md:inline-flex items-center px-5 py-2 text-[11px] font-body font-medium tracking-[0.2em] uppercase border border-gold text-gold hover:bg-gold hover:text-void transition-all duration-300"
            >
              Join Us
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden text-mist hover:text-snow transition-colors"
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
              <BrandLogo
                variant="onDark"
                href={null}
                width={280}
                height={93}
                imgClassName="h-12 w-auto object-contain"
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
