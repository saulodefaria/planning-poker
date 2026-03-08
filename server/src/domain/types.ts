export const VOTE_DECK = ["?", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89"] as const;
export type VoteValue = (typeof VOTE_DECK)[number];

export const NUMERIC_VOTES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89] as const;

export type RoomStatus = "voting" | "revealed";

export interface Participant {
  id: string;
  name: string;
  vote: VoteValue | null;
  hasVoted: boolean;
  joinedAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  round: number;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
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
  round: number;
  participants: SerializedParticipant[];
  stats: RoomStats | null;
}
