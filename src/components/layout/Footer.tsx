import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Youtube } from 'lucide-react'
import { getContentMany } from '@/lib/content'

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
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
    <footer className="border-t border-gold-subtle bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <Image
            src="/images/logo-white.svg"
            alt="Room For You"
            width={140}
            height={48}
            className="h-12 w-auto object-contain"
          />
          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {footerLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-body text-xs uppercase tracking-widest text-white/50 transition-colors hover:text-gold"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-10 max-w-md font-body text-sm text-white/50">{c['footer.tagline']}</p>
        <div className="mt-8 flex items-center gap-6 text-white/50">
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
        <p className="mt-10 font-body text-xs text-white/50">{c['footer.copyright']}</p>
      </div>
    </footer>
  )
}
