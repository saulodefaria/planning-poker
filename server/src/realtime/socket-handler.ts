import type { Server, Socket } from 'socket.io';
import type { RoomService } from '../application/room-service.js';
import { AppError } from '../domain/errors.js';

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

function socketRoomName(roomId: string): string {
  return `room:${roomId}`;
}

export function registerSocketHandlers(io: Server, roomService: RoomService): void {
  io.on('connection', (socket: Socket) => {
    socket.on('room:join', async (payload: JoinPayload, ack?: (res: unknown) => void) => {
      try {
        if (!payload.roomId || !payload.name || typeof payload.name !== 'string') {
          throw new AppError('INVALID_NAME', 'Name is required');
        }

        const result = await roomService.join(
          payload.roomId,
          payload.name,
          payload.participantId,
        );

        const socketRoom = socketRoomName(payload.roomId);
        await socket.join(socketRoom);

        if (ack) {
          ack({
            ok: true,
            participantId: result.participantId,
            canonicalName: result.canonicalName,
            room: result.room,
          });
        }

        io.to(socketRoom).emit('room:state', result.room);
      } catch (err) {
        emitError(socket, err, ack);
      }
    });

    socket.on('vote:set', async (payload: VotePayload) => {
      try {
        if (!payload.roomId || !payload.participantId) {
          throw new AppError('INVALID_VOTE', 'Missing required fields');
        }

        const room = await roomService.vote(
          payload.roomId,
          payload.participantId,
          payload.vote,
        );

        io.to(socketRoomName(payload.roomId)).emit('room:state', room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on('room:reveal', async (payload: RoomActionPayload) => {
      try {
        if (!payload.roomId) {
          throw new AppError('ROOM_NOT_FOUND', 'Room ID is required');
        }

        const room = await roomService.reveal(payload.roomId);
        io.to(socketRoomName(payload.roomId)).emit('room:state', room);
      } catch (err) {
        emitError(socket, err);
      }
    });

    socket.on('room:restart', async (payload: RoomActionPayload) => {
      try {
        if (!payload.roomId) {
          throw new AppError('ROOM_NOT_FOUND', 'Room ID is required');
        }

        const room = await roomService.restart(payload.roomId);
        io.to(socketRoomName(payload.roomId)).emit('room:state', room);
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
      : { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };

  if (err instanceof AppError) {
    console.warn(`[Socket] Error: ${err.code} - ${err.message}`);
  } else {
    console.error('[Socket] Unexpected error:', err);
  }

  if (ack) {
    ack({ ok: false, error });
  } else {
    socket.emit('room:error', error);
  }
}
