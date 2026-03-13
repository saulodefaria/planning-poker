import { describe, expect, it } from "vitest";
import {
  getDocumentTitle,
  getInitialJoinStatus,
  getRestoredVote,
  getRoomPageStage,
  getRoomSubtitle,
} from "../room-page-state";
import type { LocalIdentity, RoomState } from "../../types";

const room: RoomState = {
  id: "room-123",
  name: "Sprint Planning",
  status: "voting",
  round: 3,
  participants: [
    {
      id: "participant-1",
      name: "Alice",
      vote: null,
      hasVoted: true,
    },
  ],
  stats: null,
  tickets: [],
  votedTickets: [],
  currentTicketKey: "PROJ-123",
  voteHistory: [],
};

describe("room page state helpers", () => {
  it("starts in restoring when the room has a saved identity", () => {
    const identity: LocalIdentity = {
      participantId: "participant-1",
      name: "Alice",
    };

    expect(getInitialJoinStatus(identity)).toBe("restoring");
    expect(getInitialJoinStatus(null)).toBe("awaiting-name");
  });

  it("keeps the page in a restoring state while auto-join is in flight", () => {
    expect(
      getRoomPageStage({
        activeRoom: room,
        connected: true,
        error: null,
        joinStatus: "restoring",
        roomState: null,
      }),
    ).toBe("restoring");
  });

  it("shows the join form only when there is no pending restore", () => {
    expect(
      getRoomPageStage({
        activeRoom: room,
        connected: true,
        error: null,
        joinStatus: "awaiting-name",
        roomState: null,
      }),
    ).toBe("join-form");
  });

  it("restores the saved vote only for the active voting round", () => {
    const identity: LocalIdentity = {
      participantId: "participant-1",
      name: "Alice",
      vote: "5",
      round: 3,
    };

    expect(getRestoredVote(identity, room)).toBe("5");
    expect(getRestoredVote({ ...identity, round: 2 }, room)).toBeNull();
    expect(getRestoredVote(identity, { ...room, status: "revealed" })).toBeNull();
  });

  it("marks the room as unavailable before the connecting state", () => {
    expect(
      getRoomPageStage({
        activeRoom: null,
        connected: false,
        error: {
          code: "ROOM_NOT_FOUND",
          message: "Room not found",
        },
        joinStatus: "awaiting-name",
        roomState: null,
      }),
    ).toBe("room-unavailable");
  });

  it("builds subtitle and document title from the active room", () => {
    expect(getRoomSubtitle(room, null)).toBe("PROJ-123 · Round 3 • 1 participant");
    expect(getDocumentTitle(room)).toBe("PROJ-123 | Sprint Planning");
  });
});
