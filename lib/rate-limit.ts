const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 20;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Простой in-memory rate limit по IP.
 * Для продакшена с несколькими инстансами заменить на Redis/Upstash.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(ip, fresh);
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: fresh.resetAt };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - bucket.count,
    resetAt: bucket.resetAt,
  };
}
