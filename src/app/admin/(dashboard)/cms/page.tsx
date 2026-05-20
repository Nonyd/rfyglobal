import Link from 'next/link'
import { Settings2, Layout, User, Heart, FileText, Globe, BookOpen, HandHeart } from 'lucide-react'

const CMS_SECTIONS = [
  { href: '/admin/cms/landing', label: 'Landing Page', desc: 'Hero copy, portrait, vision, mission, CTA', icon: Layout },
  { href: '/admin/cms/shepherd', label: 'From the Shepherd', desc: 'Yadah quote, photo, links', icon: User },
  {
    href: '/admin/cms/highlights',
    label: 'Community Highlights',
    desc: 'Section heading and four feature cards',
    icon: FileText,
  },
  { href: '/admin/cms/confession', label: 'The Confession', desc: 'Homepage excerpt and full confession page', icon: BookOpen },
  { href: '/admin/cms/about', label: 'About Page', desc: 'Vision, activities, confession, Yadah bio', icon: User },
  {
    href: '/admin/cms/partnership',
    label: 'Partnership Page',
    desc: 'Hero copy and bank details (fallback)',
    icon: Heart,
  },
  { href: '/admin/cms/pages', label: 'Page Headers', desc: 'Word, Study, Events, Gallery, Blog, Testimonies', icon: FileText },
  { href: '/admin/cms/join', label: 'Join Page', desc: 'Membership hero headline lines', icon: Layout },
  { href: '/admin/cms/prayer', label: 'Prayer Wall', desc: 'Prayer page header and privacy notice', icon: HandHeart },
  { href: '/admin/cms/footer', label: 'Footer', desc: 'Tagline, copyright, social links', icon: Globe },
  { href: '/admin/cms/contact', label: 'Contact Page', desc: 'Heading, email, social handles, WhatsApp', icon: FileText },
  { href: '/admin/cms/faq', label: 'FAQs Page', desc: 'FAQ page heading and subheading', icon: FileText },
  { href: '/admin/cms/seo', label: 'SEO Defaults', desc: 'Site-wide title, description, OG image', icon: Settings2 },
]

export default function CMSIndexPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl" style={{ color: 'var(--a-text)' }}>Site CMS</h2>
        <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>
          Edit every piece of text and every image on the site — no code required
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CMS_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group border p-6 transition-all"
              style={{ borderColor: 'var(--a-border)', background: 'var(--a-surface)' }}
            >
              <div className="flex items-start gap-4">
                <div className="border p-2 transition-colors" style={{ borderColor: 'var(--a-border)' }}>
                  <Icon size={18} style={{ color: 'var(--a-text-muted)' }} />
                </div>
                <div>
                  <h3 className="font-display text-lg" style={{ color: 'var(--a-text)' }}>
                    {section.label}
                  </h3>
                  <p className="mt-1 font-body text-sm" style={{ color: 'var(--a-text-muted)' }}>{section.desc}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
