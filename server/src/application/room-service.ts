import { v4 as uuidv4 } from "uuid";
import type { RoomRepository } from "../infrastructure/room-repository.js";
import type { Config } from "../config/env.js";
import type { Room, SerializedRoom, VoteValue } from "../domain/types.js";
import {
  createRoom,
  createParticipant,
  deduplicateName,
  validateName,
  validateVote,
  setVote,
  clearVote,
  revealVotes,
  restartRoom,
  serializeRoom,
  parseJiraUrl,
  addTicket,
  removeTicket,
  setCurrentTicket,
  ensureCurrentTicketIfAny,
} from "../domain/room.js";
import { AppError } from "../domain/errors.js";

export interface JoinResult {
  participantId: string;
  canonicalName: string;
  room: SerializedRoom;
}

export class RoomService {
  constructor(
    private readonly repo: RoomRepository,
    private readonly config: Config,
  ) {}

  async create(name: string): Promise<{ roomId: string; roomName: string }> {
    const roomId = uuidv4();
    const validatedName = validateName(name, this.config.maxNameLength);
    const room = createRoom(roomId, validatedName);
    await this.repo.create(room, this.config.roomTtlSeconds);
    console.log(`[Room] Created: ${roomId} (${validatedName})`);
    return { roomId, roomName: validatedName };
  }

  async get(roomId: string): Promise<SerializedRoom> {
    const room = await this.getRoom(roomId);
    if (ensureCurrentTicketIfAny(room)) {
      await this.repo.save(room, this.config.roomTtlSeconds);
    }
    return serializeRoom(room);
  }

  async join(roomId: string, name: string, participantId?: string): Promise<JoinResult> {
    const room = await this.getRoom(roomId);
    const validatedName = validateName(name, this.config.maxNameLength);

    if (ensureCurrentTicketIfAny(room)) {
      await this.repo.save(room, this.config.roomTtlSeconds);
    }

    // Reconnect existing participant
    if (participantId) {
      const existing = room.participants.find((p) => p.id === participantId);
      if (existing) {
        existing.updatedAt = new Date().toISOString();
        room.updatedAt = new Date().toISOString();
        await this.repo.save(room, this.config.roomTtlSeconds);
        console.log(`[Room] Reconnected: ${existing.name} in ${roomId}`);
        return {
          participantId: existing.id,
          canonicalName: existing.name,
          room: serializeRoom(room),
        };
      }
    }

    // Check capacity
    if (room.participants.length >= this.config.maxParticipantsPerRoom) {
      throw new AppError("ROOM_FULL", "Room is full");
    }

    // Deduplicate name
    const existingNames = room.participants.map((p) => p.name);
    const canonicalName = deduplicateName(validatedName, existingNames);

    const newId = participantId ?? uuidv4();
    const participant = createParticipant(newId, canonicalName);
    room.participants.push(participant);
    room.updatedAt = new Date().toISOString();

    await this.repo.save(room, this.config.roomTtlSeconds);
    console.log(`[Room] Joined: ${canonicalName} in ${roomId}`);

    return {
      participantId: newId,
      canonicalName,
      room: serializeRoom(room),
    };
  }

  async vote(roomId: string, participantId: string, vote: string | null): Promise<SerializedRoom> {
    const room = await this.getRoom(roomId);

    if (vote === null) {
      clearVote(room, participantId);
      await this.repo.save(room, this.config.roomTtlSeconds);
      console.log(`[Room] Vote cleared by ${participantId} in ${roomId}`);
      return serializeRoom(room);
    }

    const validVote = validateVote(vote);
    setVote(room, participantId, validVote);
    await this.repo.save(room, this.config.roomTtlSeconds);
    console.log(`[Room] Vote set by ${participantId} in ${roomId}`);
    return serializeRoom(room);
  }

  async reveal(roomId: string): Promise<SerializedRoom> {
    const room = await this.getRoom(roomId);
    revealVotes(room);
    await this.repo.save(room, this.config.roomTtlSeconds);
    console.log(`[Room] Revealed: ${roomId}`);
    return serializeRoom(room);
  }

  async restart(roomId: string): Promise<SerializedRoom> {
    const room = await this.getRoom(roomId);
    restartRoom(room);
    await this.repo.save(room, this.config.roomTtlSeconds);
    console.log(`[Room] Restarted: ${roomId} (round ${room.round})`);
    return serializeRoom(room);
  }

  async addTicket(roomId: string, url: string): Promise<SerializedRoom> {
    const room = await this.getRoom(roomId);
    const parsed = parseJiraUrl(url);
    if (!parsed) {
      throw new AppError("INVALID_TICKET_URL", "Could not parse a Jira issue key from that URL");
    }
    addTicket(room, parsed.key, parsed.url);
    ensureCurrentTicketIfAny(room);
    await this.repo.save(room, this.config.roomTtlSeconds);
    console.log(`[Room] Ticket added: ${parsed.key} in ${roomId}`);
    return serializeRoom(room);
  }

  async removeTicket(roomId: string, key: string): Promise<SerializedRoom> {
    const room = await this.getRoom(roomId);
    removeTicket(room, key);
    await this.repo.save(room, this.config.roomTtlSeconds);
    console.log(`[Room] Ticket removed: ${key} in ${roomId}`);
    return serializeRoom(room);
  }

  async setCurrentTicket(roomId: string, key: string | null): Promise<SerializedRoom> {
    const room = await this.getRoom(roomId);
    setCurrentTicket(room, key);
    await this.repo.save(room, this.config.roomTtlSeconds);
    console.log(`[Room] Current ticket set: ${key ?? "none"} in ${roomId}`);
    return serializeRoom(room);
  }

  private async getRoom(roomId: string): Promise<Room> {
    const room = await this.repo.get(roomId);
    if (!room) {
      throw new AppError("ROOM_NOT_FOUND", "Room not found");
    }
    return room;
  }
}
