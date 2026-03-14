import { useMemo } from 'react';
import type { PaperBallThrowEvent, Participant, RoomStatus } from '../types';

interface Props {
  participant: Participant;
  roomStatus: RoomStatus;
  isCurrentUser: boolean;
  currentParticipantId: string | null;
  activeThrows: PaperBallThrowEvent[];
  onThrowPaperBall: (targetParticipantId: string) => void;
}

export function ParticipantSeat({
  participant,
  roomStatus,
  isCurrentUser,
  currentParticipantId,
  activeThrows,
  onThrowPaperBall,
}: Props) {
  const canThrowAtParticipant = Boolean(currentParticipantId && !isCurrentUser);

  const throwsForParticipant = useMemo(
    () => activeThrows.filter((paperBallThrow) => paperBallThrow.toParticipantId === participant.id),
    [activeThrows, participant.id],
  );

  const renderVote = () => {
    if (roomStatus === 'revealed' && participant.hasVoted) {
      return <span className="text-violet-400 text-xl font-bold">{participant.vote}</span>;
    }
    if (participant.hasVoted) {
      return <span className="text-green-400 text-lg">&#10003;</span>;
    }
    return <span className="text-slate-500">-</span>;
  };

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-18">
      <div className="relative w-13 h-18 bg-surface border-2 border-border rounded-lg flex items-center justify-center text-lg font-bold overflow-visible">
        {renderVote()}
        {throwsForParticipant.map((paperBallThrow) => (
          <span
            key={paperBallThrow.id}
            className={`paper-ball-throw paper-ball-throw-${paperBallThrow.side}`}
            aria-hidden="true"
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onThrowPaperBall(participant.id)}
        disabled={!canThrowAtParticipant}
        className={`text-xs max-w-20 truncate text-center transition-colors ${
          isCurrentUser ? 'text-blue-400 font-semibold' : 'text-slate-400'
        } ${canThrowAtParticipant ? 'cursor-pointer hover:text-slate-200' : ''}`}
        title={canThrowAtParticipant ? `Throw paper ball at ${participant.name}` : participant.name}
      >
        <span className="participant-name inline-flex items-center gap-1 justify-center">
          <span className="participant-name-label truncate">{participant.name}</span>
          {canThrowAtParticipant ? <span className="participant-name-hand" aria-hidden="true">🖐️</span> : null}
        </span>
      </button>
    </div>
  );
}
