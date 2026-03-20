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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
    if (roomStatus === "revealed") {
      if (participant.hasVoted && participant.vote != null) {
        return <span className="text-base font-bold text-primary md:text-lg">{participant.vote}</span>;
      }
      return <span className="text-sm text-on-surface-variant/50 md:text-base">—</span>;
    }

    if (participant.hasVoted) {
      return <CheckIcon className="size-6 text-primary md:size-7" />;
    }

    return <div className="size-2.5 rounded-full bg-on-surface-variant animate-pulse md:size-3" />;
  };

  const cardState =
    roomStatus === "revealed" && participant.hasVoted ? "revealed" : participant.hasVoted ? "voted" : "waiting";

  const cardClass =
    cardState === "revealed"
      ? "border-primary/35 bg-primary/10 glow-primary"
      : "participant-glass border-outline-variant/15";

  const seatContent = (
    <>
      <div
        className={`participant-seat-card relative flex h-16 w-11 items-center justify-center overflow-visible rounded-md border text-sm font-bold transition-colors md:h-20 md:w-12 md:rounded-lg md:text-base ${
          cardClass
        } ${canThrowAtParticipant ? "group-hover:border-primary/35 group-focus-visible:border-primary/35" : ""}`}>
        <div ref={playAreaRef} className="paper-ball-stage">
          {throwsForParticipant.map((paperBallThrow) => (
            <PaperBallThrow key={paperBallThrow.id} side={paperBallThrow.side} playAreaRef={playAreaRef} />
          ))}
        </div>
        {renderVote()}
      </div>
      <span
        className={`max-w-18 truncate text-center text-[10px] transition-colors md:max-w-22 md:text-xs ${
          isCurrentUser ? "font-semibold text-primary" : "text-on-surface-variant"
        } ${canThrowAtParticipant ? "group-hover:text-on-surface group-focus-visible:text-on-surface" : ""}`}>
        {participant.name}
      </span>
    </>
  );

  if (canThrowAtParticipant) {
    return (
      <button
        type="button"
        onClick={() => onThrowPaperBall(participant.id)}
        className={`participant-seat-trigger group relative flex min-w-11 flex-col items-center gap-1.5 md:min-w-12 md:gap-2 ${
          hasActiveThrow ? "z-30" : "z-0"
        }`}
        title={`Throw paper ball at ${participant.name}`}
        aria-label={`Throw paper ball at ${participant.name}`}>
        {seatContent}
      </button>
    );
  }

  return (
    <div
      className={`relative flex min-w-11 flex-col items-center gap-1.5 md:min-w-12 md:gap-2 ${hasActiveThrow ? "z-30" : "z-0"}`}
      title={participant.name}>
      {seatContent}
    </div>
  );
}
