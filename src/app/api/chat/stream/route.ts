import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addVisitorSSEClient } from '@/lib/chat-visitor-sse'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionToken = searchParams.get('token')

  if (!sessionToken) {
    return new Response('Token required', { status: 400 })
  }

  const session = await db.liveChatSession.findUnique({
    where: { sessionToken },
  })
  if (!session) return new Response('Not found', { status: 404 })

  const encoder = new TextEncoder()
  let cleanup: (() => void) | null = null
  let keepAlive: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          /* closed */
        }
      }

      enqueue('data: {"type":"connected"}\n\n')
      cleanup = addVisitorSSEClient(sessionToken, enqueue)

      keepAlive = setInterval(() => {
        try {
          enqueue('data: {"type":"ping"}\n\n')
        } catch {
          if (keepAlive) clearInterval(keepAlive)
          if (cleanup) cleanup()
        }
      }, 25000)

      req.signal.addEventListener('abort', () => {
        if (keepAlive) clearInterval(keepAlive)
        if (cleanup) cleanup()
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      })
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive)
      if (cleanup) cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
