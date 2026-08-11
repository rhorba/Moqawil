/**
 * In-process sliding-window rate limiter — Sprint 11 (SaaS readiness).
 *
 * No external dependency (Redis/Upstash) on purpose: the deployment topology is committed to
 * a single VPS / no horizontal scaling (docs/system-design-moqawil.md §5), so in-process state
 * is consistent with that rather than a shortcut. If Moqawil ever moves to multiple app
 * instances, this needs to move to a shared store — revisit then, not before.
 *
 * Basic abuse deterrent for public auth endpoints, not a CAPTCHA/WAF replacement — see
 * docs/security-moqawil.md §8.
 */

interface Bucket {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

// Sampled cleanup — avoids the map growing unboundedly from many distinct/rotating IPs
// without needing a background timer. 1-in-50 calls sweeps expired buckets.
function maybeCleanup(now: number, windowMs: number) {
  if (Math.random() > 0.02) return
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > windowMs) buckets.delete(key)
  }
}

/**
 * Returns true if `key` (typically an IP address) is still within its allowance for this
 * window, false if it has exceeded `limit` requests within `windowMs` and should be rejected.
 * Every call that isn't rejected counts toward the window, including the one that returns true.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): boolean {
  const now = Date.now()
  maybeCleanup(now, windowMs)

  const bucket = buckets.get(key)
  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now })
    return true
  }

  if (bucket.count >= limit) return false

  bucket.count += 1
  return true
}

/** Test-only escape hatch — vitest needs a clean slate between rate-limit test cases. */
export function _resetRateLimitForTests() {
  buckets.clear()
}
