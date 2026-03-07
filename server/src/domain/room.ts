import type { Room, Participant, VoteValue, RoomStats, SerializedRoom, SerializedParticipant } from './types.js';
import { VOTE_DECK, NUMERIC_VOTES } from './types.js';
import { AppError } from './errors.js';

export function createRoom(id: string): Room {
  const now = new Date().toISOString();
  return {
    id,
    status: 'voting',
    round: 1,
    createdAt: now,
    updatedAt: now,
    participants: [],
  };
}

export function createParticipant(id: string, name: string): Participant {
  const now = new Date().toISOString();
  return {
    id,
    name,
    vote: null,
    hasVoted: false,
    joinedAt: now,
    updatedAt: now,
  };
}

export function deduplicateName(name: string, existingNames: string[], ownName?: string): string {
  const names = new Set(existingNames.filter((n) => n !== ownName));
  if (!names.has(name)) return name;

  let counter = 2;
  while (names.has(`${name} (${counter})`)) {
    counter++;
  }
  return `${name} (${counter})`;
}

export function validateName(name: string, maxLength: number): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new AppError('INVALID_NAME', 'Name cannot be empty');
  }
  if (trimmed.length > maxLength) {
    throw new AppError('INVALID_NAME', `Name cannot exceed ${maxLength} characters`);
  }
  return trimmed;
}

export function validateVote(vote: string): VoteValue {
  if (!VOTE_DECK.includes(vote as VoteValue)) {
    throw new AppError('INVALID_VOTE', `Invalid vote value: ${vote}`);
  }
  return vote as VoteValue;
}

export function setVote(room: Room, participantId: string, vote: VoteValue): Room {
  if (room.status !== 'voting') {
    throw new AppError('INVALID_STATE', 'Cannot vote after reveal');
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new AppError('PARTICIPANT_NOT_FOUND', 'Participant not found in room');
  }

  participant.vote = vote;
  participant.hasVoted = true;
  participant.updatedAt = new Date().toISOString();
  room.updatedAt = new Date().toISOString();
  return room;
}

export function clearVote(room: Room, participantId: string): Room {
  if (room.status !== 'voting') {
    throw new AppError('INVALID_STATE', 'Cannot change vote after reveal');
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new AppError('PARTICIPANT_NOT_FOUND', 'Participant not found in room');
  }

  participant.vote = null;
  participant.hasVoted = false;
  participant.updatedAt = new Date().toISOString();
  room.updatedAt = new Date().toISOString();
  return room;
}

export function revealVotes(room: Room): Room {
  if (room.status !== 'voting') {
    throw new AppError('INVALID_STATE', 'Room is already revealed');
  }
  room.status = 'revealed';
  room.updatedAt = new Date().toISOString();
  return room;
}

export function restartRoom(room: Room): Room {
  if (room.status !== 'revealed') {
    throw new AppError('INVALID_STATE', 'Can only restart after reveal');
  }
  room.status = 'voting';
  room.round += 1;
  for (const p of room.participants) {
    p.vote = null;
    p.hasVoted = false;
    p.updatedAt = new Date().toISOString();
  }
  room.updatedAt = new Date().toISOString();
  return room;
}

export function calculateStats(room: Room): RoomStats {
  const votes = room.participants.filter((p) => p.hasVoted && p.vote !== null);

  const grouped = new Map<string, number>();
  for (const p of votes) {
    const v = p.vote!;
    grouped.set(v, (grouped.get(v) ?? 0) + 1);
  }

  const deckOrder = VOTE_DECK as readonly string[];
  const groupedVotes = Array.from(grouped.entries())
    .sort((a, b) => deckOrder.indexOf(a[0]) - deckOrder.indexOf(b[0]))
    .map(([vote, count]) => ({ vote, count }));

  const numericVotes = votes
    .filter((p) => p.vote !== '?')
    .map((p) => Number(p.vote));

  if (numericVotes.length === 0) {
    return { average: null, nearestFibonacci: null, groupedVotes };
  }

  const sum = numericVotes.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / numericVotes.length) * 10) / 10;

  return {
    average: avg,
    nearestFibonacci: findNearestFibonacci(avg),
    groupedVotes,
  };
}

export function findNearestFibonacci(value: number): number {
  let nearest: number = NUMERIC_VOTES[0];
  let minDiff = Math.abs(value - nearest);

  for (const fib of NUMERIC_VOTES) {
    const diff = Math.abs(value - fib);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = fib;
    }
    // If equally close, keep the lower one (which we already have)
  }

  return nearest;
}

export function serializeRoom(room: Room): SerializedRoom {
  const isVoting = room.status === 'voting';

  const participants: SerializedParticipant[] = room.participants.map((p) => ({
    id: p.id,
    name: p.name,
    vote: isVoting ? null : p.vote,
    hasVoted: p.hasVoted,
  }));

  return {
    id: room.id,
    status: room.status,
    round: room.round,
    participants,
    stats: isVoting ? null : calculateStats(room),
  };
}
