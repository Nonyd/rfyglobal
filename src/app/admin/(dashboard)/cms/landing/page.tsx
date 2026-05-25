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
  { key: 'landing.cta.label', label: 'Bottom CTA Label', type: 'text', placeholder: 'Join Us' },
  { key: 'landing.cta.headline', label: 'Bottom CTA Headline', type: 'text', placeholder: 'The door is open.' },
  { key: 'landing.cta.subtext', label: 'Bottom CTA Subtext', type: 'text' },
  { key: 'landing.cta.button', label: 'Bottom CTA Primary Button', type: 'text' },
  { key: 'landing.cta.buttonSecondary', label: 'Bottom CTA Secondary Button', type: 'text', placeholder: 'Our Story' },
  {
    key: 'stats.enabled',
    label: 'Show Stats Section on Homepage',
    type: 'toggle',
    hint: 'When off, the streams / followers / years / gatherings counters are hidden on the homepage.',
  },
  { key: 'stats.stat1.number', label: 'Stat 1 Number', type: 'text', placeholder: '100' },
  { key: 'stats.stat1.suffix', label: 'Stat 1 Suffix', type: 'text', placeholder: 'M+' },
  { key: 'stats.stat1.label', label: 'Stat 1 Label', type: 'text', placeholder: 'Streams' },
  { key: 'stats.stat2.number', label: 'Stat 2 Number', type: 'text', placeholder: '600' },
  { key: 'stats.stat2.suffix', label: 'Stat 2 Suffix', type: 'text', placeholder: 'K+' },
  { key: 'stats.stat2.label', label: 'Stat 2 Label', type: 'text', placeholder: 'Followers' },
  { key: 'stats.stat3.number', label: 'Stat 3 Number', type: 'text', placeholder: '5' },
  { key: 'stats.stat3.suffix', label: 'Stat 3 Suffix', type: 'text', placeholder: '+' },
  { key: 'stats.stat3.label', label: 'Stat 3 Label', type: 'text', placeholder: 'Years' },
  { key: 'stats.stat4.number', label: 'Stat 4 Number', type: 'text', placeholder: '24' },
  { key: 'stats.stat4.suffix', label: 'Stat 4 Suffix', type: 'text', placeholder: '+' },
  { key: 'stats.stat4.label', label: 'Stat 4 Label', type: 'text', placeholder: 'Gatherings' },
  { key: 'landing.gallery.eyebrow', label: 'Gallery Slide Eyebrow', type: 'text', placeholder: 'Moments' },
  { key: 'landing.gallery.title', label: 'Gallery Slide Title', type: 'text', placeholder: 'Life in' },
  {
    key: 'landing.gallery.titleAccent',
    label: 'Gallery Slide Title Accent (gold)',
    type: 'text',
    placeholder: 'community.',
  },
  {
    key: 'landing.gallery.subtext',
    label: 'Gallery Slide Description',
    type: 'textarea',
    hint: 'Shown beside the slideshow on the homepage. Pick images under Admin → Gallery.',
  },
  { key: 'landing.gallery.cta', label: 'Gallery Slide Button Text', type: 'text', placeholder: 'View full gallery' },
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
