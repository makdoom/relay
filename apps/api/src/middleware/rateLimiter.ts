import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { config } from '../config/index.js';
import { TooManyRequestsError } from '../error/index.js';

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetTimeMs: number;
}

export interface InMemoryRateLimiterOptions {
  windowMs: number;
  max: number;
}

/**
 * High-performance, zero-dependency sliding window in-memory rate limiter.
 * Operates across Express HTTP requests and Socket.IO real-time events.
 */
export class InMemoryRateLimiter {
  private records = new Map<string, number[]>();
  public readonly windowMs: number;
  public readonly max: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: InMemoryRateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.max = options.max;

    // Periodically sweep expired entries to prevent memory leaks
    this.cleanupTimer = setInterval(
      () => {
        this.cleanup();
      },
      Math.max(30000, this.windowMs)
    );

    // Ensure timer does not prevent process termination
    this.cleanupTimer.unref();
  }

  /**
   * Check whether an action for the given key is permitted within the sliding window.
   */
  public check(key: string): RateLimitCheckResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const existing = this.records.get(key);
    const validTimestamps = existing ? existing.filter((t) => t > windowStart) : [];

    if (validTimestamps.length >= this.max) {
      const oldest = validTimestamps[0];
      const resetTimeMs = oldest + this.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

      this.records.set(key, validTimestamps);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
        resetTimeMs,
      };
    }

    validTimestamps.push(now);
    this.records.set(key, validTimestamps);

    const resetTimeMs = validTimestamps[0] + this.windowMs;
    return {
      allowed: true,
      remaining: Math.max(0, this.max - validTimestamps.length),
      retryAfterSeconds: 0,
      resetTimeMs,
    };
  }

  /**
   * Remove records where all timestamps have aged out of the current window.
   */
  public cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.records.entries()) {
      const valid = timestamps.filter((t) => t > windowStart);
      if (valid.length === 0) {
        this.records.delete(key);
      } else {
        this.records.set(key, valid);
      }
    }
  }

  /**
   * Clear all records and stop cleanup interval (useful for test tear-downs).
   */
  public reset(): void {
    this.records.clear();
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.records.clear();
  }
}

export interface RateLimiterMiddlewareOptions {
  limiter: InMemoryRateLimiter;
  keyGenerator?: (req: Request) => string;
  message?: string;
  code?: string;
  skip?: (req: Request) => boolean;
}

/**
 * Derives a reliable client IP address, respecting X-Forwarded-For when configured.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Factory creating Express middleware that enforces rate limiting and sets standard RFC rate limit headers.
 */
export function createRateLimiterMiddleware(options: RateLimiterMiddlewareOptions): RequestHandler {
  const {
    limiter,
    keyGenerator = (req) => getClientIp(req),
    message = 'Too many requests, please try again later',
    skip,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if globally disabled or skipped for this request
    if (!config.rateLimit.enabled || skip?.(req)) {
      next();
      return;
    }

    const key = keyGenerator(req);
    const result = limiter.check(key);

    // Standard RFC Rate Limit headers
    res.setHeader('X-RateLimit-Limit', String(limiter.max));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetTimeMs / 1000)));

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSeconds));
      throw new TooManyRequestsError(message, 'RATE_LIMIT_EXCEEDED', result.retryAfterSeconds);
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// Pre-configured rate limiter singletons for Echo platform
// ---------------------------------------------------------------------------

/**
 * Protects authentication endpoints (/auth/login, /auth/register, /auth/refresh)
 * against brute-force password guessing and credential stuffing.
 */
export const authRateLimiter = new InMemoryRateLimiter({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
});

export const authRateLimitMiddleware: RequestHandler = createRateLimiterMiddleware({
  limiter: authRateLimiter,
  message: 'Too many authentication attempts. Please try again later.',
  code: 'AUTH_RATE_LIMIT_EXCEEDED',
});

/**
 * Protects general API routes against denial-of-service and aggressive scraping.
 */
export const apiRateLimiter = new InMemoryRateLimiter({
  windowMs: config.rateLimit.apiWindowMs,
  max: config.rateLimit.apiMax,
});

export const apiRateLimitMiddleware: RequestHandler = createRateLimiterMiddleware({
  limiter: apiRateLimiter,
  keyGenerator: (req) => {
    // Prefer authenticated user ID, fall back to IP
    return req.user?.id ? `user:${req.user.id}` : `ip:${getClientIp(req)}`;
  },
  message: 'API rate limit exceeded. Please slow down your requests.',
  code: 'API_RATE_LIMIT_EXCEEDED',
});

/**
 * Protects message creation endpoints (HTTP POST /conversations/:id/messages)
 * against rapid message spamming.
 */
export const messageRateLimiter = new InMemoryRateLimiter({
  windowMs: config.rateLimit.messageWindowMs,
  max: config.rateLimit.messageMax,
});

export const messageRateLimitMiddleware: RequestHandler = createRateLimiterMiddleware({
  limiter: messageRateLimiter,
  keyGenerator: (req) => {
    return req.user?.id ? `msg:user:${req.user.id}` : `msg:ip:${getClientIp(req)}`;
  },
  message: 'Message rate limit exceeded. Please slow down.',
  code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
});

/**
 * In-memory rate limiter for Socket.IO real-time 'message:send' events.
 */
export const socketMessageRateLimiter = new InMemoryRateLimiter({
  windowMs: config.rateLimit.messageWindowMs,
  max: config.rateLimit.messageMax,
});
