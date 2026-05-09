'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

/** One shared SSE connection + optional polling for the admin dashboard */
export type NotificationStreamPayload = { event: string; source: 'sse' | 'poll' }

type ListenerEntry = {
  fn: (payload: NotificationStreamPayload) => void
  includePolling: boolean
}

export type AdminNotificationStreamApi = {
  subscribe: (
    listener: (payload: NotificationStreamPayload) => void,
    options?: { includePolling?: boolean },
  ) => () => void
}

const AdminNotificationStreamContext = createContext<AdminNotificationStreamApi | null>(null)

const POLL_MS = 60_000

export function AdminNotificationStreamProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Map<number, ListenerEntry>())
  const nextIdRef = useRef(0)

  const subscribe = useCallback(
    (listener: (payload: NotificationStreamPayload) => void, options?: { includePolling?: boolean }) => {
      const id = ++nextIdRef.current
      listenersRef.current.set(id, {
        fn: listener,
        includePolling: options?.includePolling ?? false,
      })
      return () => {
        listenersRef.current.delete(id)
      }
    },
    [],
  )

  const broadcast = useCallback((payload: NotificationStreamPayload) => {
    listenersRef.current.forEach(({ fn, includePolling }) => {
      if (payload.source === 'poll' && !includePolling) return
      try {
        fn(payload)
      } catch {
        /* ignore listener errors */
      }
    })
  }, [])

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>
    let es: EventSource | null = null

    const connect = () => {
      es = new EventSource('/api/admin/notifications/stream')

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string; event?: string }
          if (data.type !== 'notification') return
          broadcast({
            event: typeof data.event === 'string' ? data.event : 'notification',
            source: 'sse',
          })
        } catch {
          /* ignore */
        }
      }

      es.onerror = () => {
        es?.close()
        es = null
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(retryTimeout)
      es?.close()
    }
  }, [broadcast])

  useEffect(() => {
    const poll = setInterval(() => {
      broadcast({ event: 'poll', source: 'poll' })
    }, POLL_MS)
    return () => clearInterval(poll)
  }, [broadcast])

  const value = useMemo<AdminNotificationStreamApi>(() => ({ subscribe }), [subscribe])

  return (
    <AdminNotificationStreamContext.Provider value={value}>{children}</AdminNotificationStreamContext.Provider>
  )
}

export function useAdminNotificationStream(): AdminNotificationStreamApi {
  const ctx = useContext(AdminNotificationStreamContext)
  if (!ctx) {
    throw new Error('useAdminNotificationStream must be used within AdminNotificationStreamProvider')
  }
  return ctx
}

export function useAdminNotificationStreamOptional(): AdminNotificationStreamApi | null {
  return useContext(AdminNotificationStreamContext)
}
