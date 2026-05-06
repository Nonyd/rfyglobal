import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'landing.hero.eyebrow', label: 'Hero Eyebrow', type: 'text', placeholder: 'Worship · Prayer · Study · Community' },
  { key: 'landing.hero.headline1', label: 'Hero Headline Line 1', type: 'text', placeholder: 'There Is Room' },
  {
    key: 'landing.hero.headline2',
    label: 'Hero Headline Line 2 (gold italic)',
    type: 'text',
    placeholder: 'For You.',
  },
  { key: 'landing.hero.subtext', label: 'Hero Subtext', type: 'textarea', placeholder: 'A community of young men and women…' },
  { key: 'landing.hero.cta.primary', label: 'Primary CTA Button', type: 'text', placeholder: 'Join the Community' },
  { key: 'landing.hero.cta.secondary', label: 'Secondary CTA Button', type: 'text', placeholder: 'Learn More' },
  { key: 'landing.vision.heading', label: 'Vision Section Heading', type: 'text' },
  { key: 'landing.vision.subheading', label: 'Vision Subheading (gold)', type: 'text' },
  { key: 'landing.vision.text', label: 'Vision Text', type: 'textarea' },
  { key: 'landing.cta.headline', label: 'Bottom CTA Headline', type: 'text', placeholder: 'The door is open.' },
  { key: 'landing.cta.subtext', label: 'Bottom CTA Subtext', type: 'text' },
  { key: 'landing.cta.button', label: 'Bottom CTA Button', type: 'text' },
]

export default async function CMSLandingPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Landing Page"
      description="Edit the hero, vision section, and CTA copy on the homepage"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
