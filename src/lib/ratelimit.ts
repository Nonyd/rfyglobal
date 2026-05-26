import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

let sharedRedis: Redis | null | undefined
function redis(): Redis | null {
  if (sharedRedis === undefined) sharedRedis = getRedis()
  return sharedRedis
}

let ratelimitSingleton: Ratelimit | null | undefined
function getRatelimit(): Ratelimit | null {
  if (ratelimitSingleton !== undefined) return ratelimitSingleton
  const r = redis()
  if (!r) {
    ratelimitSingleton = null
    return null
  }
  ratelimitSingleton = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  })
  return ratelimitSingleton
}

let strictSingleton: Ratelimit | null | undefined
function getStrictRatelimit(): Ratelimit | null {
  if (strictSingleton !== undefined) return strictSingleton
  const r = redis()
  if (!r) {
    strictSingleton = null
    return null
  }
  strictSingleton = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    analytics: true,
  })
  return strictSingleton
}

/** Lazy + skips when Upstash env is missing (local dev / build). */
export const ratelimit = {
  limit: (...args: Parameters<Ratelimit['limit']>) => {
    const l = getRatelimit()
    if (!l) return Promise.resolve({ success: true } as Awaited<ReturnType<Ratelimit['limit']>>)
    return l.limit(...args)
  },
}

export const strictRatelimit = {
  limit: (...args: Parameters<Ratelimit['limit']>) => {
    const l = getStrictRatelimit()
    if (!l) return Promise.resolve({ success: true } as Awaited<ReturnType<Ratelimit['limit']>>)
    return l.limit(...args)
  },
}
