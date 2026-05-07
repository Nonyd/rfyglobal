import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  {
    key: 'shepherd.quote',
    label: 'Yadah Quote',
    type: 'textarea',
    hint: 'The personal message from Yadah on the landing page',
  },
  { key: 'shepherd.name', label: 'Name', type: 'text' },
  { key: 'shepherd.title', label: 'Title / Role', type: 'text' },
  {
    key: 'shepherd.portrait',
    label: 'Shepherd Portrait Image',
    type: 'image',
    hint: 'Portrait photo of Minister Yadah — shown on the landing page Shepherd section',
    uploadFolder: 'portraits',
  },
  { key: 'shepherd.link', label: 'Yadah World Link', type: 'url' },
]

export default async function CMSShepherdPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="From the Shepherd"
      description="Edit Yadah's quote, photo, and links on the landing page"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
