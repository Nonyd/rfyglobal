import Link from 'next/link'
import { Instagram, Youtube } from 'lucide-react'
import { getContentMany } from '@/lib/content'
import { BrandLogo } from '@/components/brand/BrandLogo'

function XIcon({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const FOOTER_KEYS = [
  'footer.tagline',
  'footer.copyright',
  'footer.instagram',
  'footer.youtube',
  'footer.twitter',
] as const

export async function Footer() {
  const c = await getContentMany([...FOOTER_KEYS])

  const footerLinks = [
    { label: 'Word', href: '/word' },
    { label: 'Study', href: '/study' },
    { label: 'Events', href: '/events' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Blog', href: '/blog' },
    { label: 'Partner', href: '/partner' },
    { label: 'About', href: '/about' },
  ]

  return (
    <footer className="relative border-t-4 border-gold bg-charcoal text-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-brand/40 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-3 md:gap-10">
          <div>
            <BrandLogo variant="onDark" width={180} height={58} href="/" />
            <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-cream/75">{c['footer.tagline']}</p>
            <p className="mt-4 font-body text-xs uppercase tracking-[0.25em] text-gold">Jesus to Nations</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 self-start sm:gap-x-10">
            {footerLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-body text-xs uppercase tracking-[0.2em] text-cream/65 transition-colors hover:text-gold"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="justify-self-start md:justify-self-end">
            <div className="flex items-center gap-7 text-cream/70">
              <a
                href={c['footer.instagram']}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gold"
                aria-label="Room For You on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={c['footer.youtube']}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gold"
                aria-label="Room For You on YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href={c['footer.twitter']}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gold"
                aria-label="Room For You on X"
              >
                <XIcon className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-8 font-body text-xs uppercase tracking-[0.15em] text-cream/45">A SonsHub Media Initiative</p>
          </div>
        </div>
        <div className="mt-14 border-t border-cream/15 pt-8 text-center">
          <p className="font-body text-xs text-cream/45">{c['footer.copyright']}</p>
        </div>
      </div>
    </footer>
  )
}
