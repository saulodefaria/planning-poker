export interface Config {
  nodeEnv: string;
  port: number;
  redisUrl: string;
  roomTtlSeconds: number;
  maxParticipantsPerRoom: number;
  maxNameLength: number;
}

export function loadConfig(): Config {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parseInt(process.env.PORT ?? "3000", 10),
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    roomTtlSeconds: parseInt(process.env.ROOM_TTL_SECONDS ?? "86400", 10),
    maxParticipantsPerRoom: parseInt(process.env.MAX_PARTICIPANTS_PER_ROOM ?? "30", 10),
    maxNameLength: 30,
  };
}
