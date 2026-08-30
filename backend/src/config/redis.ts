import { Redis } from "ioredis";
import { env } from "./env";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 500, 5000); 
  },
  enableReadyCheck: true,
  reconnectOnError(err) {
    const targetErrors = ["READONLY", "ECONNRESET"];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

redisConnection.on("connect", () => {
  console.log("[redis] connected");
});

redisConnection.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});