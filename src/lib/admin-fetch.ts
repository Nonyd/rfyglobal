/**
 * Same-origin calls from `/admin` client components must send the session cookie.
 * Some browsers / privacy modes omit cookies on fetch unless credentials is set.
 *
 * DELETE and PATCH are sent as POST with `X-HTTP-Method-Override` so requests work
 * behind Cloudflare free WAF rules that block those verbs on `/api/*`.
 */
export function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const options = init ?? {}
  const method = (options.method ?? 'GET').toUpperCase()

  if (method === 'DELETE') {
    const headers = new Headers(options.headers as HeadersInit | undefined)
    headers.set('Content-Type', 'application/json')
    headers.set('X-HTTP-Method-Override', 'DELETE')
    return fetch(input, {
      ...options,
      method: 'POST',
      headers,
      body: options.body ?? JSON.stringify({}),
      credentials: 'include',
    })
  }

  if (method === 'PATCH') {
    const headers = new Headers(options.headers as HeadersInit | undefined)
    headers.set('X-HTTP-Method-Override', 'PATCH')
    const body = options.body
    if (!(body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    return fetch(input, {
      ...options,
      method: 'POST',
      headers,
      credentials: 'include',
    })
  }

  return fetch(input, {
    ...options,
    credentials: 'include',
  })
}
