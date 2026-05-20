import { getContentMany, getDefaultsForKeys } from '@/lib/content'
import { CMSEditor } from '@/components/admin/cms/CMSEditor'
import type { CMSField } from '@/components/admin/cms/CMSEditor'

export const dynamic = 'force-dynamic'

const FIELDS: CMSField[] = [
  { key: 'join.hero.line1', label: 'Hero Line 1 (outline)', type: 'text' },
  { key: 'join.hero.line2', label: 'Hero Line 2', type: 'text' },
  { key: 'join.hero.line3', label: 'Hero Line 3 (gold)', type: 'text' },
  { key: 'join.hero.line4', label: 'Hero Line 4', type: 'text' },
  { key: 'join.hero.line5', label: 'Hero Line 5 (outline gold)', type: 'text' },
]

export default async function CMSJoinPage() {
  const keys = FIELDS.map((f) => f.key)
  const values = await getContentMany(keys)
  const defaults = getDefaultsForKeys(keys)
  return (
    <CMSEditor
      title="Join Page"
      description="Animated hero headline lines on the membership page"
      fields={FIELDS}
      initialValues={values}
      defaults={defaults}
    />
  )
}
