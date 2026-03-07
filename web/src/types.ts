export const VOTE_DECK = ['?', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89'] as const;
export type VoteValue = (typeof VOTE_DECK)[number];

export type RoomStatus = 'voting' | 'revealed';

export interface Participant {
  id: string;
  name: string;
  vote: VoteValue | null;
  hasVoted: boolean;
}

export interface RoomStats {
  average: number | null;
  nearestFibonacci: number | null;
  groupedVotes: { vote: string; count: number }[];
}

export interface RoomState {
  id: string;
  status: RoomStatus;
  round: number;
  participants: Participant[];
  stats: RoomStats | null;
}

export interface RoomError {
  code: string;
  message: string;
}

export interface LocalIdentity {
  participantId: string;
  name: string;
}
