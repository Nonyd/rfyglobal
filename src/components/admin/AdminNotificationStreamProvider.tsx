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

/** One shared SSE connection for the admin dashboard (badges, full notifications page). */
export type NotificationStreamPayload = { event: string; source: 'sse' }

type ListenerEntry = {
  fn: (payload: NotificationStreamPayload) => void
}

export type AdminNotificationStreamApi = {
  subscribe: (listener: (payload: NotificationStreamPayload) => void) => () => void
}

const AdminNotificationStreamContext = createContext<AdminNotificationStreamApi | null>(null)

export function AdminNotificationStreamProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef(new Map<number, ListenerEntry>())
  const nextIdRef = useRef(0)

  const subscribe = useCallback((listener: (payload: NotificationStreamPayload) => void) => {
    const id = ++nextIdRef.current
    listenersRef.current.set(id, { fn: listener })
    return () => {
      listenersRef.current.delete(id)
    }
  }, [])

  const broadcast = useCallback((payload: NotificationStreamPayload) => {
    listenersRef.current.forEach(({ fn }) => {
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
