import { db } from '@/lib/db'
import { ScriptureManager } from '@/components/admin/scripture/ScriptureManager'

export const dynamic = 'force-dynamic'

export default async function ScripturePage() {
  const scriptures = await db.scripture.findMany({
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
  })

  return <ScriptureManager initialScriptures={scriptures} />
}
