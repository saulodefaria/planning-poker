import type { LocalIdentity } from "../types";

export function getRoomIdentityStorageKey(roomId: string): string {
  return `planning-poker:room:${roomId}:identity`;
}

export function loadRoomIdentity(roomId: string): LocalIdentity | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(getRoomIdentityStorageKey(roomId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return isLocalIdentity(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRoomIdentity(roomId: string, identity: LocalIdentity): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(getRoomIdentityStorageKey(roomId), JSON.stringify(identity));
}

export function clearRoomIdentity(roomId: string): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(getRoomIdentityStorageKey(roomId));
}

function getStorage(): Storage | null {
  if (!("localStorage" in globalThis)) {
    return null;
  }

  return globalThis.localStorage;
}

function isLocalIdentity(value: unknown): value is LocalIdentity {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    participantId?: unknown;
    name?: unknown;
    vote?: unknown;
    round?: unknown;
  };

  return (
    typeof candidate.participantId === "string" &&
    typeof candidate.name === "string" &&
    (candidate.vote === undefined || candidate.vote === null || typeof candidate.vote === "string") &&
    (candidate.round === undefined || typeof candidate.round === "number")
  );
}
