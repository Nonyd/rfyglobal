import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'contact.eyebrow', label: 'Page Eyebrow', type: 'text' },
  { key: 'contact.heading', label: 'Page Heading', type: 'text', hint: 'Use \\n for line breaks' },
  { key: 'contact.subheading', label: 'Subheading', type: 'text', hint: 'Paragraph below the heading' },
  { key: 'contact.email', label: 'Contact Email', type: 'text', hint: 'Email address shown on the contact page' },
  { key: 'contact.whatsapp', label: 'WhatsApp URL or Phone', type: 'url', hint: 'Full wa.me link or phone number' },
  { key: 'contact.address', label: 'Address / Location', type: 'text', hint: 'Physical address or city shown on contact page' },
  { key: 'contact.instagram', label: 'Instagram URL', type: 'url' },
  { key: 'contact.instagramHandle', label: 'Instagram Display Handle', type: 'text' },
  { key: 'contact.youtube', label: 'YouTube URL', type: 'url' },
  { key: 'contact.youtubeHandle', label: 'YouTube Display Handle', type: 'text' },
  { key: 'contact.twitter', label: 'X (Twitter) URL', type: 'url' },
  { key: 'contact.twitterHandle', label: 'X Display Handle', type: 'text' },
  { key: 'contact.responseNote', label: 'Response Time Note', type: 'textarea' },
]

export default async function CMSContactPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Contact Page"
      description="Manage contact page heading, details, social links, and handles"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
