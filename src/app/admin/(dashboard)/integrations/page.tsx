import { IntegrationsManager } from '@/components/admin/integrations/IntegrationsManager'
import { db } from '@/lib/db'
import { decrypt, maskSecret } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const NON_SECRET_KEYS = new Set([
  'fromEmail',
  'fromName',
  'senderId',
  'bankName',
  'accountName',
  'contactEmail',
  'minimumGiftAmount',
])

export default async function IntegrationsPage() {
  const [records, playlistSetting] = await Promise.all([
    db.credential.findMany({ orderBy: { service: 'asc' } }),
    db.rfySetting
      .findUnique({ where: { key: 'rfy_live_playlist_id' } })
      .catch(() => null),
  ])
  const initialData = Object.fromEntries(
    records.map((record) => {
      try {
        const data = JSON.parse(decrypt(record.data)) as Record<string, unknown>
        const masked = Object.fromEntries(
          Object.entries(data).map(([k, v]) => {
            if (typeof v === 'string' && v.length > 6 && !NON_SECRET_KEYS.has(k)) {
              return [k, maskSecret(v)]
            }
            return [k, v]
          })
        )
        return [record.service, { ...masked, isActive: record.isActive }]
      } catch {
        return [record.service, { isActive: record.isActive }]
      }
    })
  )

  const initialPlaylistId =
    playlistSetting?.value || process.env.RFY_LIVE_PLAYLIST_ID || ''

  return (
    <IntegrationsManager initialData={initialData} initialPlaylistId={initialPlaylistId} />
  )
}
