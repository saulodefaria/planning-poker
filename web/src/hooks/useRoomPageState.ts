import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalRoomIdentity } from "./useLocalRoomIdentity";
import { useRoomSocket } from "./useRoomSocket";
import { getRoom, toRoomError } from "../services/room-api";
import { loadRoomIdentity } from "../services/room-identity-storage";
import { PAPER_BALL_ANIMATION_MS } from "../paper-ball-motion";
import {
  getDocumentTitle,
  getInitialJoinStatus,
  getRestoredVote,
  getRoomPageStage,
  getRoomSubtitle,
  shouldAttemptAutoJoin,
  type JoinStatus,
} from "../services/room-page-state";
import type { PaperBallThrowEvent, RoomError, RoomState, VoteValue } from "../types";

export function useRoomPageState(roomId: string) {
  const [error, setError] = useState<RoomError | null>(null);
  const [roomPreview, setRoomPreview] = useState<RoomState | null>(null);
  const [joinStatus, setJoinStatus] = useState<JoinStatus>(() => getInitialJoinStatus(loadRoomIdentity(roomId)));
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [activeThrows, setActiveThrows] = useState<PaperBallThrowEvent[]>([]);
  const lastRoundRef = useRef<number | null>(null);
  const paperBallRemovalTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { identity, saveIdentity, saveVote } = useLocalRoomIdentity(roomId);
  const participantIdRef = useRef<string | null>(identity?.participantId ?? null);

  const handleSocketError = useCallback((nextError: RoomError) => {
    if (nextError.code === "ROOM_NOT_FOUND") {
      setRoomPreview(null);
    }

    setError(nextError);
  }, []);

  const handleCountdown = useCallback(() => {
    setShowCountdown(true);
  }, []);

  const handlePaperBallThrown = useCallback((event: PaperBallThrowEvent) => {
    setActiveThrows((currentThrows) => [...currentThrows, event]);

    const timeoutId = setTimeout(() => {
      paperBallRemovalTimeoutsRef.current = paperBallRemovalTimeoutsRef.current.filter((id) => id !== timeoutId);
      setActiveThrows((currentThrows) => currentThrows.filter((paperBallThrow) => paperBallThrow.id !== event.id));
    }, PAPER_BALL_ANIMATION_MS);

    paperBallRemovalTimeoutsRef.current.push(timeoutId);
  }, []);

  const {
    roomState,
    connected,
    join,
    vote,
    restart,
    startCountdown,
    throwPaperBall,
    addTicket,
    removeTicket,
    setCurrentTicket,
  } = useRoomSocket({
    roomId,
    onError: handleSocketError,
    onCountdown: handleCountdown,
    onPaperBallThrown: handlePaperBallThrown,
  });

  useEffect(() => {
    const savedIdentity = loadRoomIdentity(roomId);

    setError(null);
    setRoomPreview(null);
    setJoinStatus(getInitialJoinStatus(savedIdentity));
    setSelectedVote(null);
    setShowCountdown(false);
    setActiveThrows([]);
    lastRoundRef.current = null;

    return () => {
      for (const timeoutId of paperBallRemovalTimeoutsRef.current) {
        clearTimeout(timeoutId);
      }

      paperBallRemovalTimeoutsRef.current = [];
    };
  }, [roomId]);

  useEffect(() => {
    if (connected) {
      return;
    }

    setJoinStatus(getInitialJoinStatus(identity));
  }, [connected, identity]);

  useEffect(() => {
    let cancelled = false;

    const loadRoomPreview = async () => {
      try {
        const room = await getRoom(roomId);

        if (cancelled) {
          return;
        }

        setRoomPreview(room);
        setError((current) => (current?.code === "ROOM_NOT_FOUND" ? null : current));
      } catch (err) {
        if (cancelled) {
          return;
        }

        const nextError = toRoomError(err, "Failed to load room.");

        if (nextError.code === "ROOM_NOT_FOUND") {
          setRoomPreview(null);
        }

        setError(nextError);
      }
    };

    void loadRoomPreview();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    if (!identity || !shouldAttemptAutoJoin({ connected, identity, joinStatus })) {
      return;
    }

    let cancelled = false;

    const restoreSeat = async () => {
      const ack = await join(identity.name, identity.participantId);

      if (cancelled) {
        return;
      }

      if (ack.ok && ack.participantId && ack.canonicalName) {
        saveIdentity(ack.participantId, ack.canonicalName);
        setRoomPreview(ack.room ?? null);
        setSelectedVote(getRestoredVote(identity, ack.room));
        setError(null);
        setJoinStatus("joined");
        return;
      }

      const nextError = ack.error ?? {
        code: "INTERNAL_ERROR",
        message: "Failed to join room.",
      };

      if (nextError.code === "ROOM_NOT_FOUND") {
        setRoomPreview(null);
      }

      setError(nextError);
      setJoinStatus("awaiting-name");
    };

    void restoreSeat();

    return () => {
      cancelled = true;
    };
  }, [connected, identity, join, joinStatus, saveIdentity]);

  useEffect(() => {
    participantIdRef.current = identity?.participantId ?? null;
  }, [identity?.participantId]);

  useEffect(() => {
    if (!roomState) {
      return;
    }

    if (lastRoundRef.current !== null && roomState.round !== lastRoundRef.current) {
      setSelectedVote(null);
      saveVote(null, roomState.round);
    }

    lastRoundRef.current = roomState.round;

    if (roomState.status === "revealed") {
      setShowCountdown(false);

      const pid = participantIdRef.current;
      if (!pid) {
        return;
      }

      const ownParticipant = roomState.participants.find((participant) => participant.id === pid);
      const revealedVote = ownParticipant?.vote ?? null;

      setSelectedVote(revealedVote);
      saveVote(revealedVote, roomState.round);
    }
  }, [roomState, saveVote]);

  const handleJoin = useCallback(
    async (name: string) => {
      setError(null);
      setJoinStatus("submitting");

      const ack = await join(name, identity?.participantId);

      if (ack.ok && ack.participantId && ack.canonicalName) {
        saveIdentity(ack.participantId, ack.canonicalName);
        setRoomPreview(ack.room ?? null);
        setSelectedVote(getRestoredVote(identity, ack.room));
        setJoinStatus("joined");
        return;
      }

      const nextError = ack.error ?? {
        code: "INTERNAL_ERROR",
        message: "Failed to join room.",
      };

      if (nextError.code === "ROOM_NOT_FOUND") {
        setRoomPreview(null);
      }

      setError(nextError);
      setJoinStatus("awaiting-name");
    },
    [identity, join, saveIdentity],
  );

  const handleVote = useCallback(
    (value: VoteValue) => {
      if (!identity || !roomState) {
        return;
      }

      const nextVote = selectedVote === value ? null : value;

      setSelectedVote(nextVote);
      saveVote(nextVote, roomState.round);
      vote(identity.participantId, nextVote);
    },
    [identity, roomState, saveVote, selectedVote, vote],
  );

  const handleReveal = useCallback(() => {
    startCountdown();
  }, [startCountdown]);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
  }, []);

  const handleThrowPaperBall = useCallback(
    (targetParticipantId: string) => {
      if (!identity || !roomState) {
        return;
      }

      const targetParticipant = roomState.participants.find((participant) => participant.id === targetParticipantId);

      if (!targetParticipant || targetParticipant.id === identity.participantId) {
        return;
      }

      throwPaperBall(identity.participantId, targetParticipantId);
    },
    [identity, roomState, throwPaperBall],
  );

  const activeRoom = roomState ?? roomPreview;
  const pageStage = getRoomPageStage({
    activeRoom,
    connected,
    error,
    joinStatus,
    roomState,
  });

  const subtitle = useMemo(() => getRoomSubtitle(activeRoom, error), [activeRoom, error]);
  const documentTitle = useMemo(() => getDocumentTitle(activeRoom), [activeRoom]);

  return {
    activeRoom,
    activeThrows,
    addTicket,
    clearError: () => setError(null),
    connected,
    documentTitle,
    error,
    handleCountdownComplete,
    handleJoin,
    handleReveal,
    handleThrowPaperBall,
    handleVote,
    identity,
    joinStatus,
    pageStage,
    removeTicket,
    restart,
    roomState,
    selectedVote,
    setCurrentTicket,
    showCountdown,
    subtitle,
  };
}
