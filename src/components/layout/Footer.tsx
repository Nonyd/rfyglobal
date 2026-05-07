import Link from 'next/link'
import Image from 'next/image'
import { getContentMany } from '@/lib/content'

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

const NAV_LINKS = [
  { label: 'Word', href: '/word' },
  { label: 'Study', href: '/study' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blog', href: '/blog' },
  { label: 'Partner', href: '/partner' },
  { label: 'About', href: '/about' },
]

export async function Footer() {
  const content = await getContentMany([
    'footer.tagline',
    'footer.copyright',
    'footer.instagram',
    'footer.youtube',
    'footer.twitter',
  ])

  return (
    <footer className="bg-void border-t border-ash/40 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 mb-16">
          <div>
            <Image
              src="/images/brand-logo-on-dark.png"
              alt="Room For You — with Yadah"
              width={280}
              height={93}
              className="h-14 w-auto mb-4 object-contain object-left sm:h-16 md:h-[72px] md:max-h-[72px]"
            />
            <p className="label-text opacity-40">
              {content['footer.tagline'] || 'Jesus to Nations — 2 Cor 5:17-21'}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-[11px] tracking-[0.15em] uppercase text-fog hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {(
              [
                {
                  href: content['footer.instagram'],
                  label: 'Instagram',
                  Icon: InstagramGlyph,
                },
                {
                  href: content['footer.youtube'],
                  label: 'YouTube',
                  Icon: YoutubeGlyph,
                },
                {
                  href: content['footer.twitter'],
                  label: 'X',
                  Icon: XGlyph,
                },
              ] as const
            )
              .filter((s) => s.href)
              .map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Room For You on ${label}`}
                  className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] text-fog shadow-sm transition-all duration-300 hover:border-gold/45 hover:bg-gold/[0.07] hover:text-gold hover:shadow-[0_0_24px_rgba(201,168,76,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-300 group-hover:scale-105" />
                </a>
              ))}
          </div>
        </div>

        <div className="gold-line opacity-20 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-fog">
            {content['footer.copyright'] || '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="font-body text-xs text-fog hover:text-gold transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="font-body text-xs text-fog hover:text-gold transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/refund"
              className="font-body text-xs text-fog hover:text-gold transition-colors"
            >
              Refund Policy
            </Link>
            <Link href="/confession" className="font-body text-xs text-fog hover:text-gold transition-colors">
              The Confession →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
