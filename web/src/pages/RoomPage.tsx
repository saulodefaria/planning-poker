import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { useLocalRoomIdentity } from '../hooks/useLocalRoomIdentity';
import { JoinForm } from '../components/JoinForm';
import { TableView } from '../components/TableView';
import { VoteDeck } from '../components/VoteDeck';
import { RevealPanel } from '../components/RevealPanel';
import { StatsPanel } from '../components/StatsPanel';
import { ErrorBanner } from '../components/ErrorBanner';
import type { RoomError, VoteValue } from '../types';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [error, setError] = useState<RoomError | null>(null);
  const [joined, setJoined] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const { identity, saveIdentity, saveVote } = useLocalRoomIdentity(roomId!);
  const lastRoundRef = useRef<number | null>(null);

  const onError = useCallback((err: RoomError) => setError(err), []);
  const { roomState, connected, join, vote, reveal, restart } = useRoomSocket({
    roomId: roomId!,
    onError,
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

  if (!roomId) return <div className="error-page">Invalid room URL</div>;

  if (!connected) {
    return <div className="loading">Connecting...</div>;
  }

  if (!joined) {
    return (
      <div className="room-page">
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        <JoinForm defaultName={identity?.name} onJoin={handleJoin} />
      </div>
    );
  }

  if (!roomState) {
    return <div className="loading">Loading room...</div>;
  }

  const isRevealed = roomState.status === 'revealed';

  return (
    <div className="room-page">
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      <div className="room-header">
        <h2>Round {roomState.round}</h2>
        <span className="participant-count">
          {roomState.participants.length} participant{roomState.participants.length !== 1 ? 's' : ''}
        </span>
      </div>

      <TableView
        participants={roomState.participants}
        roomStatus={roomState.status}
        currentParticipantId={identity?.participantId ?? null}
      />

      {!isRevealed && (
        <VoteDeck
          selectedVote={selectedVote}
          onVote={handleVote}
        />
      )}

      <RevealPanel
        onReveal={reveal}
        onRestart={restart}
        isRevealed={isRevealed}
        hasParticipants={roomState.participants.length > 0}
      />

      {isRevealed && roomState.stats && <StatsPanel stats={roomState.stats} />}
    </div>
  );
}
