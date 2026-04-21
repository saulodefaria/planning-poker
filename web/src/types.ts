export const VOTE_DECK = ["?", "1", "2", "3", "5", "8", "13", "21", "34", "55"] as const;
export type VoteValue = (typeof VOTE_DECK)[number];

export type RoomStatus = "voting" | "revealed";

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

export interface RoomState {
  id: string;
  name: string;
  status: RoomStatus;
  round: number;
  participants: Participant[];
  stats: RoomStats | null;
  tickets: JiraTicket[];
  votedTickets: JiraTicket[];
  currentTicketKey: string | null;
  voteHistory: TicketVoteHistory[];
}

export interface RoomError {
  code: string;
  message: string;
}

export type ThrowSide = "left" | "right";

export interface PaperBallThrowEvent {
  id: string;
  roomId: string;
  fromParticipantId: string;
  toParticipantId: string;
  side: ThrowSide;
  createdAt: string;
}

export interface ParticipantNudgeEvent {
  id: string;
  roomId: string;
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  createdAt: string;
}

export interface LocalIdentity {
  participantId: string;
  name: string;
  vote?: VoteValue | null;
  round?: number;
}
