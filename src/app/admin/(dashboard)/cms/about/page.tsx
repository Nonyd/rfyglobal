import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'about.hero.headline1', label: 'Hero Headline Line 1', type: 'text' },
  { key: 'about.hero.headline2', label: 'Hero Headline Line 2 (gold)', type: 'text' },
  { key: 'about.vision.text', label: 'Vision Text', type: 'textarea' },
  { key: 'about.mission.heading', label: 'Mission Heading', type: 'text' },
  { key: 'about.mission.scripture', label: 'Mission Scripture Reference', type: 'text' },
  { key: 'about.mission.text', label: 'Mission Scripture Text', type: 'textarea' },
  {
    key: 'about.yadah.bio',
    label: "Yadah's Bio",
    type: 'textarea',
    hint: 'Full biography shown on the About page',
  },
  { key: 'about.yadah.image', label: 'Yadah Portrait (About page)', type: 'image' },
  { key: 'about.yadah.musicLink', label: 'Music Link', type: 'url' },
  { key: 'about.cta.headline', label: 'CTA Headline', type: 'text' },
  { key: 'about.cta.subtext', label: 'CTA Subtext', type: 'text' },
]

export default async function CMSAboutPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="About Page"
      description="Edit all content on the About page including Yadah's bio and portrait"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
