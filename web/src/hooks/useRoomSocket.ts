import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { RoomState, RoomError, VoteValue } from '../types';

interface UseRoomSocketOptions {
  roomId: string;
  onError?: (error: RoomError) => void;
  onCountdown?: () => void;
}

interface JoinAck {
  ok: boolean;
  participantId?: string;
  canonicalName?: string;
  room?: RoomState;
  error?: RoomError;
}

export function useRoomSocket({ roomId, onError, onCountdown }: UseRoomSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:state', (state: RoomState) => setRoomState(state));
    socket.on('room:error', (error: RoomError) => onError?.(error));
    socket.on('room:countdown', () => onCountdown?.());

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, onError, onCountdown]);

  const join = useCallback(
    (name: string, participantId?: string): Promise<JoinAck> => {
      return new Promise((resolve) => {
        socketRef.current?.emit(
          'room:join',
          { roomId, name, participantId },
          (ack: JoinAck) => resolve(ack),
        );
      });
    },
    [roomId],
  );

  const vote = useCallback(
    (participantId: string, voteValue: VoteValue | null) => {
      socketRef.current?.emit('vote:set', { roomId, participantId, vote: voteValue });
    },
    [roomId],
  );

  const reveal = useCallback(() => {
    socketRef.current?.emit('room:reveal', { roomId });
  }, [roomId]);

  const restart = useCallback(() => {
    socketRef.current?.emit('room:restart', { roomId });
  }, [roomId]);

  const startCountdown = useCallback(() => {
    socketRef.current?.emit('room:countdown', { roomId });
  }, [roomId]);

  return { roomState, connected, join, vote, reveal, restart, startCountdown };
}
