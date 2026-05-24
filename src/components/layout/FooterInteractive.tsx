'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

const LINK_MUTED = 'rgba(255,255,255,0.55)'

function FooterColumnHeading({ children }: { children: ReactNode }) {
  return (
    <h3
      className="font-display uppercase mb-6"
      style={{ fontSize: '0.85rem', letterSpacing: '0.15em', color: '#FFFFFF' }}
    >
      {children}
    </h3>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-body block mb-3 transition-colors duration-300 hover:text-white"
      style={{ fontSize: '0.875rem', color: LINK_MUTED }}
    >
      {children}
    </Link>
  )
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5" stroke="currentColor" strokeWidth="1.35" />
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

export type FooterSocialItem = {
  href: string
  label: keyof typeof SOCIAL_ICONS
}

export function FooterBrandColumn({
  tagline,
  socialItems,
}: {
  tagline: string
  socialItems: FooterSocialItem[]
}) {
  return (
    <div>
      <p
        className="font-display font-bold uppercase mb-4"
        style={{ fontSize: '1.25rem', color: '#FFFFFF', letterSpacing: '0.05em' }}
      >
        Room For You
      </p>
      <p className="font-body mb-6 leading-relaxed" style={{ fontSize: '0.875rem', color: LINK_MUTED }}>
        {tagline}
      </p>
      <div className="flex items-center gap-3">
        {socialItems.map(({ href, label }) => {
          const Icon = SOCIAL_ICONS[label]
          return (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Room For You on ${label}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 hover:text-white"
              style={{
                borderColor: 'rgba(255,255,255,0.12)',
                color: LINK_MUTED,
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
            </a>
          )
        })}
      </div>
    </div>
  )
}

export function FooterCommunityColumn() {
  return (
    <div>
      <FooterColumnHeading>Community</FooterColumnHeading>
      <FooterLink href="/prayer">Prayer Wall</FooterLink>
      <FooterLink href="/testimonies">Testimonies</FooterLink>
      <FooterLink href="/events">Events</FooterLink>
      <FooterLink href="/join">Join Us</FooterLink>
    </div>
  )
}

export function FooterResourcesColumn() {
  return (
    <div>
      <FooterColumnHeading>Resources</FooterColumnHeading>
      <FooterLink href="/word">Word</FooterLink>
      <FooterLink href="/study">Study</FooterLink>
      <FooterLink href="/blog">Blog</FooterLink>
      <FooterLink href="/gallery">Gallery</FooterLink>
    </div>
  )
}

export function FooterOrganisationColumn() {
  return (
    <div>
      <FooterColumnHeading>Organisation</FooterColumnHeading>
      <FooterLink href="/about">About</FooterLink>
      <FooterLink href="/partner">Partner</FooterLink>
      <FooterLink href="/contact">Contact</FooterLink>
      <FooterLink href="/faq">FAQs</FooterLink>
    </div>
  )
}

export function FooterBottomBar({ copyright }: { copyright: string }) {
  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <p className="font-body" style={{ color: LINK_MUTED, fontSize: '0.75rem' }}>
        {copyright}
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <Link href="/privacy" className="font-body transition-colors hover:text-white" style={{ fontSize: '0.75rem', color: LINK_MUTED }}>
          Privacy
        </Link>
        <Link href="/cookies" className="font-body transition-colors hover:text-white" style={{ fontSize: '0.75rem', color: LINK_MUTED }}>
          Cookies
        </Link>
        <Link href="/refund" className="font-body transition-colors hover:text-white" style={{ fontSize: '0.75rem', color: LINK_MUTED }}>
          Refund
        </Link>
      </div>
    </div>
  )
}

// Legacy exports for any remaining imports
export const FooterNavLinks = FooterResourcesColumn
export const FooterCommunityLinks = FooterCommunityColumn
export const FooterSocialLinks = () => null
export const FooterLegalLinks = () => null
