import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'faq.heading', label: 'Page Heading', type: 'text', hint: 'Main heading on the FAQ page' },
  { key: 'faq.subheading', label: 'Subheading', type: 'text', hint: 'Paragraph below the heading' },
]

export default async function CMSFaqPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="FAQs Page"
      description="Manage FAQ page heading and intro copy. Questions are managed in /admin/faq."
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
