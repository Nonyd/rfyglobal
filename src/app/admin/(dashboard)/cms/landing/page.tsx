import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'landing.hero.eyebrow', label: 'Hero Eyebrow', type: 'text', placeholder: 'Worship · Prayer · Study · Community' },
  { key: 'landing.hero.headline1', label: 'Hero Headline Line 1', type: 'text', placeholder: 'There Is Room', hint: 'Last word becomes the gold accent line (e.g. "Room")' },
  {
    key: 'landing.hero.headline2',
    label: 'Hero Headline Line 2',
    type: 'text',
    placeholder: 'For You.',
  },
  { key: 'landing.hero.subtext', label: 'Hero Subtext', type: 'textarea', placeholder: 'A community of young men and women…' },
  {
    key: 'landing.hero.portrait',
    label: 'Hero Background Portrait',
    type: 'image',
    uploadFolder: 'portraits',
    hint: 'Right-side background image on the homepage hero',
  },
  { key: 'landing.hero.cta.primary', label: 'Primary CTA Button', type: 'text', placeholder: 'Join the Community' },
  { key: 'landing.hero.cta.secondary', label: 'Secondary CTA Button', type: 'text', placeholder: 'Our Story' },
  { key: 'landing.vision.label', label: 'Vision Section Label', type: 'text' },
  { key: 'landing.vision.heading', label: 'Vision Section Heading', type: 'text' },
  { key: 'landing.vision.subheading', label: 'Vision Subheading (gold)', type: 'text' },
  { key: 'landing.vision.text', label: 'Vision Text', type: 'textarea' },
  { key: 'landing.vision.mission.label', label: 'Mission Label', type: 'text' },
  { key: 'landing.vision.mission.heading', label: 'Mission Heading', type: 'text' },
  { key: 'landing.vision.mission.scripture', label: 'Mission Scripture Reference', type: 'text' },
  {
    key: 'landing.vision.activities',
    label: 'Mission Activity List',
    type: 'textarea',
    hint: 'One activity per line (shown as bullet list)',
  },
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
      description="Hero copy and portrait, vision/mission section, confession excerpt, and bottom CTA"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
