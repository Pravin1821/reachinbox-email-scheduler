import { createClient } from "redis";
import { env } from "./env";

export const sessionRedisClient = createClient({ url: env.REDIS_URL });

sessionRedisClient.on("error", (err) => {
  console.error("[session-redis] connection error:", err.message);
});

export async function connectSessionRedis() {
  await sessionRedisClient.connect();
  console.log("[session-redis] connected");
}