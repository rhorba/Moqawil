// Sprint 11 (SaaS readiness): unit tests for the in-process sliding-window rate limiter used by
// middleware.ts to throttle sign-in-attempt abuse. See docs/security-moqawil.md §8.
import { _resetRateLimitForTests, checkRateLimit } from '@/lib/rate-limit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetRateLimitForTests()
  })

  it('allows requests up to the limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit('ip-a', { limit: 5, windowMs: 60_000 })).toBe(true)
    }
  })

  it('rejects the request that exceeds the limit', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('ip-b', { limit: 5, windowMs: 60_000 })
    }
    expect(checkRateLimit('ip-b', { limit: 5, windowMs: 60_000 })).toBe(false)
  })

  it('tracks each key independently — one IP being throttled does not affect another', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('ip-c', { limit: 5, windowMs: 60_000 })
    }
    expect(checkRateLimit('ip-c', { limit: 5, windowMs: 60_000 })).toBe(false)
    expect(checkRateLimit('ip-d', { limit: 5, windowMs: 60_000 })).toBe(true)
  })

  it('resets the window after it elapses', () => {
    vi.useFakeTimers()
    try {
      for (let i = 0; i < 5; i++) {
        checkRateLimit('ip-e', { limit: 5, windowMs: 60_000 })
      }
      expect(checkRateLimit('ip-e', { limit: 5, windowMs: 60_000 })).toBe(false)

      vi.advanceTimersByTime(60_001)

      expect(checkRateLimit('ip-e', { limit: 5, windowMs: 60_000 })).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
