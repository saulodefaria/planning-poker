import type { ReactNode } from "react";
import type { PaperBallThrowEvent, Participant, RoomStatus } from "../types";
import { ParticipantSeat } from "./ParticipantSeat";

interface Props {
  participants: Participant[];
  roomStatus: RoomStatus;
  currentParticipantId: string | null;
  activeThrows: PaperBallThrowEvent[];
  onThrowPaperBall: (targetParticipantId: string) => void;
  children?: ReactNode;
}

export function TableView({
  participants,
  roomStatus,
  currentParticipantId,
  activeThrows,
  onThrowPaperBall,
  children,
}: Props) {
  const count = participants.length;
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
        currentParticipantId={currentParticipantId}
        activeThrows={activeThrows}
        onThrowPaperBall={onThrowPaperBall}
      />
    ));

  return (
    <section className="relative flex min-h-[160px] items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low p-3 md:min-h-[210px] md:rounded-3xl md:p-4">
      <div className="absolute top-0 right-0 size-56 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[64px] md:size-80 md:blur-[80px]" />
      <div className="absolute bottom-0 left-0 size-40 -translate-x-1/2 translate-y-1/2 rounded-full bg-secondary/5 blur-[48px] md:size-52 md:blur-[64px]" />

      <div className="relative z-10 flex w-full flex-col items-center gap-3 md:gap-4">
        <div className="flex w-full max-w-2xl flex-wrap justify-center gap-2 md:max-w-none md:gap-3">
          {renderSeats(top)}
        </div>

        <div className="flex w-full max-w-66 flex-col items-center justify-center gap-1.5 rounded-lg border border-outline-variant/10 bg-surface-container/80 px-3 py-3 backdrop-blur-sm md:max-w-md md:gap-2 md:rounded-xl md:px-4 md:py-3.5">
          {children}
        </div>

        {bottom.length > 0 ? (
          <div className="flex w-full max-w-2xl flex-wrap justify-center gap-2 md:max-w-none md:gap-3">
            {renderSeats(bottom)}
          </div>
        ) : null}
      </div>
    </section>
  );
}
