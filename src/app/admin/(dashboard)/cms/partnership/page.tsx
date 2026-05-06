import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'partnership.hero.headline', label: 'Hero Headline', type: 'text' },
  { key: 'partnership.hero.subtext', label: 'Hero Subtext', type: 'textarea' },
  { key: 'partnership.hero.scripture', label: 'Hero Scripture', type: 'textarea' },
  { key: 'partnership.card1.title', label: 'Impact Card 1 Title', type: 'text' },
  { key: 'partnership.card1.desc', label: 'Impact Card 1 Description', type: 'textarea' },
  { key: 'partnership.card2.title', label: 'Impact Card 2 Title', type: 'text' },
  { key: 'partnership.card2.desc', label: 'Impact Card 2 Description', type: 'textarea' },
  { key: 'partnership.card3.title', label: 'Impact Card 3 Title', type: 'text' },
  { key: 'partnership.card3.desc', label: 'Impact Card 3 Description', type: 'textarea' },
  { key: 'partnership.bank.bankName', label: 'Bank Name', type: 'text', hint: 'e.g. Access Bank' },
  { key: 'partnership.bank.accountName', label: 'Account Name', type: 'text' },
  {
    key: 'partnership.bank.accountNumber',
    label: 'Account Number',
    type: 'text',
    hint: 'This is displayed publicly on the partnership page',
  },
  { key: 'partnership.bank.contactEmail', label: 'Contact Email (for bank transfers)', type: 'text' },
]

export default async function CMSPartnershipPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Partnership Page"
      description="Edit the partnership vision text and bank transfer details"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
