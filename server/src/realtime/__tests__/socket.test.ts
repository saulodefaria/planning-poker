import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { registerSocketHandlers } from "../socket-handler.js";
import { RoomService } from "../../application/room-service.js";
import type { RoomRepository } from "../../infrastructure/room-repository.js";
import type { Room } from "../../domain/types.js";
import type { Config } from "../../config/env.js";

function createInMemoryRepo(): RoomRepository {
  const store = new Map<string, Room>();
  return {
    async create(room) {
      store.set(room.id, structuredClone(room));
    },
    async get(roomId) {
      const r = store.get(roomId);
      return r ? structuredClone(r) : null;
    },
    async save(room) {
      store.set(room.id, structuredClone(room));
    },
    async delete(roomId) {
      store.delete(roomId);
    },
  };
}

const config: Config = {
  nodeEnv: "test",
  port: 0,
  redisUrl: "",
  roomTtlSeconds: 86400,
  maxParticipantsPerRoom: 30,
  maxNameLength: 30,
};

const ROOM_NAME = "Sprint Planning";

describe("Socket.IO handlers", () => {
  let io: SocketIOServer;
  let httpServer: ReturnType<typeof createServer>;
  let service: RoomService;
  let port: number;
  const clients: ClientSocket[] = [];

  function createClient(): ClientSocket {
    const client = ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
    clients.push(client);
    return client;
  }

  function waitForConnect(client: ClientSocket): Promise<void> {
    return new Promise((resolve) => client.on("connect", resolve));
  }

  beforeAll(async () => {
    const repo = createInMemoryRepo();
    service = new RoomService(repo, config);
    httpServer = createServer();
    io = new SocketIOServer(httpServer);
    registerSocketHandlers(io, service);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(() => {
    clients.forEach((c) => c.disconnect());
    io.close();
    httpServer.close();
  });

  it("two users join and see each other", async () => {
    const { roomId } = await service.create(ROOM_NAME);

    const client1 = createClient();
    const client2 = createClient();
    await Promise.all([waitForConnect(client1), waitForConnect(client2)]);

    // Client 1 joins
    const ack1 = await new Promise<any>((resolve) => {
      client1.emit("room:join", { roomId, name: "Alice" }, resolve);
    });
    expect(ack1.ok).toBe(true);
    expect(ack1.canonicalName).toBe("Alice");

    // Client 2 joins and should see both participants via room:state
    const statePromise = new Promise<any>((resolve) => {
      client1.on("room:state", (state) => {
        if (state.participants.length === 2) resolve(state);
      });
    });

    const ack2 = await new Promise<any>((resolve) => {
      client2.emit("room:join", { roomId, name: "Bob" }, resolve);
    });
    expect(ack2.ok).toBe(true);

    const state = await statePromise;
    expect(state.participants).toHaveLength(2);
  });

  it("vote broadcasts updated state", async () => {
    const { roomId } = await service.create(ROOM_NAME);

    const client1 = createClient();
    const client2 = createClient();
    await Promise.all([waitForConnect(client1), waitForConnect(client2)]);

    const ack1 = await new Promise<any>((resolve) => {
      client1.emit("room:join", { roomId, name: "Alice" }, resolve);
    });

    await new Promise<any>((resolve) => {
      client2.emit("room:join", { roomId, name: "Bob" }, resolve);
    });

    // Client2 should receive state when client1 votes
    const statePromise = new Promise<any>((resolve) => {
      client2.on("room:state", (state) => {
        const alice = state.participants.find((p: any) => p.name === "Alice");
        if (alice?.hasVoted) resolve(state);
      });
    });

    client1.emit("vote:set", {
      roomId,
      participantId: ack1.participantId,
      vote: "5",
    });

    const state = await statePromise;
    const alice = state.participants.find((p: any) => p.name === "Alice");
    expect(alice.hasVoted).toBe(true);
    expect(alice.vote).toBeNull(); // hidden during voting
  });

  it("reveal broadcasts revealed state", async () => {
    const { roomId } = await service.create(ROOM_NAME);
    await service.addTicket(roomId, "https://example.atlassian.net/browse/PROJ-123");

    const client1 = createClient();
    await waitForConnect(client1);

    const ack = await new Promise<any>((resolve) => {
      client1.emit("room:join", { roomId, name: "Alice" }, resolve);
    });

    client1.emit("vote:set", {
      roomId,
      participantId: ack.participantId,
      vote: "5",
    });

    // Wait for vote state first
    await new Promise<void>((resolve) => {
      client1.on("room:state", (state) => {
        if (state.status === "voting" && state.participants[0]?.hasVoted) resolve();
      });
    });

    client1.removeAllListeners("room:state");

    const revealPromise = new Promise<any>((resolve) => {
      client1.on("room:state", (state) => {
        if (state.status === "revealed") resolve(state);
      });
    });

    client1.emit("room:reveal", { roomId });

    const revealed = await revealPromise;
    expect(revealed.status).toBe("revealed");
    expect(revealed.participants[0].vote).toBe("5");
    expect(revealed.stats).toBeTruthy();
  });

  it("revealed vote changes are broadcast with updated history", async () => {
    const { roomId } = await service.create(ROOM_NAME);
    await service.addTicket(roomId, "https://example.atlassian.net/browse/PROJ-123");

    const client1 = createClient();
    const client2 = createClient();
    await Promise.all([waitForConnect(client1), waitForConnect(client2)]);

    const alice = await new Promise<any>((resolve) => {
      client1.emit("room:join", { roomId, name: "Alice" }, resolve);
    });
    const bob = await new Promise<any>((resolve) => {
      client2.emit("room:join", { roomId, name: "Bob" }, resolve);
    });

    client1.emit("vote:set", {
      roomId,
      participantId: alice.participantId,
      vote: "5",
    });
    client2.emit("vote:set", {
      roomId,
      participantId: bob.participantId,
      vote: "8",
    });

    await new Promise<void>((resolve) => {
      client1.on("room:state", (state) => {
        const everyoneVoted = state.participants.every((participant: any) => participant.hasVoted);
        if (state.status === "voting" && everyoneVoted) resolve();
      });
    });
    client1.removeAllListeners("room:state");
    client2.removeAllListeners("room:state");

    const revealPromise = new Promise<void>((resolve) => {
      client1.on("room:state", (state) => {
        if (state.status === "revealed") resolve();
      });
    });
    client1.emit("room:reveal", { roomId });
    await revealPromise;
    client1.removeAllListeners("room:state");

    const updatedStatePromise = new Promise<any>((resolve) => {
      client2.on("room:state", (state) => {
        const aliceState = state.participants.find((participant: any) => participant.id === alice.participantId);
        const aliceHistory = state.voteHistory[0]?.votes.find((vote: any) => vote.participantName === "Alice");

        if (state.status === "revealed" && aliceState?.vote === "13" && aliceHistory?.vote === "13") {
          resolve(state);
        }
      });
    });

    client1.emit("vote:set", {
      roomId,
      participantId: alice.participantId,
      vote: "13",
    });

    const updated = await updatedStatePromise;
    expect(updated.stats?.average).toBe(10.5);
    expect(updated.voteHistory).toEqual([
      expect.objectContaining({
        ticketKey: "PROJ-123",
        round: 1,
        votes: [
          { participantName: "Alice", vote: "13" },
          { participantName: "Bob", vote: "8" },
        ],
      }),
    ]);
  });

  it("restart broadcasts reset state", async () => {
    const { roomId } = await service.create(ROOM_NAME);

    const client1 = createClient();
    await waitForConnect(client1);

    const ack = await new Promise<any>((resolve) => {
      client1.emit("room:join", { roomId, name: "Alice" }, resolve);
    });

    client1.emit("vote:set", {
      roomId,
      participantId: ack.participantId,
      vote: "5",
    });

    // Wait for vote
    await new Promise<void>((resolve) => {
      client1.on("room:state", (state) => {
        if (state.participants[0]?.hasVoted) resolve();
      });
    });
    client1.removeAllListeners("room:state");

    // Reveal
    const revealPromise = new Promise<void>((resolve) => {
      client1.on("room:state", (state) => {
        if (state.status === "revealed") resolve();
      });
    });
    client1.emit("room:reveal", { roomId });
    await revealPromise;
    client1.removeAllListeners("room:state");

    // Restart
    const restartPromise = new Promise<any>((resolve) => {
      client1.on("room:state", (state) => {
        if (state.round === 2) resolve(state);
      });
    });
    client1.emit("room:restart", { roomId });

    const restarted = await restartPromise;
    expect(restarted.status).toBe("voting");
    expect(restarted.round).toBe(2);
    expect(restarted.participants[0].hasVoted).toBe(false);
  });

  it("paper ball throw is broadcast to everyone in the room", async () => {
    const { roomId } = await service.create(ROOM_NAME);

    const client1 = createClient();
    const client2 = createClient();
    await Promise.all([waitForConnect(client1), waitForConnect(client2)]);

    const alice = await new Promise<any>((resolve) => {
      client1.emit("room:join", { roomId, name: "Alice" }, resolve);
    });

    const bob = await new Promise<any>((resolve) => {
      client2.emit("room:join", { roomId, name: "Bob" }, resolve);
    });

    const throwPromise = new Promise<any>((resolve) => {
      client2.on("room:paper-ball-thrown", (event) => {
        resolve(event);
      });
    });

    client1.emit("room:throw-paper-ball", {
      roomId,
      fromParticipantId: alice.participantId,
      toParticipantId: bob.participantId,
    });

    const event = await throwPromise;
    expect(event.roomId).toBe(roomId);
    expect(event.fromParticipantId).toBe(alice.participantId);
    expect(event.toParticipantId).toBe(bob.participantId);
    expect(["left", "right"]).toContain(event.side);
    expect(typeof event.id).toBe("string");
  });
});
