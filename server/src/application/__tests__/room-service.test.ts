import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from '../room-service.js';
import type { RoomRepository } from '../../infrastructure/room-repository.js';
import type { Room } from '../../domain/types.js';
import type { Config } from '../../config/env.js';

function createInMemoryRepo(): RoomRepository & { store: Map<string, Room> } {
  const store = new Map<string, Room>();
  return {
    store,
    async create(room, _ttl) {
      store.set(room.id, structuredClone(room));
    },
    async get(roomId) {
      const room = store.get(roomId);
      return room ? structuredClone(room) : null;
    },
    async save(room, _ttl) {
      store.set(room.id, structuredClone(room));
    },
    async delete(roomId) {
      store.delete(roomId);
    },
  };
}

const testConfig: Config = {
  nodeEnv: 'test',
  port: 3000,
  redisUrl: 'redis://localhost:6379',
  roomTtlSeconds: 86400,
  maxParticipantsPerRoom: 30,
  maxNameLength: 30,
};

describe('RoomService', () => {
  let repo: ReturnType<typeof createInMemoryRepo>;
  let service: RoomService;

  beforeEach(() => {
    repo = createInMemoryRepo();
    service = new RoomService(repo, testConfig);
  });

  it('creates a room', async () => {
    const { roomId } = await service.create();
    expect(roomId).toBeTruthy();
    expect(repo.store.has(roomId)).toBe(true);
  });

  it('gets a room', async () => {
    const { roomId } = await service.create();
    const room = await service.get(roomId);
    expect(room.id).toBe(roomId);
    expect(room.status).toBe('voting');
    expect(room.round).toBe(1);
  });

  it('throws when getting non-existent room', async () => {
    await expect(service.get('nonexistent')).rejects.toThrow('Room not found');
  });

  it('joins a room', async () => {
    const { roomId } = await service.create();
    const result = await service.join(roomId, 'Alice');

    expect(result.participantId).toBeTruthy();
    expect(result.canonicalName).toBe('Alice');
    expect(result.room.participants).toHaveLength(1);
  });

  it('deduplicates names', async () => {
    const { roomId } = await service.create();
    await service.join(roomId, 'Alice');
    const result = await service.join(roomId, 'Alice');

    expect(result.canonicalName).toBe('Alice (2)');
  });

  it('reconnects existing participant', async () => {
    const { roomId } = await service.create();
    const join1 = await service.join(roomId, 'Alice');
    const join2 = await service.join(roomId, 'Alice', join1.participantId);

    expect(join2.participantId).toBe(join1.participantId);
    expect(join2.canonicalName).toBe('Alice');
    expect(join2.room.participants).toHaveLength(1);
  });

  it('rejects empty names', async () => {
    const { roomId } = await service.create();
    await expect(service.join(roomId, '   ')).rejects.toThrow('Name cannot be empty');
  });

  it('votes and changes vote', async () => {
    const { roomId } = await service.create();
    const { participantId } = await service.join(roomId, 'Alice');

    let room = await service.vote(roomId, participantId, '5');
    expect(room.participants[0].hasVoted).toBe(true);
    expect(room.participants[0].vote).toBeNull(); // hidden during voting

    room = await service.vote(roomId, participantId, '8');
    expect(room.participants[0].hasVoted).toBe(true);
  });

  it('clears vote by passing null', async () => {
    const { roomId } = await service.create();
    const { participantId } = await service.join(roomId, 'Alice');

    await service.vote(roomId, participantId, '5');
    const room = await service.vote(roomId, participantId, null);

    expect(room.participants[0].hasVoted).toBe(false);
    expect(room.participants[0].vote).toBeNull();
  });

  it('reveals votes', async () => {
    const { roomId } = await service.create();
    const { participantId } = await service.join(roomId, 'Alice');
    await service.vote(roomId, participantId, '5');

    const room = await service.reveal(roomId);
    expect(room.status).toBe('revealed');
    expect(room.participants[0].vote).toBe('5');
    expect(room.stats).not.toBeNull();
  });

  it('restarts round', async () => {
    const { roomId } = await service.create();
    const { participantId } = await service.join(roomId, 'Alice');
    await service.vote(roomId, participantId, '5');
    await service.reveal(roomId);

    const room = await service.restart(roomId);
    expect(room.status).toBe('voting');
    expect(room.round).toBe(2);
    expect(room.participants[0].hasVoted).toBe(false);
    expect(room.participants[0].vote).toBeNull();
  });

  it('enforces max participants', async () => {
    const config = { ...testConfig, maxParticipantsPerRoom: 2 };
    const svc = new RoomService(repo, config);

    const { roomId } = await svc.create();
    await svc.join(roomId, 'Alice');
    await svc.join(roomId, 'Bob');

    await expect(svc.join(roomId, 'Charlie')).rejects.toThrow('Room is full');
  });

  it('full flow: join, vote, reveal, restart', async () => {
    const { roomId } = await service.create();

    const alice = await service.join(roomId, 'Alice');
    const bob = await service.join(roomId, 'Bob');

    await service.vote(roomId, alice.participantId, '5');
    await service.vote(roomId, bob.participantId, '8');

    const revealed = await service.reveal(roomId);
    expect(revealed.status).toBe('revealed');
    expect(revealed.stats?.average).toBe(6.5);
    expect(revealed.stats?.nearestFibonacci).toBe(5);

    const restarted = await service.restart(roomId);
    expect(restarted.status).toBe('voting');
    expect(restarted.round).toBe(2);
  });
});
