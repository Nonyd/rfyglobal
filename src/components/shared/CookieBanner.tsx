'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('rfy-cookie-consent')
    if (!consent) {
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
              border: '1px solid rgba(139,0,0,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div>
              <p className="font-display text-snow text-base font-semibold mb-1">We use cookies</p>
              <p className="font-body text-mist text-xs leading-relaxed">
                We use cookies to remember your preferences and improve your experience. By using this site,
                you agree to our{' '}
                <Link href="/cookies" className="text-crimson hover:opacity-70 transition-opacity underline">
                  Cookie Policy
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-crimson hover:opacity-70 transition-opacity underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={accept}
                className="flex-1 py-2.5 font-body text-xs font-semibold tracking-widest uppercase transition-all"
                style={{ background: '#8B0000', color: '#0F0F0F' }}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={decline}
                className="flex-1 py-2.5 font-body text-xs tracking-widest uppercase border transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: 'rgba(248,248,248,0.6)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                  e.currentTarget.style.color = '#F8F8F8'
                }}
                onMouseLeave={(e) => {
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
