import 'server-only'

import { PrismaClient } from '@prisma/client'
import { validateEnv } from './env'

// Skip during Next compile so `next build` does not require every secret in the build environment.
const skipEnvValidation =
  process.env.NODE_ENV !== 'production' ||
  process.env.SKIP_ENV_VALIDATION === '1' ||
  process.env.NEXT_PHASE === 'phase-production-build'

if (typeof window === 'undefined' && !skipEnvValidation) validateEnv()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
