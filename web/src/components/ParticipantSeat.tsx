import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  advancePaperBallMotion,
  createPaperBallMotionState,
  PAPER_BALL_ANIMATION_MS,
  PAPER_BALL_SIZE_PX,
} from "../paper-ball-motion";
import type { PaperBallThrowEvent, Participant, RoomStatus, ThrowSide } from "../types";

interface Props {
  participant: Participant;
  roomStatus: RoomStatus;
  isCurrentUser: boolean;
  currentParticipantId: string | null;
  activeThrows: PaperBallThrowEvent[];
  onThrowPaperBall: (targetParticipantId: string) => void;
}

interface PaperBallThrowProps {
  side: ThrowSide;
  playAreaRef: RefObject<HTMLDivElement | null>;
}

function PaperBallThrow({ side, playAreaRef }: PaperBallThrowProps) {
  const ballRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const ballElement = ballRef.current;
    const playAreaElement = playAreaRef.current;

    if (!ballElement || !playAreaElement) {
      return;
    }

    const bounds = {
      width: playAreaElement.clientWidth,
      height: playAreaElement.clientHeight,
    };

    let state = createPaperBallMotionState(side, bounds);
    let frameId = 0;
    let animationStart = 0;
    let lastFrame = 0;

    const renderFrame = (elapsedMs: number) => {
      const fadeInProgress = Math.min(elapsedMs / 90, 1);
      const fadeOutProgress = Math.max((PAPER_BALL_ANIMATION_MS - elapsedMs) / 180, 0);
      const opacity = Math.min(fadeInProgress, fadeOutProgress, 1);

      ballElement.style.opacity = `${opacity}`;
      ballElement.style.transform = `translate3d(${state.x - PAPER_BALL_SIZE_PX / 2}px, ${
        state.y - PAPER_BALL_SIZE_PX / 2
      }px, 0) rotate(${state.rotation}deg)`;
    };

    const animate = (timestamp: number) => {
      if (animationStart === 0) {
        animationStart = timestamp;
        lastFrame = timestamp;
        renderFrame(0);
        frameId = window.requestAnimationFrame(animate);
        return;
      }

      const elapsedMs = timestamp - animationStart;
      const deltaSeconds = (timestamp - lastFrame) / 1000;
      lastFrame = timestamp;
      state = advancePaperBallMotion(state, bounds, deltaSeconds);
      renderFrame(elapsedMs);

      if (elapsedMs < PAPER_BALL_ANIMATION_MS) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    renderFrame(0);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [playAreaRef, side]);

  return <span ref={ballRef} className="paper-ball-throw" aria-hidden="true" />;
}

export function ParticipantSeat({
  participant,
  roomStatus,
  isCurrentUser,
  currentParticipantId,
  activeThrows,
  onThrowPaperBall,
}: Props) {
  const playAreaRef = useRef<HTMLDivElement | null>(null);
  const canThrowAtParticipant = Boolean(currentParticipantId && !isCurrentUser);

  const throwsForParticipant = useMemo(
    () => activeThrows.filter((paperBallThrow) => paperBallThrow.toParticipantId === participant.id),
    [activeThrows, participant.id],
  );
  const hasActiveThrow = throwsForParticipant.length > 0;

  const renderVote = () => {
    if (roomStatus === 'revealed' && participant.hasVoted) {
      return <span className="text-violet-400 text-xl font-bold">{participant.vote}</span>;
    }
    if (participant.hasVoted) {
      return <span className="text-green-400 text-lg">&#10003;</span>;
    }
    return <span className="text-slate-500">-</span>;
  };

  const seatContent = (
    <>
      <div
        className={`participant-seat-card relative flex h-18 w-13 items-center justify-center overflow-visible rounded-lg border-2 border-border bg-surface text-lg font-bold ${
          canThrowAtParticipant ? "transition-colors group-hover:border-slate-300 group-focus-visible:border-slate-300" : ""
        }`}>
        <div ref={playAreaRef} className="paper-ball-stage">
          {throwsForParticipant.map((paperBallThrow) => (
            <PaperBallThrow key={paperBallThrow.id} side={paperBallThrow.side} playAreaRef={playAreaRef} />
          ))}
        </div>
        {renderVote()}
      </div>
      <span
        className={`max-w-20 truncate text-center text-xs transition-colors ${
          isCurrentUser ? "font-semibold text-blue-400" : "text-slate-400"
        } ${canThrowAtParticipant ? "group-hover:text-slate-200 group-focus-visible:text-slate-200" : ""}`}>
        {participant.name}
      </span>
    </>
  );

  if (canThrowAtParticipant) {
    return (
      <button
        type="button"
        onClick={() => onThrowPaperBall(participant.id)}
        className={`participant-seat-trigger group relative flex min-w-18 flex-col items-center gap-1.5 ${
          hasActiveThrow ? "z-30" : "z-0"
        }`}
        title={`Throw paper ball at ${participant.name}`}
        aria-label={`Throw paper ball at ${participant.name}`}>
        {seatContent}
      </button>
    );
  }

  return (
    <div className={`relative flex min-w-18 flex-col items-center gap-1.5 ${hasActiveThrow ? "z-30" : "z-0"}`} title={participant.name}>
      {seatContent}
    </div>
  );
}
