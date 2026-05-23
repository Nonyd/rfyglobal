import { getContentMany } from '@/lib/content'
import { FooterLegalLinks, FooterNavLinks, FooterSocialLinks, FooterCommunityLinks, type FooterSocialItem } from '@/components/layout/FooterInteractive'

export async function Footer() {
  const content = await getContentMany([
    'footer.tagline',
    'footer.copyright',
    'footer.instagram',
    'footer.youtube',
    'footer.twitter',
  ])

  const socialItems: FooterSocialItem[] = []
  if (content['footer.instagram']) {
    socialItems.push({ href: content['footer.instagram'], label: 'Instagram' })
  }
  if (content['footer.youtube']) {
    socialItems.push({ href: content['footer.youtube'], label: 'YouTube' })
  }
  if (content['footer.twitter']) {
    socialItems.push({ href: content['footer.twitter'], label: 'X' })
  }

  return (
    <footer
      className="border-t pt-20 pb-10 px-6"
      style={{
        background: '#1A1A1A',
        borderTop: '1px solid var(--color-accent)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12 mb-16">
          <div>
            <img
              src="/images/logo-white.png"
              alt="Room For You"
              style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'block' }}
              className="mb-4"
            />
            <p
              className="font-body max-w-md leading-relaxed"
              style={{
                color: 'rgba(248,248,248,0.35)',
                fontSize: '11px',
                letterSpacing: '0.3em',
              }}
            >
              {content['footer.tagline'] || 'Jesus to Nations — 2 Cor 5:17-21'}
            </p>
          </div>

          <FooterNavLinks />

          <FooterSocialLinks items={socialItems} />
        </div>

        <div className="gold-line opacity-20 mb-8" />

        <div className="flex flex-col items-center gap-4 mb-6">
          <FooterCommunityLinks />
          <FooterLegalLinks />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body" style={{ color: '#585858', fontSize: '11px' }}>
            {content['footer.copyright'] || '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.'}
          </p>
        </div>
      </div>
    </footer>
  )
}
