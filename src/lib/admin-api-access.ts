import type { Session } from 'next-auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { canAccess } from '@/lib/permissions'

/**
 * Enforce sidebar module permissions using Node `auth()` + DB role (source of truth).
 * JWT/session `user.role` can be missing or stale; reconcile from the User row when possible.
 *
 * @param moduleKey — keys aligned with `canAccess` / `permissions` moduleMap (e.g. `'prayer'`, `'testimonies'`, `'messages'`).
 */
export async function forbidUnlessCanAccess(
  session: Session | null,
  moduleKey: string,
): Promise<NextResponse | null> {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let role = 'ADMIN'
  if (session.user.role !== undefined && session.user.role !== null) {
    const s = String(session.user.role).trim()
    if (s) role = s
  }

  const userId = session.user.id

  // Mirror auth session callback: env login always runs as ADMIN for ACL.
  if (userId === 'env-admin') {
    role = 'ADMIN'
  } else if (userId) {
    try {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true },
      })
      if (row?.isActive) {
        role = String(row.role)
      }
    } catch {
      /* keep JWT/session role */
    }
  }

  if (!canAccess(role, moduleKey)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/** Allow route when the user has any of the listed module permissions. */
export async function forbidUnlessCanAccessAny(
  session: Session | null,
  moduleKeys: string[],
): Promise<NextResponse | null> {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  for (const key of moduleKeys) {
    const denied = await forbidUnlessCanAccess(session, key)
    if (!denied) return null
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
