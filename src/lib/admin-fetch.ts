/**
 * Same-origin calls from `/admin` client components must send the session cookie.
 * Some browsers / privacy modes omit cookies on fetch unless credentials is set.
 */
export function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: 'include' })
}
