import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Tiers — adjust requests/window per business need
// ---------------------------------------------------------------------------
const TIERS = {
  payments:       { requests: 5,  window: '1 m' },  // 5 payment creates per user per min
  paymentMethods: { requests: 10, window: '1 m' },  // 10 card ops per user per min
  communications: { requests: 5,  window: '1 m' },  // 5 OTP/SMS sends per IP per min
  invites:        { requests: 10, window: '1 m' },  // 10 invite creates per user per min
  invitesPublic:  { requests: 20, window: '1 m' },  // 20 verify lookups per IP per min (unauthenticated)
} as const

type Tier = keyof typeof TIERS
type Window = `${number} ${'s' | 'm' | 'h' | 'd'}`

// ---------------------------------------------------------------------------
// Lazy Redis + Ratelimit singleton (per warm Lambda instance)
// ---------------------------------------------------------------------------
let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!_redis) {
    _redis = Redis.fromEnv()
  }
  return _redis
}

const _limiters = new Map<Tier, Ratelimit>()

function getLimiter(tier: Tier): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null

  if (!_limiters.has(tier)) {
    const { requests, window } = TIERS[tier]
    _limiters.set(tier, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window as Window),
      analytics: false,
    }))
  }
  return _limiters.get(tier)!
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  )
}

/**
 * Check rate limit for a given tier and identifier.
 *
 * @param request   Incoming Next.js request
 * @param tier      One of the configured tiers
 * @param identifier  User ID (for authenticated routes) or IP (for public routes).
 *                    Falls back to client IP if omitted.
 *
 * @returns  A 429 NextResponse if the limit is exceeded, or null if within limit.
 *           Returns null (fail-open) if Upstash is not configured — logs a warning in production.
 */
export async function checkRateLimit(
  request: NextRequest,
  tier: Tier,
  identifier?: string,
): Promise<NextResponse | null> {
  const limiter = getLimiter(tier)

  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Rate limiter not configured: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN', { tier })
    }
    return null
  }

  const id = identifier ?? getClientIP(request)
  const { success, limit, remaining, reset } = await limiter.limit(id)

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    logger.warn('Rate limit exceeded', { tier, remaining, retryAfter })
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(reset),
        },
      },
    )
  }

  return null
}
