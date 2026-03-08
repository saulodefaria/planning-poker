import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { useLocalRoomIdentity } from '../hooks/useLocalRoomIdentity';
import { JoinForm } from '../components/JoinForm';
import { TableView } from '../components/TableView';
import { VoteDeck } from '../components/VoteDeck';
import { StatsPanel } from '../components/StatsPanel';
import { ErrorBanner } from '../components/ErrorBanner';
import { ShareLink } from '../components/ShareLink';
import { Countdown } from '../components/Countdown';
import type { RoomError, VoteValue } from '../types';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [error, setError] = useState<RoomError | null>(null);
  const [joined, setJoined] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const { identity, saveIdentity, saveVote } = useLocalRoomIdentity(roomId!);
  const lastRoundRef = useRef<number | null>(null);

  const onError = useCallback((err: RoomError) => setError(err), []);
  const onCountdown = useCallback(() => setShowCountdown(true), []);
  const { roomState, connected, join, vote, restart, startCountdown } = useRoomSocket({
    roomId: roomId!,
    onError,
    onCountdown,
  });

  // Auto-reconnect with saved identity
  useEffect(() => {
    if (!connected || joined || !identity) return;

    join(identity.name, identity.participantId).then((ack) => {
      if (ack.ok && ack.participantId) {
        saveIdentity(ack.participantId, ack.canonicalName!);
        setJoined(true);

        // Restore vote from localStorage if it matches the current round
        const room = ack.room;
        if (
          room &&
          room.status === 'voting' &&
          identity.round === room.round &&
          identity.vote
        ) {
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
    if (roomState?.status === 'revealed') {
      setShowCountdown(false);
    }
  }, [roomState?.status]);

  const handleJoin = async (name: string) => {
    const ack = await join(name, identity?.participantId);
    if (ack.ok && ack.participantId) {
      saveIdentity(ack.participantId, ack.canonicalName!);
      setJoined(true);
    } else if (ack.error) {
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

  if (!roomId) return <div className="flex items-center justify-center min-h-screen text-red-500 text-xl">Invalid room URL</div>;

  if (!connected) {
    return <div className="flex items-center justify-center min-h-screen text-slate-400 text-lg">Connecting...</div>;
  }

  if (!joined) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 w-full">
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <JoinForm defaultName={identity?.name} onJoin={handleJoin} />
      </div>
    );
  }

  if (!roomState) {
    return <div className="flex items-center justify-center min-h-screen text-slate-400 text-lg">Loading room...</div>;
  }

  const isRevealed = roomState.status === 'revealed';
  const hasParticipants = roomState.participants.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 w-full">
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Round {roomState.round}</h2>
          <span className="text-sm text-slate-400">
            {roomState.participants.length} participant{roomState.participants.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ShareLink />
      </div>

      <TableView
        participants={roomState.participants}
        roomStatus={roomState.status}
        currentParticipantId={identity?.participantId ?? null}
      >
        {showCountdown ? (
          <Countdown onComplete={handleCountdownComplete} />
        ) : (
          <>
            <span className="text-slate-500 font-medium select-none">Planning Poker</span>
            {hasParticipants && (
              !isRevealed ? (
                <button
                  className="px-8 py-2.5 text-base font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer"
                  onClick={handleReveal}
                >
                  Reveal Votes
                </button>
              ) : (
                <button
                  className="px-8 py-2.5 text-base font-semibold bg-violet-400 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer"
                  onClick={restart}
                >
                  Start New Round
                </button>
              )
            )}
          </>
        )}
      </TableView>

      {!isRevealed && (
        <VoteDeck
          selectedVote={selectedVote}
          onVote={handleVote}
        />
      )}

      {isRevealed && roomState.stats && <StatsPanel stats={roomState.stats} />}
    </div>
  );
}
