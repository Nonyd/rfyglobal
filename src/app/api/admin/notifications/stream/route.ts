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

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          /* closed */
        }
      }

      const cleanup = addSSEClient(send)

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
        } catch {
          clearInterval(keepAlive)
          cleanup()
        }
      }, 30000)

      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        cleanup()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
