import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { limitAdminLoginByIp } from '@/lib/rate-limit-login'

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  if (pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    try {
      const { success } = await limitAdminLoginByIp(ip)
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
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/callback/credentials'],
}
