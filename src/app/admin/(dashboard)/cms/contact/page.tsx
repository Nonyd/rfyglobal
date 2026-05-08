import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'contact.heading', label: 'Page Heading', type: 'text', hint: 'Main heading on the contact page' },
  { key: 'contact.subheading', label: 'Subheading', type: 'text', hint: 'Paragraph below the heading' },
  { key: 'contact.email', label: 'Contact Email', type: 'text', hint: 'Email address shown on the contact page' },
  { key: 'contact.address', label: 'Address / Location', type: 'text', hint: 'Physical address or city shown on contact page' },
  { key: 'contact.instagram', label: 'Instagram URL', type: 'url', hint: 'Full URL e.g. https://instagram.com/roomforyou' },
  { key: 'contact.youtube', label: 'YouTube URL', type: 'url', hint: 'Full URL e.g. https://youtube.com/@roomforyou' },
  { key: 'contact.twitter', label: 'X (Twitter) URL', type: 'url', hint: 'Full URL e.g. https://x.com/roomforyou' },
]

export default async function CMSContactPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Contact Page"
      description="Manage contact page heading, details, and social links"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
