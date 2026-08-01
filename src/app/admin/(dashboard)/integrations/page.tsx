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

const YOUTUBE_KEYS = [
  'youtube_api_key',
  'youtube_channel_id',
  'rfy_live_playlist_id',
] as const

export default async function IntegrationsPage() {
  const [records, youtubeSettings] = await Promise.all([
    db.credential.findMany({ orderBy: { service: 'asc' } }),
    db.rfySetting
      .findMany({ where: { key: { in: [...YOUTUBE_KEYS] } } })
      .catch(() => [] as { key: string; value: string }[]),
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
          }),
        )
        return [record.service, { ...masked, isActive: record.isActive }]
      } catch {
        return [record.service, { isActive: record.isActive }]
      }
    }),
  )

  const byKey = Object.fromEntries(youtubeSettings.map((s) => [s.key, s.value]))
  const apiKey = byKey.youtube_api_key || process.env.YOUTUBE_API_KEY || ''
  const channelId =
    byKey.youtube_channel_id || process.env.YOUTUBE_CHANNEL_ID || 'UCvNAZbtM-sWGJs0jlA-Tbag'
  const playlistId = byKey.rfy_live_playlist_id || process.env.RFY_LIVE_PLAYLIST_ID || ''

  return (
    <IntegrationsManager
      initialData={initialData}
      initialYoutube={{
        apiKey: apiKey ? maskSecret(apiKey) : '',
        channelId,
        playlistId,
      }}
    />
  )
}
