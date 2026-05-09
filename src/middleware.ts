import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { canAccess } from '@/lib/permissions'
import { limitAdminLoginByIp } from '@/lib/rate-limit-login'

const LOGIN_RATE_LIMIT_TIMEOUT_MS = 1500

const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/notifications': 'notifications',
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

  if (isAdminRoute || isApiAdminRoute) {
    if (!req.auth) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = req.auth.user?.role ?? 'ADMIN'

    const pathForAcl = pathname.startsWith('/api/admin')
      ? pathname.replace(/^\/api\/admin/, '/admin')
      : pathname

    for (const [route, moduleKey] of SORTED_ADMIN_ROUTES) {
      if (pathForAcl.startsWith(route)) {
        if (!canAccess(role, moduleKey)) {
          return NextResponse.redirect(new URL('/admin?unauthorized=1', req.url))
        }
        break
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/callback/credentials'],
}
