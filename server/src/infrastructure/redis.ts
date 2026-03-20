import Redis from "ioredis";
import type { Config } from "../config/env.js";

let client: Redis | null = null;

export function createRedisClient(config: Config): Redis {
  if (client) return client;

  client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 200, 2000);
    },
  });

  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  client.on("connect", () => {
    console.log("[Redis] Connected");
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!client) throw new Error("Redis client not initialized");
  return client;
}
