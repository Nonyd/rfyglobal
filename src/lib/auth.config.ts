import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@prisma/client'

/**
 * Edge-safe Auth.js config: no Prisma, no Node-only imports.
 * Used directly by middleware; `src/lib/auth.ts` extends it with the credentials provider and DB lookups.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        if ('role' in user && user.role) {
          token.role = user.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) return session
      // JWT claims only. Without id/role here, middleware sees no user → redirect loop back to /admin/login.
      session.user.id = token.sub
      if (typeof token.role === 'string') {
        session.user.role = token.role as Role
      }
      if (token.sub === 'env-admin') {
        session.user.role = 'ADMIN'
      }
      return session
    },
  },
} satisfies NextAuthConfig
