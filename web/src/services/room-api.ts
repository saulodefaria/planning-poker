import type { RoomError, RoomState } from "../types";

interface RequestJsonOptions extends RequestInit {
  fallbackMessage: string;
}

export interface CreateRoomResponse {
  roomId: string;
  roomUrl: string;
}

export async function createRoom(name: string): Promise<CreateRoomResponse> {
  return requestJson<CreateRoomResponse>("/api/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
    fallbackMessage: "Failed to create room.",
  });
}

export async function getRoom(roomId: string): Promise<RoomState> {
  return requestJson<RoomState>(`/api/rooms/${roomId}`, {
    fallbackMessage: "Failed to load room.",
  });
}

export function toRoomError(error: unknown, fallbackMessage: string): RoomError {
  if (isRoomError(error)) {
    return error;
  }

  return {
    code: "INTERNAL_ERROR",
    message: fallbackMessage,
  };
}

function isRoomError(value: unknown): value is RoomError {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { code?: unknown; message?: unknown };

  return typeof candidate.code === "string" && typeof candidate.message === "string";
}

async function requestJson<T>(url: string, { fallbackMessage, ...init }: RequestJsonOptions): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw toRoomError(data, fallbackMessage);
  }

  return data as T;
}
