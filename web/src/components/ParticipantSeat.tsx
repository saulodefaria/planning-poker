import type { Participant, RoomStatus } from '../types';

interface Props {
  participant: Participant;
  roomStatus: RoomStatus;
  isCurrentUser: boolean;
}

export function ParticipantSeat({ participant, roomStatus, isCurrentUser }: Props) {
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
      <div className="w-13 h-18 bg-surface border-2 border-border rounded-lg flex items-center justify-center text-lg font-bold">
        {renderVote()}
      </div>
      <div
        className={`text-xs max-w-20 truncate text-center ${
          isCurrentUser ? 'text-blue-400 font-semibold' : 'text-slate-400'
        }`}
        title={participant.name}
      >
        {participant.name}
      </div>
    </div>
  );
}
