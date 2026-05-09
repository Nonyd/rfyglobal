'use client'

import { useCallback, useEffect, useState } from 'react'

export type NavBadgeKey =
  | 'prayers'
  | 'testimonies'
  | 'messages'
  | 'members'
  | 'events'
  | 'partner'
  | 'all'

export function badgeCountForNav(
  key: NavBadgeKey | undefined,
  unreadByType: Record<string, number>,
  total: number,
): number {
  if (!key) return 0
  switch (key) {
    case 'prayers':
      return unreadByType.prayer ?? 0
    case 'testimonies':
      return unreadByType.testimony ?? 0
    case 'messages':
      return (unreadByType.message ?? 0) + (unreadByType.contact ?? 0)
    case 'members':
      return unreadByType.member ?? 0
    case 'events':
      return unreadByType.event_registration ?? 0
    case 'partner':
      return unreadByType.partner ?? 0
    case 'all':
      return total
    default:
      return 0
  }
}

export function useAdminNotificationBadges() {
  const [unreadByType, setUnreadByType] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      if (res.ok) {
        const d = await res.json()
        setUnreadByType((d.unreadByType ?? {}) as Record<string, number>)
        setTotal(d.total ?? 0)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void load()
    const es = new EventSource('/api/admin/notifications/stream')
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'notification') void load()
      } catch {
        /* ignore */
      }
    }
    return () => es.close()
  }, [load])

  return { unreadByType, total, refresh: load }
}
