import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'about.hero.eyebrow', label: 'Hero Eyebrow', type: 'text' },
  { key: 'about.hero.headline1', label: 'Hero Headline Line 1', type: 'text' },
  { key: 'about.hero.headline2', label: 'Hero Headline Line 2 (gold)', type: 'text' },
  { key: 'about.vision.text', label: 'Vision Text', type: 'textarea' },
  { key: 'about.mission.heading', label: 'Mission Heading', type: 'text' },
  { key: 'about.mission.scripture', label: 'Mission Scripture Reference', type: 'text' },
  { key: 'about.mission.text', label: 'Mission Scripture Text', type: 'textarea' },
  { key: 'about.activities.heading', label: 'Activities Section Heading', type: 'text' },
  { key: 'about.activities.1.title', label: 'Activity 1 Title', type: 'text' },
  { key: 'about.activities.1.desc', label: 'Activity 1 Description', type: 'textarea' },
  { key: 'about.activities.2.title', label: 'Activity 2 Title', type: 'text' },
  { key: 'about.activities.2.desc', label: 'Activity 2 Description', type: 'textarea' },
  { key: 'about.activities.3.title', label: 'Activity 3 Title', type: 'text' },
  { key: 'about.activities.3.desc', label: 'Activity 3 Description', type: 'textarea' },
  { key: 'about.activities.4.title', label: 'Activity 4 Title', type: 'text' },
  { key: 'about.activities.4.desc', label: 'Activity 4 Description', type: 'textarea' },
  { key: 'about.activities.5.title', label: 'Activity 5 Title', type: 'text' },
  { key: 'about.activities.5.desc', label: 'Activity 5 Description', type: 'textarea' },
  { key: 'about.activities.6.title', label: 'Activity 6 Title', type: 'text' },
  { key: 'about.activities.6.desc', label: 'Activity 6 Description', type: 'textarea' },
  { key: 'about.confession.heading', label: 'Confession Section Heading', type: 'text' },
  { key: 'about.confession.text', label: 'Confession Excerpt', type: 'textarea' },
  { key: 'about.confession.link', label: 'Confession Link Text', type: 'text' },
  {
    key: 'about.yadah.bio',
    label: "Yadah's Bio",
    type: 'textarea',
    hint: 'Full biography shown on the About page',
  },
  {
    key: 'about.yadah.image',
    label: 'Yadah Portrait (About page)',
    type: 'image',
    hint: 'After uploading, click “Save this field” (or Save All) so the About page shows the new image.',
  },
  { key: 'about.yadah.musicLink', label: 'Music Link URL', type: 'url' },
  { key: 'about.shepherd.heading', label: 'Shepherd Section Label', type: 'text' },
  { key: 'about.shepherd.name', label: 'Shepherd Name', type: 'text' },
  { key: 'about.shepherd.role', label: 'Shepherd Role', type: 'text' },
  { key: 'about.shepherd.websiteLink', label: 'Website Link Text', type: 'text' },
  { key: 'about.shepherd.musicLinkLabel', label: 'Music Link Text', type: 'text' },
  { key: 'about.cta.headline', label: 'CTA Headline', type: 'text' },
  { key: 'about.cta.subtext', label: 'CTA Subtext', type: 'text' },
  { key: 'about.cta.button', label: 'CTA Button', type: 'text' },
]

export default async function CMSAboutPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="About Page"
      description="Edit all content on the About page including activities, confession, and Yadah's bio"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
