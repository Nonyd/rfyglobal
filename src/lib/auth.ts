import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from '@/lib/auth.config'
import { db } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') return null

        // If DB is unavailable, still allow env-based emergency admin login.
        try {
          const user = await db.user.findUnique({ where: { email } })
          if (user) {
            if (!user.isActive) return null
            const { compare } = await import('bcryptjs')
            const valid = await compare(password, user.password)
            if (!valid) return null
            await db.user
              .update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
              })
              .catch(() => {})
            return {
              id: user.id,
              email: user.email,
              name: user.name ?? undefined,
              role: user.role,
            }
          }
        } catch (error) {
          console.error('Admin credential lookup failed:', error)
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        if (
          adminEmail &&
          adminPassword &&
          email === adminEmail &&
          password === adminPassword
        ) {
          return {
            id: 'env-admin',
            email,
            name: 'Admin',
            role: 'ADMIN' as const,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session(params) {
      // Hydrate from JWT first (edge-safe config) so the session is never empty if the DB is slow or errors.
      const session = await authConfig.callbacks.session(params)
      const { token } = params
      if (!session.user || !token.sub || token.sub === 'env-admin') return session

      try {
        const user = await db.user.findUnique({
          where: { id: token.sub },
          select: { id: true, role: true, name: true, email: true, isActive: true },
        })
        if (user?.isActive) {
          session.user.id = user.id
          session.user.role = user.role
          session.user.name = user.name ?? undefined
          session.user.email = user.email ?? undefined
        }
      } catch (err) {
        console.error('[auth] session DB lookup failed — using JWT claims only:', err)
      }

      return session
    },
  },
})
