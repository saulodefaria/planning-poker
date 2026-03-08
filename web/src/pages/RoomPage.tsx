import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { useLocalRoomIdentity } from "../hooks/useLocalRoomIdentity";
import { JoinForm } from "../components/JoinForm";
import { TableView } from "../components/TableView";
import { VoteDeck } from "../components/VoteDeck";
import { StatsPanel } from "../components/StatsPanel";
import { ErrorBanner } from "../components/ErrorBanner";
import { ShareLink } from "../components/ShareLink";
import { Countdown } from "../components/Countdown";
import { SiteHeader } from "../components/SiteHeader";
import type { RoomError, RoomState, VoteValue } from "../types";

export function RoomPage() {
  const navigate = useNavigate();
  const { roomId, roomSlug } = useParams<{ roomId: string; roomSlug?: string }>();
  const [error, setError] = useState<RoomError | null>(null);
  const [joined, setJoined] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [roomPreview, setRoomPreview] = useState<RoomState | null>(null);
  const { identity, saveIdentity, saveVote } = useLocalRoomIdentity(roomId!);
  const lastRoundRef = useRef<number | null>(null);

  const onError = useCallback((err: RoomError) => {
    if (err.code === "ROOM_NOT_FOUND") {
      setRoomPreview(null);
    }
    setError(err);
  }, []);
  const onCountdown = useCallback(() => setShowCountdown(true), []);
  const { roomState, connected, join, vote, restart, startCountdown } = useRoomSocket({
    roomId: roomId!,
    onError,
    onCountdown,
  });

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    const loadRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw data ?? { code: "ROOM_NOT_FOUND", message: "Room not found" };
        }

        if (cancelled) return;

        const room = data as RoomState;
        setRoomPreview(room);
        setError((current) => (current?.code === "ROOM_NOT_FOUND" ? null : current));

        const canonicalPath = `/room/${room.id}`;
        const currentPath = roomSlug ? `/room/${roomId}/${roomSlug}` : `/room/${roomId}`;
        if (currentPath !== canonicalPath) {
          navigate(canonicalPath, { replace: true });
        }
      } catch (err) {
        if (cancelled) return;

        const nextError =
          err && typeof err === "object" && "code" in err && "message" in err
            ? (err as RoomError)
            : { code: "INTERNAL_ERROR", message: "Failed to load room." };

        if (nextError.code === "ROOM_NOT_FOUND") {
          setRoomPreview(null);
        }
        setError(nextError);
      }
    };

    loadRoom();

    return () => {
      cancelled = true;
    };
  }, [navigate, roomId, roomSlug]);

  // Auto-reconnect with saved identity
  useEffect(() => {
    if (!connected || joined || !identity) return;

    join(identity.name, identity.participantId).then((ack) => {
      if (ack.ok && ack.participantId) {
        saveIdentity(ack.participantId, ack.canonicalName!);
        setJoined(true);

        // Restore vote from localStorage if it matches the current round
        const room = ack.room;
        if (room && room.status === "voting" && identity.round === room.round && identity.vote) {
          setSelectedVote(identity.vote);
        }
      }
    });
  }, [connected, joined, identity, join, saveIdentity]);

  // Clear selected vote when the round changes (restart)
  useEffect(() => {
    if (!roomState) return;

    if (lastRoundRef.current !== null && roomState.round !== lastRoundRef.current) {
      setSelectedVote(null);
      saveVote(null, roomState.round);
    }

    lastRoundRef.current = roomState.round;
  }, [roomState?.round, roomState, saveVote]);

  // Clear countdown if room becomes revealed (safety net)
  useEffect(() => {
    if (roomState?.status === "revealed") {
      setShowCountdown(false);
    }
  }, [roomState?.status]);

  const handleJoin = async (name: string) => {
    const ack = await join(name, identity?.participantId);
    if (ack.ok && ack.participantId) {
      saveIdentity(ack.participantId, ack.canonicalName!);
      setJoined(true);
    } else if (ack.error) {
      if (ack.error.code === "ROOM_NOT_FOUND") {
        setRoomPreview(null);
      }
      setError(ack.error);
    }
  };

  const handleVote = (value: VoteValue) => {
    if (!identity || !roomState) return;
    if (selectedVote === value) {
      setSelectedVote(null);
      saveVote(null, roomState.round);
      vote(identity.participantId, null);
    } else {
      setSelectedVote(value);
      saveVote(value, roomState.round);
      vote(identity.participantId, value);
    }
  };

  const handleReveal = () => {
    startCountdown();
  };

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
  }, []);

  if (!roomId)
    return <div className="flex items-center justify-center min-h-screen text-red-500 text-xl">Invalid room URL</div>;

  const activeRoom = roomState ?? roomPreview;
  const isRoomUnavailable = !activeRoom && error?.code === "ROOM_NOT_FOUND";
  const participantCount = activeRoom?.participants.length ?? 0;
  const subtitle = activeRoom
    ? `Round ${activeRoom.round} • ${participantCount} participant${participantCount !== 1 ? "s" : ""}`
    : isRoomUnavailable
      ? "This room is no longer available."
      : "Join the table and start estimating together.";

  if (isRoomUnavailable) {
    return (
      <div className="min-h-screen">
        <SiteHeader title="Room not found" subtitle="This room may have expired or the link may be incorrect." />
        <main className="mx-auto flex min-h-[calc(100vh-145px)] max-w-2xl items-center justify-center px-4 py-8">
          <div className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-slate-950/20">
            <h2 className="text-2xl font-semibold text-white">Room not found</h2>
            <p className="mt-3 text-slate-400">Rooms expire after 24 hours without activity.</p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-xl bg-blue-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-600">
              Go to homepage
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen">
        <SiteHeader
          title={activeRoom?.name ?? "Planning Poker"}
          subtitle="Connecting to the room..."
          action={activeRoom ? <ShareLink /> : undefined}
        />
        <div className="flex min-h-[calc(100vh-145px)] items-center justify-center px-4 text-lg text-slate-400">
          Connecting...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        title={activeRoom?.name ?? "Planning Poker"}
        subtitle={subtitle}
        action={activeRoom ? <ShareLink /> : undefined}
      />

      <main className="mx-auto max-w-3xl px-4 py-6 w-full">
        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        {!joined ? (
          <>
            <JoinForm defaultName={identity?.name} roomName={activeRoom?.name} onJoin={handleJoin} />
          </>
        ) : !roomState ? (
          <div className="flex items-center justify-center min-h-[50vh] text-slate-400 text-lg">Loading room...</div>
        ) : (
          <>
            <TableView
              participants={roomState.participants}
              roomStatus={roomState.status}
              currentParticipantId={identity?.participantId ?? null}>
              {showCountdown ? (
                <Countdown onComplete={handleCountdownComplete} />
              ) : (
                <>
                  {roomState.participants.length > 0 &&
                    (roomState.status !== "revealed" ? (
                      <button
                        className="px-8 py-2.5 text-base font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer"
                        onClick={handleReveal}>
                        Reveal Votes
                      </button>
                    ) : (
                      <button
                        className="px-8 py-2.5 text-base font-semibold bg-violet-400 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer"
                        onClick={restart}>
                        Start New Round
                      </button>
                    ))}
                </>
              )}
            </TableView>

            {roomState.status !== "revealed" ? <VoteDeck selectedVote={selectedVote} onVote={handleVote} /> : null}

            {roomState.status === "revealed" && roomState.stats ? <StatsPanel stats={roomState.stats} /> : null}
          </>
        )}
      </main>
    </div>
  );
}
