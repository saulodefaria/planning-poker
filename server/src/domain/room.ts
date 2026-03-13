import type { Room, Participant, VoteValue, RoomStats, SerializedRoom, SerializedParticipant, JiraTicket, TicketVoteHistory } from "./types.js";
import { VOTE_DECK, NUMERIC_VOTES } from "./types.js";
import { AppError } from "./errors.js";

export function createRoom(id: string, name: string): Room {
  const now = new Date().toISOString();
  return {
    id,
    name,
    status: "voting",
    round: 1,
    createdAt: now,
    updatedAt: now,
    participants: [],
    tickets: [],
    votedTickets: [],
    currentTicketKey: null,
    voteHistory: [],
  };
}

/** If room has tickets but no current ticket, set current to first. Returns true if room was updated. */
export function ensureCurrentTicketIfAny(room: Room): boolean {
  if (room.tickets.length > 0 && room.currentTicketKey === null) {
    room.currentTicketKey = room.tickets[0].key;
    room.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

export function parseJiraUrl(url: string): Pick<JiraTicket, "key" | "url"> | null {
  const trimmed = url.trim();
  const match = trimmed.match(/https?:\/\/[^/]+\/browse\/([A-Z][A-Z0-9]*-\d+)/i);
  if (!match) return null;
  return { key: match[1].toUpperCase(), url: trimmed };
}

export function addTicket(room: Room, key: string, url: string): Room {
  if (room.tickets.some((t) => t.key === key)) {
    throw new AppError("TICKET_EXISTS", `Ticket ${key} is already in this room`);
  }
  room.tickets.push({ key, url, addedAt: new Date().toISOString() });
  room.updatedAt = new Date().toISOString();
  return room;
}

export function removeTicket(room: Room, key: string): Room {
  if (room.status === "revealed" && room.currentTicketKey === key) {
    throw new AppError("INVALID_STATE", "Cannot remove the revealed ticket before starting a new round");
  }

  room.tickets = room.tickets.filter((t) => t.key !== key);
  if (room.currentTicketKey === key) {
    room.currentTicketKey = room.tickets.length > 0 ? room.tickets[0].key : null;
  }
  room.updatedAt = new Date().toISOString();
  return room;
}

export function setCurrentTicket(room: Room, key: string | null): Room {
  if (room.status === "revealed") {
    throw new AppError("INVALID_STATE", "Cannot change the current ticket after reveal");
  }
  if (key !== null && !room.tickets.some((t) => t.key === key)) {
    throw new AppError("TICKET_NOT_FOUND", `Ticket ${key} is not in this room`);
  }
  room.currentTicketKey = key;
  room.updatedAt = new Date().toISOString();
  return room;
}

export function buildRoomPath(roomId: string): string {
  return `/room/${roomId}`;
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
    throw new AppError("INVALID_NAME", "Name cannot be empty");
  }
  if (trimmed.length > maxLength) {
    throw new AppError("INVALID_NAME", `Name cannot exceed ${maxLength} characters`);
  }
  return trimmed;
}

export function validateVote(vote: string): VoteValue {
  if (!VOTE_DECK.includes(vote as VoteValue)) {
    throw new AppError("INVALID_VOTE", `Invalid vote value: ${vote}`);
  }
  return vote as VoteValue;
}

export function setVote(room: Room, participantId: string, vote: VoteValue): Room {
  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new AppError("PARTICIPANT_NOT_FOUND", "Participant not found in room");
  }

  participant.vote = vote;
  participant.hasVoted = true;
  participant.updatedAt = new Date().toISOString();
  room.updatedAt = new Date().toISOString();
  syncCurrentRoundHistory(room);
  return room;
}

export function clearVote(room: Room, participantId: string): Room {
  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new AppError("PARTICIPANT_NOT_FOUND", "Participant not found in room");
  }

  participant.vote = null;
  participant.hasVoted = false;
  participant.updatedAt = new Date().toISOString();
  room.updatedAt = new Date().toISOString();
  syncCurrentRoundHistory(room);
  return room;
}

export function revealVotes(room: Room): Room {
  if (room.status !== "voting") {
    throw new AppError("INVALID_STATE", "Room is already revealed");
  }
  room.status = "revealed";
  room.updatedAt = new Date().toISOString();
  syncCurrentRoundHistory(room);
  return room;
}

export function restartRoom(room: Room): Room {
  if (room.status !== "revealed") {
    throw new AppError("INVALID_STATE", "Can only restart after reveal");
  }

  moveCurrentTicketToVoted(room);
  room.status = "voting";
  room.round += 1;
  for (const p of room.participants) {
    p.vote = null;
    p.hasVoted = false;
    p.updatedAt = new Date().toISOString();
  }
  room.updatedAt = new Date().toISOString();
  return room;
}

function syncCurrentRoundHistory(room: Room): void {
  if (room.status !== "revealed" || room.currentTicketKey === null) {
    return;
  }

  const existing = room.voteHistory.find(
    (entry) => entry.ticketKey === room.currentTicketKey && entry.round === room.round,
  );

  const snapshot: TicketVoteHistory = {
    ticketKey: room.currentTicketKey,
    round: room.round,
    votes: room.participants.map((participant) => ({
      participantName: participant.name,
      vote: participant.vote,
    })),
    stats: calculateStats(room),
    completedAt: existing?.completedAt ?? room.updatedAt,
  };

  room.voteHistory = room.voteHistory.filter(
    (entry) => !(entry.ticketKey === snapshot.ticketKey && entry.round === snapshot.round),
  );
  room.voteHistory.push(snapshot);
}

function moveCurrentTicketToVoted(room: Room): void {
  if (room.currentTicketKey === null) {
    return;
  }

  const currentTicketIndex = room.tickets.findIndex((ticket) => ticket.key === room.currentTicketKey);
  if (currentTicketIndex === -1) {
    room.currentTicketKey = room.tickets.length > 0 ? room.tickets[0].key : null;
    return;
  }

  const [movedTicket] = room.tickets.splice(currentTicketIndex, 1);
  room.votedTickets.push(movedTicket);
  room.currentTicketKey = room.tickets.length > 0 ? room.tickets[0].key : null;
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

  const numericVotes = votes.filter((p) => p.vote !== "?").map((p) => Number(p.vote));

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
  const isVoting = room.status === "voting";

  const participants: SerializedParticipant[] = room.participants.map((p) => ({
    id: p.id,
    name: p.name,
    vote: isVoting ? null : p.vote,
    hasVoted: p.hasVoted,
  }));

  return {
    id: room.id,
    name: room.name,
    status: room.status,
    round: room.round,
    participants,
    stats: isVoting ? null : calculateStats(room),
    tickets: room.tickets,
    votedTickets: room.votedTickets ?? [],
    currentTicketKey: room.currentTicketKey,
    voteHistory: room.voteHistory,
  };
}
