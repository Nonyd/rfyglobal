import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { addSSEClient } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null
  let keepAliveInterval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          /* Controller closed */
        }
      }

      enqueue('data: {"type":"connected"}\n\n')

      cleanup = addSSEClient(enqueue)

      keepAliveInterval = setInterval(() => {
        try {
          enqueue('data: {"type":"ping"}\n\n')
        } catch {
          if (keepAliveInterval) clearInterval(keepAliveInterval)
          if (cleanup) cleanup()
        }
      }, 25000)

      req.signal.addEventListener('abort', () => {
        if (keepAliveInterval) clearInterval(keepAliveInterval)
        if (cleanup) cleanup()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      })
    },
    cancel() {
      if (keepAliveInterval) clearInterval(keepAliveInterval)
      if (cleanup) cleanup()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
