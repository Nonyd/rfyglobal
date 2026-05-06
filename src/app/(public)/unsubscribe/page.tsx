import { redirect } from 'next/navigation'

/** Matches links in emails (`/unsubscribe?email=`) — forwards to the API handler. */
export default function UnsubscribeRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const raw = searchParams.email
  const email = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined
  if (!email) redirect('/')
  redirect(`/api/unsubscribe?email=${encodeURIComponent(email)}`)
}
