'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BrandLogo } from '@/components/brand/BrandLogo'

const navLinks = [
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
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
    return () => {
      unsubscribe()
    }
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
            ? 'border-b border-theme/80 bg-bg/95 py-3 shadow-soft backdrop-blur-md'
            : 'border-b border-transparent bg-transparent py-5',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo variant="auto" width={168} height={56} priority className="min-w-0" />

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-sm font-medium uppercase tracking-[0.2em] text-text-secondary transition-colors duration-300 hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle className="hidden md:flex" />
            <Link
              href="/forms/join-room-for-you"
              className="rfy-focus hidden border border-gold/90 px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-all duration-300 hover:border-red-brand hover:bg-gold/10 hover:text-text-primary md:inline-flex md:px-5"
            >
              Join Us
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-text-primary md:hidden"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col bg-bg"
          >
            <div className="flex items-center justify-between border-b border-theme px-4 py-5 sm:px-6">
              <BrandLogo variant="auto" width={160} height={52} />
              <button type="button" onClick={() => setIsOpen(false)} className="text-text-primary" aria-label="Close menu">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-display text-3xl font-light text-text-primary transition-colors hover:text-gold sm:text-4xl"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.06 }}
                className="flex flex-col items-center gap-6 pt-4"
              >
                <ThemeToggle />
                <Link
                  href="/forms/join-room-for-you"
                  onClick={() => setIsOpen(false)}
                  className="border border-gold px-8 py-3 font-body text-sm uppercase tracking-[0.2em] text-gold transition-all duration-300 hover:bg-gold hover:text-charcoal"
                >
                  Join Us
                </Link>
              </motion.div>
            </div>

            <div className="mx-6 mb-8 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-80" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
