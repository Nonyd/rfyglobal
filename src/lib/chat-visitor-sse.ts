// Visitor-facing live chat SSE fan-out (used by /api/chat/stream and notify.ts)

const visitorClients = new Map<string, Set<(data: string) => void>>()

export function addVisitorSSEClient(sessionToken: string, send: (data: string) => void): () => void {
  if (!visitorClients.has(sessionToken)) {
    visitorClients.set(sessionToken, new Set())
  }
  visitorClients.get(sessionToken)!.add(send)
  return () => {
    visitorClients.get(sessionToken)?.delete(send)
    if (visitorClients.get(sessionToken)?.size === 0) {
      visitorClients.delete(sessionToken)
    }
  }
}

export function broadcastToVisitor(sessionToken: string, payload: object): void {
  const clients = visitorClients.get(sessionToken)
  if (!clients || clients.size === 0) return
  const message = `data: ${JSON.stringify(payload)}\n\n`
  clients.forEach((send) => {
    try {
      send(message)
    } catch {
      /* disconnected */
    }
  })
}
