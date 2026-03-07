import type Redis from 'ioredis';
import type { Room } from '../domain/types.js';

export interface RoomRepository {
  create(room: Room, ttlSeconds: number): Promise<void>;
  get(roomId: string): Promise<Room | null>;
  save(room: Room, ttlSeconds: number): Promise<void>;
  delete(roomId: string): Promise<void>;
}

function roomKey(roomId: string): string {
  return `room:${roomId}`;
}

export function createRoomRepository(redis: Redis): RoomRepository {
  return {
    async create(room, ttlSeconds) {
      const key = roomKey(room.id);
      await redis.set(key, JSON.stringify(room), 'EX', ttlSeconds);
    },

    async get(roomId) {
      const data = await redis.get(roomKey(roomId));
      if (!data) return null;
      return JSON.parse(data) as Room;
    },

    async save(room, ttlSeconds) {
      const key = roomKey(room.id);
      await redis.set(key, JSON.stringify(room), 'EX', ttlSeconds);
    },

    async delete(roomId) {
      await redis.del(roomKey(roomId));
    },
  };
}
