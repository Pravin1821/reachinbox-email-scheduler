import { Redis } from "ioredis";
import { env } from "./env";

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on("connect", () => {
  console.log("[redis] connected");
});

redisConnection.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});