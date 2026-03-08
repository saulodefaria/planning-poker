import type { ReactNode } from 'react';
import type { Participant, RoomStatus } from '../types';
import { ParticipantSeat } from './ParticipantSeat';

interface Props {
  participants: Participant[];
  roomStatus: RoomStatus;
  currentParticipantId: string | null;
  children?: ReactNode;
}

export function TableView({ participants, roomStatus, currentParticipantId, children }: Props) {
  const count = participants.length;

  // Split participants into top and bottom halves around the table
  const topCount = Math.ceil(count / 2);

  const top = participants.slice(0, topCount);
  const bottom = participants.slice(topCount);

  const renderSeats = (group: Participant[]) =>
    group.map((p) => (
      <ParticipantSeat
        key={p.id}
        participant={p}
        roomStatus={roomStatus}
        isCurrentUser={p.id === currentParticipantId}
      />
    ));

  return (
    <div className="flex flex-col items-center gap-4 mb-8">
      {/* Top seats */}
      <div className="flex flex-wrap justify-center gap-3">
        {renderSeats(top)}
      </div>

      {/* Table surface */}
      <div className="w-full max-w-md bg-surface border-2 border-border rounded-2xl py-6 px-12 flex flex-col items-center justify-center gap-3 min-h-28">
        {children}
      </div>

      {/* Bottom seats */}
      {bottom.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {renderSeats(bottom)}
        </div>
      )}
    </div>
  );
}
