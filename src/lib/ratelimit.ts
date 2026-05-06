import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required for rate limiting')
  }
  return new Redis({ url, token })
}

let sharedRedis: Redis | undefined
function redis(): Redis {
  if (!sharedRedis) sharedRedis = getRedis()
  return sharedRedis
}

let ratelimitSingleton: Ratelimit | undefined
function getRatelimit(): Ratelimit {
  if (!ratelimitSingleton) {
    ratelimitSingleton = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
    })
  }
  return ratelimitSingleton
}

let strictSingleton: Ratelimit | undefined
function getStrictRatelimit(): Ratelimit {
  if (!strictSingleton) {
    strictSingleton = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
    })
  }
  return strictSingleton
}

/** Lazy so importing this module during `next build` does not call `Redis.fromEnv()` without credentials. */
export const ratelimit = {
  limit: (...args: Parameters<Ratelimit['limit']>) => getRatelimit().limit(...args),
}

export const strictRatelimit = {
  limit: (...args: Parameters<Ratelimit['limit']>) => getStrictRatelimit().limit(...args),
}
