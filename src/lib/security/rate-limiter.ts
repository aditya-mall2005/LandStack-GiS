/**
 * LandStack — API Gateway Rate Limiter (Step 16.13)
 * Sliding-window rate limiter preventing mass database scraping
 */

import { UserRole } from "./types";

interface RateLimitConfig {
  maxRequestsPerMinute: number;
}

const TIER_LIMITS: Record<UserRole | "ANONYMOUS", RateLimitConfig> = {
  ANONYMOUS: { maxRequestsPerMinute: 60 },
  CITIZEN: { maxRequestsPerMinute: 120 },
  REVENUE_OFFICER: { maxRequestsPerMinute: 300 },
  REGISTRATION_OFFICER: { maxRequestsPerMinute: 300 },
  PLANNING_OFFICER: { maxRequestsPerMinute: 300 },
  TAX_OFFICER: { maxRequestsPerMinute: 300 },
  AUDITOR: { maxRequestsPerMinute: 600 },
  ADMIN: { maxRequestsPerMinute: 1200 }
};

// In-memory sliding window request store
const requestStore: Map<string, number[]> = new Map();

export function checkRateLimit(
  identifier: string,
  role: UserRole | "ANONYMOUS" = "ANONYMOUS"
): { allowed: boolean; limit: number; remaining: number; resetSeconds: number } {
  const config = TIER_LIMITS[role] || TIER_LIMITS.ANONYMOUS;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const cutoff = now - windowMs;

  let timestamps = requestStore.get(identifier) || [];
  // Filter out timestamps older than 1 minute
  timestamps = timestamps.filter((t) => t > cutoff);

  if (timestamps.length >= config.maxRequestsPerMinute) {
    const oldest = timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      limit: config.maxRequestsPerMinute,
      remaining: 0,
      resetSeconds
    };
  }

  // Record this request
  timestamps.push(now);
  requestStore.set(identifier, timestamps);

  return {
    allowed: true,
    limit: config.maxRequestsPerMinute,
    remaining: config.maxRequestsPerMinute - timestamps.length,
    resetSeconds: 60
  };
}
