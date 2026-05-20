import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const pageSections = [
  { id: 'word', label: 'Daily Word (/word)' },
  { id: 'study', label: 'Study Portal (/study)' },
  { id: 'events', label: 'Events (/events)' },
  { id: 'gallery', label: 'Gallery (/gallery)' },
  { id: 'blog', label: 'Devotionals (/blog)' },
  { id: 'testimonies', label: 'Testimonies (/testimonies)' },
] as const

const FIELDS: CMSField[] = pageSections.flatMap(({ id, label }) => [
  { key: `pages.${id}.eyebrow`, label: `${label} — Eyebrow`, type: 'text' as const },
  { key: `pages.${id}.title`, label: `${label} — Title`, type: 'text' as const, hint: 'Use \\n for line breaks' },
  { key: `pages.${id}.subtitle`, label: `${label} — Subtitle`, type: 'textarea' as const },
])

export default async function CMSPagesPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Page Headers"
      description="Eyebrow, title, and subtitle for Word, Study, Events, Gallery, Blog, and Testimonies"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
