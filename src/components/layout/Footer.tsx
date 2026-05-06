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
    <footer className="bg-charcoal border-t-4 border-gold">
      <div className="mx-auto max-w-7xl px-6 py-16 text-cream">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Image src="/images/logo-white.svg" alt="Room For You" width={140} height={48} className="h-12 w-auto object-contain" />
            <p className="mt-5 font-body text-sm text-cream/70">{c['footer.tagline']}</p>
            <p className="mt-3 font-body text-xs uppercase tracking-widest text-gold">Jesus to Nations</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-3 self-start">
            {footerLinks.map((l) => (
              <Link key={l.href} href={l.href} className="font-body text-xs uppercase tracking-widest text-cream/70 transition-colors hover:text-gold">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="justify-self-start md:justify-self-end">
            <div className="flex items-center gap-6 text-cream/70">
              <a href={c['footer.instagram']} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold" aria-label="Room For You on Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={c['footer.youtube']} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold" aria-label="Room For You on YouTube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href={c['footer.twitter']} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold" aria-label="Room For You on X">
                <XIcon className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-6 font-body text-xs uppercase tracking-widest text-cream/50">A SonsHub Media Initiative</p>
          </div>
        </div>
        <div className="mt-12 border-t border-cream/20 pt-6 text-center">
          <p className="font-body text-xs text-cream/50">{c['footer.copyright']}</p>
        </div>
      </div>
    </footer>
  )
}
