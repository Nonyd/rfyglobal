import { db } from '@/lib/db'
import { formatDuration } from '@/lib/rfy-youtube-format'

export { formatDuration }

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/** Strip quotes/whitespace and extract playlist id from a full YouTube URL if pasted. */
export function normalizePlaylistId(raw: string): string {
  let value = raw.trim().replace(/^["']|["']$/g, '')
  if (!value) return ''

  try {
    if (value.includes('list=')) {
      const url = value.startsWith('http')
        ? new URL(value)
        : new URL(value, 'https://www.youtube.com')
      const list = url.searchParams.get('list')
      if (list) value = list
    }
  } catch {
    // keep trimmed value
  }

  // Sometimes admins paste "playlist?list=PLxxx" without a host
  const listMatch = value.match(/[?&]list=([a-zA-Z0-9_-]+)/)
  if (listMatch?.[1]) value = listMatch[1]

  return value.trim()
}

export function normalizeApiKey(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '')
}

function youtubeErrorMessage(data: {
  error?: {
    message?: string
    errors?: Array<{ message?: string; reason?: string; domain?: string }>
  }
}): string {
  const top = data.error?.message?.trim()
  const detail = data.error?.errors?.[0]
  const reason = detail?.reason
  const detailMsg = detail?.message?.trim()

  const combined = [top, detailMsg].filter(Boolean).join(' — ') || 'YouTube API error'

  // Common admin mistakes → actionable copy
  if (reason === 'invalid' || /invalid (value|data|id|playlist)/i.test(combined)) {
    return (
      'Invalid playlist ID. Use the playlist id from youtube.com/playlist?list=PLxxxx ' +
      '(not the channel ID that starts with UC).'
    )
  }
  if (reason === 'playlistNotFound' || /playlist.*not found/i.test(combined)) {
    return 'Playlist not found. Check that the playlist is public (or unlisted) and the ID is correct.'
  }
  if (reason === 'keyInvalid' || /api key not valid/i.test(combined)) {
    return 'YouTube API key is invalid. Paste a valid YouTube Data API v3 key and save again.'
  }

  return combined
}

async function getSetting(key: string, envFallback = ''): Promise<string> {
  try {
    const setting = await db.rfySetting.findUnique({ where: { key } })
    const value = setting?.value?.trim()
    if (value) return value
  } catch {
    // fall through to env
  }
  return envFallback.trim()
}

async function getApiKey(): Promise<string> {
  return normalizeApiKey(
    await getSetting('youtube_api_key', process.env.YOUTUBE_API_KEY ?? ''),
  )
}

async function getPlaylistId(): Promise<string | null> {
  const value = normalizePlaylistId(
    await getSetting('rfy_live_playlist_id', process.env.RFY_LIVE_PLAYLIST_ID ?? ''),
  )
  return value || null
}

function parseISODuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = parseInt(match[1] ?? '0', 10)
  const m = parseInt(match[2] ?? '0', 10)
  const s = parseInt(match[3] ?? '0', 10)
  return h * 3600 + m * 60 + s
}

type YoutubePlaylistItemsResponse = {
  error?: {
    message?: string
    errors?: Array<{ message?: string; reason?: string; domain?: string }>
  }
  items?: Array<{ contentDetails?: { videoId?: string } }>
  nextPageToken?: string
}

type YoutubeVideosResponse = {
  error?: {
    message?: string
    errors?: Array<{ message?: string; reason?: string; domain?: string }>
  }
  items?: Array<{
    id: string
    snippet?: {
      title?: string
      description?: string
      publishedAt?: string
      thumbnails?: Record<string, { url?: string } | undefined>
    }
    contentDetails?: { duration?: string }
    statistics?: { viewCount?: string }
  }>
}

export async function syncRfyLivePlaylist(): Promise<{ synced: number; error?: string }> {
  const apiKey = await getApiKey()
  const playlistId = await getPlaylistId()

  if (!apiKey) return { synced: 0, error: 'No YouTube API key configured' }
  if (!playlistId) return { synced: 0, error: 'No RFY live playlist ID configured' }

  // Channel IDs start with UC — not valid as playlistId
  if (/^UC[\w-]{20,}$/i.test(playlistId)) {
    return {
      synced: 0,
      error:
        'That looks like a Channel ID (starts with UC). Put it in Channel ID, and use a Playlist ID (usually starts with PL) for sync.',
    }
  }

  try {
    const videoIds: string[] = []
    let pageToken: string | undefined

    do {
      const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`)
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('playlistId', playlistId)
      url.searchParams.set('maxResults', '50')
      url.searchParams.set('key', apiKey)
      if (pageToken) url.searchParams.set('pageToken', pageToken)

      const res = await fetch(url.toString())
      const data = (await res.json()) as YoutubePlaylistItemsResponse

      if (data.error) throw new Error(youtubeErrorMessage(data))

      for (const item of data.items ?? []) {
        const videoId = item.contentDetails?.videoId
        if (videoId) videoIds.push(videoId)
      }

      pageToken = data.nextPageToken
    } while (pageToken)

    if (videoIds.length === 0) return { synced: 0 }

    const allVideoDetails: NonNullable<YoutubeVideosResponse['items']> = []
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50)
      const url = new URL(`${YOUTUBE_API_BASE}/videos`)
      url.searchParams.set('part', 'snippet,contentDetails,statistics')
      url.searchParams.set('id', batch.join(','))
      url.searchParams.set('key', apiKey)

      const res = await fetch(url.toString())
      const data = (await res.json()) as YoutubeVideosResponse
      if (data.error) throw new Error(youtubeErrorMessage(data))
      allVideoDetails.push(...(data.items ?? []))
    }

    let synced = 0
    for (let i = 0; i < allVideoDetails.length; i++) {
      const video = allVideoDetails[i]!
      const snippet = video.snippet ?? {}
      const thumbnails = snippet.thumbnails ?? {}
      const thumbnailUrl =
        thumbnails.maxres?.url ??
        thumbnails.standard?.url ??
        thumbnails.high?.url ??
        thumbnails.medium?.url ??
        thumbnails.default?.url ??
        ''

      await db.rfyLiveVideo.upsert({
        where: { youtubeVideoId: video.id },
        update: {
          title: snippet.title ?? '',
          description: snippet.description ?? null,
          thumbnailUrl,
          publishedAt: new Date(snippet.publishedAt ?? Date.now()),
          durationSec: parseISODuration(video.contentDetails?.duration ?? ''),
          viewCount: parseInt(video.statistics?.viewCount ?? '0', 10) || 0,
          position: i,
          isActive: true,
        },
        create: {
          youtubeVideoId: video.id,
          title: snippet.title ?? '',
          description: snippet.description ?? null,
          thumbnailUrl,
          publishedAt: new Date(snippet.publishedAt ?? Date.now()),
          durationSec: parseISODuration(video.contentDetails?.duration ?? ''),
          viewCount: parseInt(video.statistics?.viewCount ?? '0', 10) || 0,
          position: i,
          isActive: true,
        },
      })
      synced++
    }

    await db.rfyLiveVideo.updateMany({
      where: {
        youtubeVideoId: { notIn: videoIds },
        isActive: true,
      },
      data: { isActive: false },
    })

    return { synced }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[rfy-youtube-sync]', error)

    // Prisma table missing (db push not run yet)
    if (/does not exist|RfyLiveVideo|rfy_live_video|Unknown arg/i.test(message)) {
      return {
        synced: 0,
        error:
          'Database tables for RFY Live are missing. Run `npx prisma db push` on the server, then try Sync again.',
      }
    }

    return { synced: 0, error: message }
  }
}
