export const VOTE_DECK = ["?", "1", "2", "3", "5", "8", "13", "21", "34", "55"] as const;
export type VoteValue = (typeof VOTE_DECK)[number];

export const NUMERIC_VOTES = [1, 2, 3, 5, 8, 13, 21, 34, 55] as const;

export type RoomStatus = "voting" | "revealed";

export type RoomTimerStatus = "idle" | "running" | "paused" | "ended";

export interface RoomTimer {
  status: RoomTimerStatus;
  presetSeconds: number;
  remainingSeconds: number;
  endsAtMs: number | null;
}

export interface Participant {
  id: string;
  name: string;
  vote: VoteValue | null;
  hasVoted: boolean;
  joinedAt: string;
  updatedAt: string;
}

export interface JiraTicket {
  key: string;
  url: string;
  addedAt: string;
}

export interface TicketVoteRecord {
  participantName: string;
  vote: VoteValue | null;
}

export interface TicketVoteHistory {
  ticketKey: string;
  round: number;
  votes: TicketVoteRecord[];
  stats: RoomStats | null;
  completedAt: string;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  timer: RoomTimer;
  round: number;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  tickets: JiraTicket[];
  votedTickets: JiraTicket[];
  currentTicketKey: string | null;
  voteHistory: TicketVoteHistory[];
}

export interface RoomStats {
  average: number | null;
  nearestFibonacci: number | null;
  groupedVotes: { vote: string; count: number }[];
}

export interface SerializedParticipant {
  id: string;
  name: string;
  vote: VoteValue | null;
  hasVoted: boolean;
}

export interface SerializedRoom {
  id: string;
  name: string;
  status: RoomStatus;
  timer: RoomTimer;
  serverNowMs: number;
  round: number;
  participants: SerializedParticipant[];
  stats: RoomStats | null;
  tickets: JiraTicket[];
  votedTickets: JiraTicket[];
  currentTicketKey: string | null;
  voteHistory: TicketVoteHistory[];
}
