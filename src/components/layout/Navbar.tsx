'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
          scrolled ? 'bg-black border-b border-gold-subtle py-3' : 'bg-transparent py-5',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo-white.svg"
              alt="Room For You — home"
              width={120}
              height={40}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-sm uppercase tracking-widest text-white/70 transition-colors duration-300 hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/forms/join-room-for-you"
              className="hidden md:inline-flex items-center border border-gold px-5 py-2 font-body text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-black"
            >
              Join Us
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-white md:hidden"
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
            className="fixed inset-0 z-[100] flex flex-col bg-black"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <Image
                src="/images/logo-white.svg"
                alt="Room For You — home"
                width={120}
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
              <button type="button" onClick={() => setIsOpen(false)} className="text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-10">
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
                    className="font-display text-4xl font-light text-white transition-colors hover:text-gold"
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
                  className="border border-gold px-8 py-3 font-body text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-black"
                >
                  Join Us
                </Link>
              </motion.div>
            </div>

            <div className="mx-6 mb-8 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
