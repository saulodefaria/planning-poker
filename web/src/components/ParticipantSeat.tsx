import type { Participant, RoomStatus } from '../types';

interface Props {
  participant: Participant;
  roomStatus: RoomStatus;
  isCurrentUser: boolean;
}

export function ParticipantSeat({ participant, roomStatus, isCurrentUser }: Props) {
  const renderVote = () => {
    if (roomStatus === 'revealed' && participant.hasVoted) {
      return <span className="vote-value revealed">{participant.vote}</span>;
    }
    if (participant.hasVoted) {
      return <span className="vote-value hidden-vote">&#10003;</span>;
    }
    return <span className="vote-value waiting">-</span>;
  };

  return (
    <div className={`participant-seat ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="participant-card">{renderVote()}</div>
      <div className="participant-name" title={participant.name}>
        {participant.name}
      </div>
    </div>
  );
}
