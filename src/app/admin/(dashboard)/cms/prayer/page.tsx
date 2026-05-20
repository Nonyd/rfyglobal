import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'prayer.eyebrow', label: 'Page Eyebrow', type: 'text' },
  { key: 'prayer.title', label: 'Page Title', type: 'text', hint: 'Use \\n for line breaks' },
  { key: 'prayer.subtitle', label: 'Subtitle', type: 'textarea' },
  { key: 'prayer.privacy', label: 'Privacy Notice', type: 'textarea' },
]

export default async function CMSPrayerPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Prayer Wall"
      description="Header copy on the public prayer request page"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
