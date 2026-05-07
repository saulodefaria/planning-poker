export const DEFAULT_TIMER_MINUTES = 10;
export const SECONDS_PER_MINUTE = 60;
export const MIN_TIMER_MINUTES = 1;
export const MAX_TIMER_MINUTES = 180;

export const LAST_MINUTE_THRESHOLD_SECONDS = 60;
export const LAST_MINUTE_MIN_PRESET_SECONDS = 60;

export type RoomTimerStatus = "idle" | "running" | "paused" | "ended";

export interface RoomTimerModel {
  status: RoomTimerStatus;
  presetSeconds: number;
  remainingSeconds: number;
  endsAtMs: number | null;
}

type RoomTimerDisplayModel = Pick<RoomTimerModel, "status" | "presetSeconds" | "remainingSeconds">;

export function defaultPresetSeconds(): number {
  return DEFAULT_TIMER_MINUTES * SECONDS_PER_MINUTE;
}

export function initialRoomTimer(): RoomTimerModel {
  const preset = defaultPresetSeconds();
  return { status: "idle", presetSeconds: preset, remainingSeconds: preset, endsAtMs: null };
}

export function formatTimerMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / SECONDS_PER_MINUTE);
  const sec = s % SECONDS_PER_MINUTE;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function getDisplayTimerState(
  state: RoomTimerModel,
  estimatedServerNowMs: number,
): RoomTimerDisplayModel {
  if (state.status !== "running" || state.endsAtMs === null) {
    return { status: state.status, presetSeconds: state.presetSeconds, remainingSeconds: state.remainingSeconds };
  }

  const remainingSeconds = Math.max(0, Math.ceil((state.endsAtMs - estimatedServerNowMs) / 1000));
  return {
    status: remainingSeconds === 0 ? "ended" : "running",
    presetSeconds: state.presetSeconds,
    remainingSeconds,
  };
}

export function isDefaultIdleState(state: RoomTimerDisplayModel): boolean {
  return state.status === "idle" && state.presetSeconds === defaultPresetSeconds();
}

export function isLastMinuteWarning(state: RoomTimerDisplayModel): boolean {
  return (
    (state.status === "running" || state.status === "paused") &&
    state.presetSeconds > LAST_MINUTE_MIN_PRESET_SECONDS &&
    state.remainingSeconds <= LAST_MINUTE_THRESHOLD_SECONDS
  );
}
