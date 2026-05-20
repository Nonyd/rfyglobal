import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'confession.home.label', label: 'Homepage Section Label', type: 'text' },
  {
    key: 'confession.home.lines',
    label: 'Homepage Confession Lines',
    type: 'textarea',
    hint: 'One line per row (shown on homepage)',
  },
  { key: 'confession.home.footer', label: 'Homepage Footer Text', type: 'textarea' },
  { key: 'confession.home.link', label: 'Homepage Link Text', type: 'text' },
  {
    key: 'confession.full.lines',
    label: 'Full Confession Lines',
    type: 'textarea',
    hint: 'One line per row (scroll experience on /confession)',
  },
  { key: 'confession.page.eyebrow', label: 'Confession Page Eyebrow', type: 'text' },
  { key: 'confession.page.title', label: 'Confession Page Title', type: 'text' },
  { key: 'confession.page.intro', label: 'Confession Page Intro', type: 'text' },
  { key: 'confession.page.cta.headline', label: 'Bottom CTA Headline', type: 'text' },
  { key: 'confession.page.cta.subtext', label: 'Bottom CTA Subtext', type: 'textarea' },
  { key: 'confession.page.cta.primary', label: 'Primary Button', type: 'text' },
  { key: 'confession.page.cta.secondary', label: 'Secondary Button', type: 'text' },
  { key: 'confession.page.footer', label: 'Page Footer Line', type: 'text' },
]

export default async function CMSConfessionPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="The Confession"
      description="Homepage excerpt and full scroll confession on /confession"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
