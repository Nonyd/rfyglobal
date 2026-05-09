'use client'

import { useEffect, useRef } from 'react'

export type SSEEventType =
  | 'new_prayer'
  | 'new_testimony'
  | 'new_message'
  | 'new_member'
  | 'new_partner'
  | 'new_event_registration'
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

    let retryTimeout: ReturnType<typeof setTimeout>

    const connect = () => {
      const es = new EventSource('/api/admin/notifications/stream')
      eventSourceRef.current = es

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string; event?: string }
          if (
            data.type === 'notification' &&
            data.event &&
            eventsRef.current.includes(data.event as SSEEventType)
          ) {
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
  }, [enabled, key])
}
