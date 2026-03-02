/**
 * Simple in-memory rate limiter.
 * Used for sensitive endpoints like /validate and /uzum-token.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if a given key has exceeded the rate limit.
 * @param key - Typically `${userId}:${endpoint}`
 * @param limit - Max requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns `true` if rate limit exceeded, `false` if OK
 */
export function isRateLimited(key: string, limit = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (record.count >= limit) {
        return true;
    }

    record.count += 1;
    return false;
}
