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

  let role =
    typeof session.user.role === 'string' && session.user.role.trim()
      ? session.user.role.trim()
      : 'ADMIN'

  const userId = session.user.id
  if (userId && userId !== 'env-admin') {
    try {
      const row = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true },
      })
      if (row?.isActive) {
        role = row.role
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
