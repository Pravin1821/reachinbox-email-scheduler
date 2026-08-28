import { redisConnection } from "../config/redis";
export function getHourWindow(date: Date): string {
  return date.toISOString().slice(0, 13); // "2026-08-28T14"
}

export function getNextHourWindowStart(date: Date): Date {
  const next = new Date(date);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
}

export async function checkAndIncrementRateLimit(
  senderId: string,
  maxPerHour: number,
  now: Date = new Date()
): Promise<RateLimitResult> {
  const hourWindow = getHourWindow(now);
  const key = `ratelimit:${senderId}:${hourWindow}`;

  const newCount = await redisConnection.incr(key);

  if (newCount === 1) {
    await redisConnection.expire(key, 3600); // auto-cleanup after 1 hour
  }

  return {
    allowed: newCount <= maxPerHour,
    currentCount: newCount,
    limit: maxPerHour,
  };
}

export async function rollbackRateLimitIncrement(senderId: string, now: Date = new Date()) {
  const hourWindow = getHourWindow(now);
  const key = `ratelimit:${senderId}:${hourWindow}`;
  await redisConnection.decr(key);
}