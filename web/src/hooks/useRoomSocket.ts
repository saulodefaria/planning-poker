import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { PaperBallThrowEvent, RoomState, RoomError, VoteValue } from "../types";

interface UseRoomSocketOptions {
  roomId: string;
  onError?: (error: RoomError) => void;
  onCountdown?: () => void;
  onPaperBallThrown?: (event: PaperBallThrowEvent) => void;
}

export interface JoinAck {
  ok: boolean;
  participantId?: string;
  canonicalName?: string;
  room?: RoomState;
  error?: RoomError;
}

export function useRoomSocket({ roomId, onError, onCountdown, onPaperBallThrown }: UseRoomSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onErrorRef = useRef(onError);
  const onCountdownRef = useRef(onCountdown);
  const onPaperBallThrownRef = useRef(onPaperBallThrown);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onErrorRef.current = onError;
    onCountdownRef.current = onCountdown;
    onPaperBallThrownRef.current = onPaperBallThrown;
  }, [onCountdown, onError, onPaperBallThrown]);

  useEffect(() => {
    setRoomState(null);
    setConnected(false);

    const socket = io({ transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("room:state", (state: RoomState) => setRoomState(state));
    socket.on("room:error", (error: RoomError) => onErrorRef.current?.(error));
    socket.on("room:countdown", () => onCountdownRef.current?.());
    socket.on("room:paper-ball-thrown", (event: PaperBallThrowEvent) => onPaperBallThrownRef.current?.(event));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const join = useCallback(
    (name: string, participantId?: string): Promise<JoinAck> => {
      const socket = socketRef.current;

      if (!socket) {
        return Promise.resolve({
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Socket connection unavailable.",
          },
        });
      }

      return new Promise((resolve) => {
        socket.emit(
          "room:join",
          { roomId, name, participantId },
          (ack: JoinAck) => resolve(ack),
        );
      });
    },
    [roomId],
  );

  const vote = useCallback(
    (participantId: string, voteValue: VoteValue | null) => {
      socketRef.current?.emit("vote:set", { roomId, participantId, vote: voteValue });
    },
    [roomId],
  );

  const reveal = useCallback(() => {
    socketRef.current?.emit("room:reveal", { roomId });
  }, [roomId]);

  const restart = useCallback(() => {
    socketRef.current?.emit("room:restart", { roomId });
  }, [roomId]);

  const startCountdown = useCallback(() => {
    socketRef.current?.emit("room:countdown", { roomId });
  }, [roomId]);

  const throwPaperBall = useCallback(
    (fromParticipantId: string, toParticipantId: string) => {
      socketRef.current?.emit("room:throw-paper-ball", { roomId, fromParticipantId, toParticipantId });
    },
    [roomId],
  );

  const addTicket = useCallback(
    (url: string) => {
      socketRef.current?.emit("ticket:add", { roomId, url });
    },
    [roomId],
  );

  const removeTicket = useCallback(
    (key: string) => {
      socketRef.current?.emit("ticket:remove", { roomId, key });
    },
    [roomId],
  );

  const setCurrentTicket = useCallback(
    (key: string | null) => {
      socketRef.current?.emit("ticket:set-current", { roomId, key });
    },
    [roomId],
  );

  return {
    roomState,
    connected,
    join,
    vote,
    reveal,
    restart,
    startCountdown,
    throwPaperBall,
    addTicket,
    removeTicket,
    setCurrentTicket,
  };
}
