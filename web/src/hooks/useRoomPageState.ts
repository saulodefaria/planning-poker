import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalRoomIdentity } from "./useLocalRoomIdentity";
import { useRoomSocket } from "./useRoomSocket";
import { getRoom, toRoomError } from "../services/room-api";
import { loadRoomIdentity } from "../services/room-identity-storage";
import {
  getDocumentTitle,
  getInitialJoinStatus,
  getRestoredVote,
  getRoomPageStage,
  getRoomSubtitle,
  shouldAttemptAutoJoin,
  type JoinStatus,
} from "../services/room-page-state";
import type { RoomError, RoomState, VoteValue } from "../types";

export function useRoomPageState(roomId: string) {
  const [error, setError] = useState<RoomError | null>(null);
  const [roomPreview, setRoomPreview] = useState<RoomState | null>(null);
  const [joinStatus, setJoinStatus] = useState<JoinStatus>(() => getInitialJoinStatus(loadRoomIdentity(roomId)));
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const lastRoundRef = useRef<number | null>(null);
  const { identity, saveIdentity, saveVote } = useLocalRoomIdentity(roomId);

  const handleSocketError = useCallback((nextError: RoomError) => {
    if (nextError.code === "ROOM_NOT_FOUND") {
      setRoomPreview(null);
    }

    setError(nextError);
  }, []);

  const handleCountdown = useCallback(() => {
    setShowCountdown(true);
  }, []);

  const { roomState, connected, join, vote, restart, startCountdown, addTicket, removeTicket, setCurrentTicket } =
    useRoomSocket({
      roomId,
      onError: handleSocketError,
      onCountdown: handleCountdown,
    });

  useEffect(() => {
    const savedIdentity = loadRoomIdentity(roomId);

    setError(null);
    setRoomPreview(null);
    setJoinStatus(getInitialJoinStatus(savedIdentity));
    setSelectedVote(null);
    setShowCountdown(false);
    lastRoundRef.current = null;
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

      if (!identity) {
        return;
      }

      const ownParticipant = roomState.participants.find((participant) => participant.id === identity.participantId);
      const revealedVote = ownParticipant?.vote ?? null;

      setSelectedVote(revealedVote);
      saveVote(revealedVote, roomState.round);
    }
  }, [identity, roomState, saveVote]);

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
    addTicket,
    clearError: () => setError(null),
    connected,
    documentTitle,
    error,
    handleCountdownComplete,
    handleJoin,
    handleReveal,
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
