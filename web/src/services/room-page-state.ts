import type { LocalIdentity, RoomError, RoomState, VoteValue } from "../types";

export type JoinStatus = "awaiting-name" | "restoring" | "submitting" | "joined";

export type RoomPageStage =
  | "room-unavailable"
  | "connecting"
  | "restoring"
  | "join-form"
  | "loading-room"
  | "room";

interface RoomPageStageParams {
  activeRoom: RoomState | null;
  connected: boolean;
  error: RoomError | null;
  joinStatus: JoinStatus;
  roomState: RoomState | null;
}

interface AutoJoinParams {
  connected: boolean;
  identity: LocalIdentity | null;
  joinStatus: JoinStatus;
}

export function getInitialJoinStatus(identity: LocalIdentity | null): JoinStatus {
  return identity ? "restoring" : "awaiting-name";
}

export function shouldAttemptAutoJoin({ connected, identity, joinStatus }: AutoJoinParams): boolean {
  return connected && joinStatus === "restoring" && Boolean(identity);
}

export function getRestoredVote(identity: LocalIdentity | null, room: RoomState | null | undefined): VoteValue | null {
  if (!identity || !room || room.status !== "voting" || identity.round !== room.round) {
    return null;
  }

  return identity.vote ?? null;
}

export function isRoomUnavailable(activeRoom: RoomState | null, error: RoomError | null): boolean {
  return !activeRoom && error?.code === "ROOM_NOT_FOUND";
}

export function getRoomPageStage({
  activeRoom,
  connected,
  error,
  joinStatus,
  roomState,
}: RoomPageStageParams): RoomPageStage {
  if (isRoomUnavailable(activeRoom, error)) {
    return "room-unavailable";
  }

  if (!connected) {
    return "connecting";
  }

  if (joinStatus === "restoring") {
    return "restoring";
  }

  if (joinStatus !== "joined") {
    return "join-form";
  }

  if (!roomState) {
    return "loading-room";
  }

  return "room";
}

export function getRoomSubtitle(activeRoom: RoomState | null, error: RoomError | null): string {
  if (activeRoom) {
    const participantCount = activeRoom.participants.length;
    const roundLine = `Round ${activeRoom.round} • ${participantCount} participant${participantCount !== 1 ? "s" : ""}`;

    return activeRoom.currentTicketKey ? `${activeRoom.currentTicketKey} · ${roundLine}` : roundLine;
  }

  if (isRoomUnavailable(activeRoom, error)) {
    return "This room is no longer available.";
  }

  return "Join the table and start estimating together.";
}

export function getDocumentTitle(activeRoom: RoomState | null): string {
  const baseTitle = activeRoom?.name ?? "Planning Poker";

  return activeRoom?.currentTicketKey ? `${activeRoom.currentTicketKey} | ${baseTitle}` : baseTitle;
}
