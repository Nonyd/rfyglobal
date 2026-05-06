import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

let limiter: Ratelimit | null | undefined

function getLoginIpLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    limiter = null
    return null
  }
  const redis = new Redis({ url, token })
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rfy:login:ip',
  })
  return limiter
}

/** Max 5 failed credential posts per IP per 15 minutes (middleware). */
export async function limitAdminLoginByIp(ip: string): Promise<{ success: boolean }> {
  const l = getLoginIpLimiter()
  if (!l) return { success: true }
  return l.limit(ip)
}
