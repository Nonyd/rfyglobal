import type { Session } from 'next-auth'
import { NextResponse } from 'next/server'
import { canAccess } from '@/lib/permissions'

/**
 * Enforce sidebar module permissions using Node `auth()` (DB-backed role).
 * Use for `/api/admin/*` routes where middleware ACL may see a stale JWT on the Edge.
 *
 * @param moduleKey — keys aligned with `canAccess` / `permissions` moduleMap (e.g. `'prayer'`, `'testimonies'`, `'messages'`).
 */
export function forbidUnlessCanAccess(session: Session | null, moduleKey: string): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const role = session.user.role ?? 'ADMIN'
  if (!canAccess(role, moduleKey)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
