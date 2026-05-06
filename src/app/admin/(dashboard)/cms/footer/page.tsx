import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'footer.tagline', label: 'Footer Tagline', type: 'text' },
  { key: 'footer.copyright', label: 'Copyright Line', type: 'text' },
  { key: 'footer.instagram', label: 'Instagram URL', type: 'url' },
  { key: 'footer.youtube', label: 'YouTube URL', type: 'url' },
  { key: 'footer.twitter', label: 'Twitter / X URL', type: 'url' },
]

export default async function CMSFooterPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Footer"
      description="Edit the footer tagline, copyright, and social links"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
