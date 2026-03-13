import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRoomIdentity,
  getRoomIdentityStorageKey,
  loadRoomIdentity,
  saveRoomIdentity,
} from "../room-identity-storage";

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.get(key) ?? null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

describe("room identity storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists and clears the saved identity for a room", () => {
    saveRoomIdentity("room-123", {
      participantId: "participant-1",
      name: "Alice",
      vote: "8",
      round: 2,
    });

    expect(loadRoomIdentity("room-123")).toEqual({
      participantId: "participant-1",
      name: "Alice",
      vote: "8",
      round: 2,
    });

    clearRoomIdentity("room-123");

    expect(loadRoomIdentity("room-123")).toBeNull();
  });

  it("returns null for invalid stored data", () => {
    localStorage.setItem(getRoomIdentityStorageKey("room-123"), '{"participantId":1}');

    expect(loadRoomIdentity("room-123")).toBeNull();
  });
});
