'use client'

import Link from 'next/link'

const FOOTER_NAV_LINKS = [
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Partner', href: '/partner' },
  { label: 'About', href: '/about' },
] as const

const MUTED = '#585858'
const CRIMSON = '#8B0000'

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <circle cx="12" cy="12" r="3.35" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="17.25" cy="6.75" r="0.95" fill="currentColor" />
    </svg>
  )
}

function YoutubeGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M21.6 7.2c.2.8.3 2.1.3 4.8s-.1 4-.3 4.8c-.17.72-.72 1.27-1.44 1.44-.8.2-4.5.3-8.16.3s-7.36-.1-8.16-.3a1.95 1.95 0 0 1-1.44-1.44C2.1 16 2 14.7 2 12s.1-4 .3-4.8C2.47 6.48 3.02 5.93 3.74 5.76 4.54 5.56 8.24 5.46 11.9 5.46s7.36.1 8.16.3c.72.17 1.27.72 1.44 1.44zM10 9.5v5l4.5-2.5L10 9.5z" />
    </svg>
  )
}

function XGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M13.86 10.47 20.44 3h-1.56l-5.7 6.49L8.8 3H3.5l6.88 10.01L3.5 21h1.56l6.02-6.88L15.2 21h5.3l-6.64-9.53zm-2.1 2.4-.7-1L5.2 4.2h2.32l4.48 6.28.7 1 5.84 8.18h-2.32l-4.76-6.67z" />
    </svg>
  )
}

const SOCIAL_ICONS = {
  Instagram: InstagramGlyph,
  YouTube: YoutubeGlyph,
  X: XGlyph,
} as const

export function FooterNavLinks() {
  return (
    <nav className="flex flex-wrap gap-x-8 gap-y-3">
      {FOOTER_NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="font-body text-[11px] tracking-[0.15em] uppercase transition-colors duration-300"
          style={{ color: MUTED }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = CRIMSON
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = MUTED
          }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

export type FooterSocialItem = {
  href: string
  label: keyof typeof SOCIAL_ICONS
}

export function FooterSocialLinks({ items }: { items: FooterSocialItem[] }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {items.map(({ href, label }) => {
        const Icon = SOCIAL_ICONS[label]
        return (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Room For You on ${label}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,0,0,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]"
            style={{
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              color: MUTED,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = CRIMSON
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = MUTED
            }}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
          </a>
        )
      })}
    </div>
  )
}

export function FooterCommunityLinks() {
  return (
    <div className="flex items-center justify-center gap-6 mb-1">
      <a
        href="/prayer"
        style={{ color: '#A0A0A0', fontSize: '12px', fontFamily: 'General Sans, sans-serif' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#8B0000')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
      >
        Prayer Wall
      </a>
      <a
        href="/testimonies"
        style={{ color: '#A0A0A0', fontSize: '12px', fontFamily: 'General Sans, sans-serif' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#8B0000')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
      >
        Testimonies
      </a>
      <a
        href="/contact"
        style={{ color: '#A0A0A0', fontSize: '12px', fontFamily: 'General Sans, sans-serif' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#8B0000')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
      >
        Contact
      </a>
      <a
        href="/faq"
        style={{ color: '#A0A0A0', fontSize: '12px', fontFamily: 'General Sans, sans-serif' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#8B0000')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#A0A0A0')}
      >
        FAQs
      </a>
    </div>
  )
}

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/confession', label: 'The Confession →' },
] as const

export function FooterLegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {LEGAL_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="font-body transition-colors duration-300"
          style={{ color: MUTED, fontSize: '11px' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = CRIMSON
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = MUTED
          }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}
