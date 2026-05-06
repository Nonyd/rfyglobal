import Link from 'next/link'
import { Settings2, Layout, User, Heart, FileText, Globe } from 'lucide-react'

const CMS_SECTIONS = [
  { href: '/admin/cms/landing', label: 'Landing Page', desc: 'Hero text, vision, CTA copy', icon: Layout },
  { href: '/admin/cms/shepherd', label: 'From the Shepherd', desc: 'Yadah quote, photo, links', icon: User },
  {
    href: '/admin/cms/highlights',
    label: 'Community Highlights',
    desc: 'Four highlight card titles and descriptions',
    icon: FileText,
  },
  { href: '/admin/cms/about', label: 'About Page', desc: 'Vision, mission, Yadah bio and portrait', icon: User },
  {
    href: '/admin/cms/partnership',
    label: 'Partnership Page',
    desc: 'Vision text, bank account details',
    icon: Heart,
  },
  { href: '/admin/cms/footer', label: 'Footer', desc: 'Tagline, copyright, social links', icon: Globe },
  { href: '/admin/cms/seo', label: 'SEO Defaults', desc: 'OG image, meta description', icon: Settings2 },
]

export default function CMSIndexPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-white">Site CMS</h2>
        <p className="mt-1 font-body text-sm text-white/40">
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
              className="group border border-white/10 p-6 transition-all hover:border-gold/30 hover:bg-gold/3"
            >
              <div className="flex items-start gap-4">
                <div className="border border-white/10 p-2 transition-colors group-hover:border-gold/30">
                  <Icon size={18} className="text-white/40 transition-colors group-hover:text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-white transition-colors group-hover:text-gold">
                    {section.label}
                  </h3>
                  <p className="mt-1 font-body text-sm text-white/40">{section.desc}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
