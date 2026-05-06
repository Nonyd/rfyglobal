import Link from 'next/link'
import Image from 'next/image'
import { getContentMany } from '@/lib/content'
 
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

          <div className="flex items-center gap-6">
            {[
              { href: content['footer.instagram'], label: 'IG' },
              { href: content['footer.youtube'], label: 'YT' },
              { href: content['footer.twitter'], label: 'TW' },
            ]
              .filter((s) => s.href)
              .map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-[11px] tracking-[0.15em] text-fog hover:text-gold transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div className="gold-line opacity-20 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-fog">
            {content['footer.copyright'] || '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.'}
          </p>
          <Link href="/confession" className="font-body text-xs text-fog hover:text-gold transition-colors">
            The Confession →
          </Link>
        </div>
      </div>
    </footer>
  )
}
