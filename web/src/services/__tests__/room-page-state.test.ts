import { describe, expect, it } from "vitest";
import {
  getDocumentTitle,
  getInitialJoinStatus,
  getRestoredVote,
  getRoomPageStage,
  getRoomSubtitle,
  isRoomUnavailable,
  shouldAttemptAutoJoin,
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

  it("uses plural participants in the subtitle", () => {
    const multi = {
      ...room,
      participants: [
        { id: "a", name: "A", vote: null, hasVoted: false },
        { id: "b", name: "B", vote: null, hasVoted: false },
      ],
    };
    expect(getRoomSubtitle(multi, null)).toBe("PROJ-123 · Round 3 • 2 participants");
  });

  it("omits the ticket prefix when there is no current ticket", () => {
    expect(getRoomSubtitle({ ...room, currentTicketKey: null }, null)).toBe("Round 3 • 1 participant");
    expect(getDocumentTitle({ ...room, currentTicketKey: null })).toBe("Sprint Planning");
  });

  it("describes lobby copy when there is no room and no not-found error", () => {
    expect(getRoomSubtitle(null, null)).toBe("Join the table and start estimating together.");
  });

  it("detects room-unavailable from error code", () => {
    expect(isRoomUnavailable(null, { code: "ROOM_NOT_FOUND", message: "x" })).toBe(true);
    expect(isRoomUnavailable(null, { code: "INTERNAL_ERROR", message: "x" })).toBe(false);
    expect(isRoomUnavailable(room, { code: "ROOM_NOT_FOUND", message: "x" })).toBe(false);
  });

  it("decides when auto-join should run", () => {
    const identity = { participantId: "p1", name: "A" };
    expect(shouldAttemptAutoJoin({ connected: true, identity, joinStatus: "restoring" })).toBe(true);
    expect(shouldAttemptAutoJoin({ connected: false, identity, joinStatus: "restoring" })).toBe(false);
    expect(shouldAttemptAutoJoin({ connected: true, identity: null, joinStatus: "restoring" })).toBe(false);
    expect(shouldAttemptAutoJoin({ connected: true, identity, joinStatus: "awaiting-name" })).toBe(false);
  });

  it("shows connecting while the socket is offline", () => {
    expect(
      getRoomPageStage({
        activeRoom: room,
        connected: false,
        error: null,
        joinStatus: "awaiting-name",
        roomState: null,
      }),
    ).toBe("connecting");
  });

  it("shows loading-room after join until the first live state arrives", () => {
    expect(
      getRoomPageStage({
        activeRoom: room,
        connected: true,
        error: null,
        joinStatus: "joined",
        roomState: null,
      }),
    ).toBe("loading-room");
  });

  it("shows the room once joined and state is present", () => {
    expect(
      getRoomPageStage({
        activeRoom: room,
        connected: true,
        error: null,
        joinStatus: "joined",
        roomState: room,
      }),
    ).toBe("room");
  });

  it("keeps the join form visible while submitting a name", () => {
    expect(
      getRoomPageStage({
        activeRoom: room,
        connected: true,
        error: null,
        joinStatus: "submitting",
        roomState: null,
      }),
    ).toBe("join-form");
  });
});
