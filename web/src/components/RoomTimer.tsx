import { formatTimerMmSs, isDefaultIdleState, isLastMinuteWarning } from "../services/room-timer-state";
import { useRoomTimer } from "../hooks/useRoomTimer";

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

export function RoomTimer() {
  const { state, play, pause, cancel, addMinute, subMinute } = useRoomTimer();

  const displaySeconds = state.status === "idle" ? state.presetSeconds : state.remainingSeconds;
  const isRunning = state.status === "running";
  const canAdjustMinutes = state.status === "idle" || state.status === "paused";
  const cancelEmphasized = state.status === "running" || state.status === "paused" || state.status === "ended";
  const lastMinuteWarning = isLastMinuteWarning(state);
  const endedWarning = state.status === "ended";
  const timerToneClass = endedWarning
    ? "timer-ended-alert border-error/85 shadow-[0_8px_28px_rgba(255,92,92,0.25)]"
    : lastMinuteWarning
      ? "timer-last-minute-alert border-amber-400/85 shadow-[0_8px_24px_rgba(251,191,36,0.22)]"
      : "border-outline-variant/20";
  const playPrimaryLabel =
    state.status === "paused" ? "Resume timer" : state.status === "running" ? "Pause timer" : "Start timer";

  return (
    <div
      className={`flex shrink-0 items-stretch rounded-2xl border bg-surface-container-high/90 py-2 pl-3 pr-2 backdrop-blur-sm md:py-2.5 md:pl-4 md:pr-2.5 ${timerToneClass}`}
      role="region"
      aria-label="Room timer">
      <div className="flex items-center gap-1.5 border-r border-outline-variant/15 pr-3 md:gap-2 md:pr-4">
        <button
          type="button"
          disabled={!canAdjustMinutes}
          onClick={subMinute}
          className="flex size-8 items-center justify-center rounded-xl text-lg font-semibold text-on-surface-variant transition-colors hover:bg-surface-container/80 hover:text-on-surface disabled:pointer-events-none disabled:opacity-35 md:size-9"
          aria-label="Decrease timer by one minute">
          −
        </button>
        <span
          className="min-w-[3.25rem] text-center font-mono text-base font-semibold tabular-nums tracking-tight text-on-surface md:min-w-[3.75rem] md:text-lg"
          aria-live="polite">
          {formatTimerMmSs(displaySeconds)}
        </span>
        <button
          type="button"
          disabled={!canAdjustMinutes}
          onClick={addMinute}
          className="flex size-8 items-center justify-center rounded-xl text-lg font-semibold text-on-surface-variant transition-colors hover:bg-surface-container/80 hover:text-on-surface disabled:pointer-events-none disabled:opacity-35 md:size-9"
          aria-label="Increase timer by one minute">
          +
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 pl-2.5 md:gap-3 md:pl-3">
        <button
          type="button"
          disabled={endedWarning}
          onClick={() => (isRunning ? pause() : play())}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-container text-on-primary shadow-[0_6px_20px_rgba(78,222,163,0.35)] transition-transform hover:scale-[1.03] active:scale-95 md:size-12"
          aria-label={playPrimaryLabel}>
          {isRunning ? <PauseIcon className="size-5 md:size-6" /> : <PlayIcon className="ml-0.5 size-5 md:size-6" />}
        </button>

        <div className="flex min-h-[3.25rem] flex-col items-end justify-between gap-1 py-0.5 md:min-h-[3.5rem]">
          <button
            type="button"
            onClick={cancel}
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-on-primary transition-transform hover:scale-[1.03] active:scale-95 md:size-9 ${
              cancelEmphasized
                ? "bg-[#ff4d6d] shadow-[0_0_16px_rgba(255,77,109,0.65)]"
                : "bg-surface-container-highest"
            } ${isDefaultIdleState(state) ? "opacity-60" : ""}`}
            aria-label="Cancel timer — reset to 10 minutes">
            <StopIcon className="size-7 opacity-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
