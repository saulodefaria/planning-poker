import type { Server, Socket } from "socket.io";
import type { RoomService } from "../application/room-service.js";
import { AppError } from "../domain/errors.js";

interface JoinPayload {
  roomId: string;
  participantId?: string;
  name: string;
}

interface VotePayload {
  roomId: string;
  participantId: string;
  vote: string | null;
}

interface RoomActionPayload {
  roomId: string;
}

interface TicketAddPayload {
  roomId: string;
  url: string;
}

interface TicketRemovePayload {
  roomId: string;
  key: string;
}

interface TicketSetCurrentPayload {
  roomId: string;
  key: string | null;
}

interface PaperBallThrowPayload {
  roomId: string;
  fromParticipantId: string;
  toParticipantId: string;
}

function socketRoomName(roomId: string): string {
  return `room:${roomId}`;
}

function participantSocketRoomName(roomId: string, participantId: string): string {
  return `room:${roomId}:participant:${participantId}`;
}

function clearParticipantSocketRooms(socket: Socket, roomId: string): void {
  const participantRoomPrefix = participantSocketRoomName(roomId, "");

  for (const joinedRoom of socket.rooms) {
    if (joinedRoom.startsWith(participantRoomPrefix)) {
      socket.leave(joinedRoom);
    }
  }
}

export function registerSocketHandlers(io: Server, roomService: RoomService): void {
  const countdownTimers = new Map<string, NodeJS.Timeout>();

  io.on("connection", (socket: Socket) => {
    socket.on("room:join", async (payload: JoinPayload, ack?: (res: unknown) => void) => {
      try {
        if (!payload.roomId || !payload.name || typeof payload.name !== "string") {
          throw new AppError("INVALID_NAME", "Name is required");
        }

        const result = await roomService.join(payload.roomId, payload.name, payload.participantId);

        const socketRoom = socketRoomName(payload.roomId);
        await socket.join(socketRoom);
        clearParticipantSocketRooms(socket, payload.roomId);
        await socket.join(participantSocketRoomName(payload.roomId, result.participantId));

        if (ack) {
          ack({
            ok: true,
            participantId: result.participantId,
            canonicalName: result.canonicalName,
            room: result.room,
          });
        }

        io.to(socketRoom).emit("room:state", result.room);
      } catch (err) {
        emitError(socket, err, ack);
      }
    });

    socket.on("vote:set", async (payload: VotePayload) => {
      try {
        if (!payload.roomId || !payload.participantId) {
          throw new AppError("INVALID_VOTE", "Missing required fields");
        }

        const room = await roomService.vote(payload.roomId, payload.participantId, payload.vote);

        io.to(socketRoomName(payload.roomId)).emit("room:state", room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("room:reveal", async (payload: RoomActionPayload) => {
      try {
        if (!payload.roomId) {
          throw new AppError("ROOM_NOT_FOUND", "Room ID is required");
        }

        const room = await roomService.reveal(payload.roomId);
        io.to(socketRoomName(payload.roomId)).emit("room:state", room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("room:countdown", (payload: RoomActionPayload) => {
      if (!payload.roomId) return;

      // Don't start another countdown if one is already running
      if (countdownTimers.has(payload.roomId)) return;

      io.to(socketRoomName(payload.roomId)).emit("room:countdown");

      // Server auto-reveals after 3s so it completes even if the initiator disconnects
      const timer = setTimeout(async () => {
        countdownTimers.delete(payload.roomId);
        try {
          const room = await roomService.reveal(payload.roomId);
          io.to(socketRoomName(payload.roomId)).emit("room:state", room);
        } catch {
          // Room may already be revealed or deleted
        }
      }, 3000);

      countdownTimers.set(payload.roomId, timer);
    });

    socket.on("room:restart", async (payload: RoomActionPayload) => {
      try {
        if (!payload.roomId) {
          throw new AppError("ROOM_NOT_FOUND", "Room ID is required");
        }

        // Cancel any pending countdown reveal
        const pendingTimer = countdownTimers.get(payload.roomId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          countdownTimers.delete(payload.roomId);
        }

        const room = await roomService.restart(payload.roomId);
        io.to(socketRoomName(payload.roomId)).emit("room:state", room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("room:throw-paper-ball", async (payload: PaperBallThrowPayload) => {
      try {
        if (!payload.roomId || !payload.fromParticipantId || !payload.toParticipantId) {
          throw new AppError("INVALID_STATE", "Missing throw payload fields");
        }

        const room = await roomService.get(payload.roomId);
        const fromParticipant = room.participants.find((participant) => participant.id === payload.fromParticipantId);
        const toParticipant = room.participants.find((participant) => participant.id === payload.toParticipantId);

        if (!fromParticipant || !toParticipant || payload.fromParticipantId === payload.toParticipantId) {
          throw new AppError("INVALID_STATE", "Invalid throw target");
        }

        const eventId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const createdAt = new Date().toISOString();

        io.to(socketRoomName(payload.roomId)).emit("room:paper-ball-thrown", {
          id: eventId,
          roomId: payload.roomId,
          fromParticipantId: payload.fromParticipantId,
          toParticipantId: payload.toParticipantId,
          side: Math.random() > 0.5 ? "left" : "right",
          createdAt,
        });

        io.to(participantSocketRoomName(payload.roomId, toParticipant.id)).emit("room:participant-nudged", {
          id: eventId,
          roomId: payload.roomId,
          fromParticipantId: fromParticipant.id,
          fromParticipantName: fromParticipant.name,
          toParticipantId: toParticipant.id,
          createdAt,
        });
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("ticket:add", async (payload: TicketAddPayload) => {
      try {
        if (!payload.roomId || !payload.url) {
          throw new AppError("INVALID_TICKET_URL", "Room ID and URL are required");
        }
        const room = await roomService.addTicket(payload.roomId, payload.url);
        io.to(socketRoomName(payload.roomId)).emit("room:state", room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("ticket:remove", async (payload: TicketRemovePayload) => {
      try {
        if (!payload.roomId || !payload.key) {
          throw new AppError("INVALID_TICKET_URL", "Room ID and ticket key are required");
        }
        const room = await roomService.removeTicket(payload.roomId, payload.key);
        io.to(socketRoomName(payload.roomId)).emit("room:state", room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on("ticket:set-current", async (payload: TicketSetCurrentPayload) => {
      try {
        if (!payload.roomId) {
          throw new AppError("ROOM_NOT_FOUND", "Room ID is required");
        }
        const room = await roomService.setCurrentTicket(payload.roomId, payload.key ?? null);
        io.to(socketRoomName(payload.roomId)).emit("room:state", room);
      } catch (err) {
        emitError(socket, err);
      }
    });
  });
}

function emitError(socket: Socket, err: unknown, ack?: (res: unknown) => void) {
  const error =
    err instanceof AppError
      ? { code: err.code, message: err.message }
      : { code: "INTERNAL_ERROR", message: "An unexpected error occurred" };

  if (err instanceof AppError) {
    console.warn(`[Socket] Error: ${err.code} - ${err.message}`);
  } else {
    console.error("[Socket] Unexpected error:", err);
  }

  if (ack) {
    ack({ ok: false, error });
  } else {
    socket.emit("room:error", error);
  }
}
