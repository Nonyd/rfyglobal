import { NextResponse, type NextRequest } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'
import { canAccess } from '@/lib/permissions'
import { limitAdminLoginByIp } from '@/lib/rate-limit-login'

const LOGIN_RATE_LIMIT_TIMEOUT_MS = 1500

type NextAuthRequest = NextRequest & { auth: Session | null }

/**
 * Middleware runs on the Edge; Prisma in the Auth session callback often cannot run there, so `req.auth`
 * may fall back to a stale JWT `role`. The `/api/auth/session` route runs on Node and hydrates role from
 * the DB — use it for ACL so SUPER_ADMIN / role changes match the admin UI.
 */
async function roleForAdminAcl(req: NextAuthRequest): Promise<string> {
  try {
    const sessionUrl = new URL('/api/auth/session', req.nextUrl.origin)
    const res = await fetch(sessionUrl, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = (await res.json()) as { user?: { role?: string } }
      const r = data?.user?.role
      if (typeof r === 'string' && r.trim()) return r.trim()
    }
  } catch {
    /* use JWT claims below */
  }
  const fallback = req.auth?.user?.role
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : 'ADMIN'
}

const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/notifications': 'notifications',
  '/admin/email-templates': 'email-templates',
  '/admin/testimonies': 'testimonies',
  '/admin/cms': 'cms',
  '/admin/integrations': 'integrations',
  '/admin/automation': 'automation',
  '/admin/partnership': 'partnership',
  '/admin/partner': 'partnership',
  '/admin/demo': 'demo',
  '/admin/users': 'users',
  '/admin/events': 'events',
  '/admin/forms': 'forms',
  '/admin/members': 'members',
  '/admin/gallery': 'gallery',
  '/admin/scripture': 'scripture',
  '/admin/blog': 'blog',
  '/admin/study': 'study',
  '/admin/activity': 'activity',
  '/admin/faq': 'faq',
  '/admin/testimony': 'testimonies',
  '/admin/prayer': 'prayer',
  '/admin/messages': 'messages',
  '/admin/live-chat': 'live-chat',
}

const SORTED_ADMIN_ROUTES = Object.entries(ROUTE_PERMISSIONS).sort(
  (a, b) => b[0].length - a[0].length,
)

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  if (pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    try {
      const { success } = await Promise.race([
        limitAdminLoginByIp(ip),
        new Promise<{ success: true }>((resolve) =>
          setTimeout(() => resolve({ success: true }), LOGIN_RATE_LIMIT_TIMEOUT_MS),
        ),
      ])
      if (!success) {
        return NextResponse.json(
          {
            error: 'Too many login attempts. Try again in 15 minutes.',
            message: 'Too many login attempts. Try again in 15 minutes.',
          },
          { status: 429 },
        )
      }
    } catch {
      /* Redis / rate limiter unavailable — allow request */
    }
    return NextResponse.next()
  }

  const isAdminRoute = pathname.startsWith('/admin')
  const isApiAdminRoute = pathname.startsWith('/api/admin')
  const isAdminLogin = pathname === '/admin/login'

  if (isAdminLogin) return NextResponse.next()

  // Global inbox API (+ SSE): signed-in admins only; skip module ACL (sidebar badges + bell).
  if (pathname.startsWith('/api/admin/notifications')) {
    if (!req.auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (isAdminRoute || isApiAdminRoute) {
    if (!req.auth) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = await roleForAdminAcl(req)

    const pathForAcl = pathname.startsWith('/api/admin')
      ? pathname.replace(/^\/api\/admin/, '/admin')
      : pathname

    // These APIs enforce `canAccess` inside route handlers with Node `auth()` (fresh DB role).
    // Edge middleware + JWT often disagree with the admin UI after role changes.
    const skipEdgeModuleAcl =
      pathname.startsWith('/api/admin/prayer') ||
      pathname.startsWith('/api/admin/testimony') ||
      pathname.startsWith('/api/admin/messages') ||
      pathname.startsWith('/api/admin/broadcast') ||
      pathname.startsWith('/api/admin/live-chat')

    if (!skipEdgeModuleAcl) {
      for (const [route, moduleKey] of SORTED_ADMIN_ROUTES) {
        if (pathForAcl.startsWith(route)) {
          if (!canAccess(role, moduleKey)) {
            if (pathname.startsWith('/api/admin')) {
              return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
            return NextResponse.redirect(new URL('/admin?unauthorized=1', req.url))
          }
          break
        }
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/callback/credentials'],
}
