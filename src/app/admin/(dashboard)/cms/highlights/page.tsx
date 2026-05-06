import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'highlights.1.title', label: 'Card 1 Title', type: 'text' },
  { key: 'highlights.1.desc', label: 'Card 1 Description', type: 'textarea' },
  { key: 'highlights.2.title', label: 'Card 2 Title', type: 'text' },
  { key: 'highlights.2.desc', label: 'Card 2 Description', type: 'textarea' },
  { key: 'highlights.3.title', label: 'Card 3 Title', type: 'text' },
  { key: 'highlights.3.desc', label: 'Card 3 Description', type: 'textarea' },
  { key: 'highlights.4.title', label: 'Card 4 Title', type: 'text' },
  { key: 'highlights.4.desc', label: 'Card 4 Description', type: 'textarea' },
]

export default async function CMSHighlightsPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Community Highlights"
      description="Edit the four feature cards on the landing page"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
