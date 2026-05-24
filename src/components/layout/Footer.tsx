import { getContentMany } from '@/lib/content'
import {
  FooterBrandColumn,
  FooterCommunityColumn,
  FooterResourcesColumn,
  FooterOrganisationColumn,
  FooterBottomBar,
  type FooterSocialItem,
} from '@/components/layout/FooterInteractive'

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
    <footer style={{ background: '#111111' }}>
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, var(--color-accent), transparent)',
        }}
      />
      <div className="pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <FooterBrandColumn
            tagline={content['footer.tagline'] || 'Jesus to Nations — 2 Cor 5:17-21'}
            socialItems={socialItems}
          />
          <FooterCommunityColumn />
          <FooterResourcesColumn />
          <FooterOrganisationColumn />
        </div>
        <FooterBottomBar copyright={content['footer.copyright'] || '© 2026 Room For You · rfyglobal.org · A SonsHub Media Initiative.'} />
      </div>
    </footer>
  )
}
