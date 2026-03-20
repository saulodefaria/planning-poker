import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoom, getRoom, toRoomError } from "../room-api";
import type { RoomState } from "../../types";

function mockResponse(overrides: Partial<Response> & { json?: () => Promise<unknown> }): Response {
  return {
    ok: true,
    json: async () => ({}),
    ...overrides,
  } as Response;
}

describe("room-api", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("createRoom POSTs the room name and returns payload", async () => {
    const payload = { roomId: "abc", roomUrl: "/room/abc" };
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => payload,
      }),
    );

    await expect(createRoom("Sprint 1")).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Sprint 1" }),
    });
  });

  it("getRoom GETs the room document", async () => {
    const payload: Partial<RoomState> = { id: "r1", name: "Room" };
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        json: async () => payload,
      }),
    );

    await expect(getRoom("r1")).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith("/api/rooms/r1", {});
  });

  it("surfaces API error bodies as RoomError", async () => {
    const errBody = { code: "ROOM_NOT_FOUND", message: "Missing" };
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        json: async () => errBody,
      }),
    );

    await expect(getRoom("x")).rejects.toEqual(errBody);
  });

  it("uses the fallback message when the error body is not structured", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        json: async () => null,
      }),
    );

    await expect(getRoom("x")).rejects.toEqual({
      code: "INTERNAL_ERROR",
      message: "Failed to load room.",
    });
  });

  it("toRoomError passes through RoomError-shaped values", () => {
    const e = { code: "X", message: "y" };
    expect(toRoomError(e, "fallback")).toBe(e);
  });

  it("toRoomError wraps unknown values", () => {
    expect(toRoomError(new Error("boom"), "fallback")).toEqual({
      code: "INTERNAL_ERROR",
      message: "fallback",
    });
  });
});
