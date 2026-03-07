import type { Participant, RoomStatus } from '../types';
import { ParticipantSeat } from './ParticipantSeat';

interface Props {
  participants: Participant[];
  roomStatus: RoomStatus;
  currentParticipantId: string | null;
}

export function TableView({ participants, roomStatus, currentParticipantId }: Props) {
  return (
    <div className="table-view">
      <div className="table-surface">
        <span className="table-label">Planning Poker</span>
      </div>
      <div className="seats">
        {participants.map((p) => (
          <ParticipantSeat
            key={p.id}
            participant={p}
            roomStatus={roomStatus}
            isCurrentUser={p.id === currentParticipantId}
          />
        ))}
      </div>
    </div>
  );
}
