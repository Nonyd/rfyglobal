'use client'

import { useEffect, useRef } from 'react'
import { useAdminNotificationStreamOptional } from '@/components/admin/AdminNotificationStreamProvider'

export type SSEEventType =
  | 'new_prayer'
  | 'new_testimony'
  | 'new_message'
  | 'new_member'
  | 'new_partner'
  | 'new_event_registration'
  | 'new_chat'
  | 'new_chat_message'
  | 'chat_reply'
  | 'notification'

function joinEvents(events: SSEEventType[]) {
  return events.join(',')
}

interface UseAdminSSEOptions {
  events: SSEEventType[]
  onEvent: () => void
  enabled?: boolean
}

export function useAdminSSE({ events, onEvent, enabled = true }: UseAdminSSEOptions) {
  const stream = useAdminNotificationStreamOptional()
  const eventSourceRef = useRef<EventSource | null>(null)
  const onEventRef = useRef(onEvent)
  const eventsRef = useRef(events)
  const key = joinEvents(events)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    if (!enabled) return

    const matches = (eventName: string) =>
      eventsRef.current.includes(eventName as SSEEventType)

    if (stream) {
      return stream.subscribe(({ event }) => {
        const evt = event || 'notification'
        if (matches(evt)) {
          onEventRef.current()
        }
      })
    }

    let retryTimeout: ReturnType<typeof setTimeout>

    const connect = () => {
      const es = new EventSource('/api/admin/notifications/stream')
      eventSourceRef.current = es

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { type?: string; event?: string }
          if (data.type !== 'notification') return
          const evt = typeof data.event === 'string' ? data.event : 'notification'
          if (matches(evt)) {
            onEventRef.current()
          }
        } catch {
          /* ignore malformed */
        }
      }

      es.onerror = () => {
        es.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      eventSourceRef.current?.close()
      clearTimeout(retryTimeout)
    }
  }, [enabled, key, stream])
}
