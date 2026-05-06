import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  {
    key: 'seo.defaultTitle',
    label: 'Default Page Title',
    type: 'text',
    hint: 'Used when a page has no specific title',
  },
  {
    key: 'seo.defaultDescription',
    label: 'Default Meta Description',
    type: 'textarea',
    hint: 'Shown in Google search results',
  },
  {
    key: 'seo.ogImage',
    label: 'Default OG Image',
    type: 'image',
    hint: '1200×630px — shown when links are shared on WhatsApp, Twitter, etc.',
  },
]

export default async function CMSSEOPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="SEO Defaults"
      description="Edit the default title, description, and Open Graph image"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
