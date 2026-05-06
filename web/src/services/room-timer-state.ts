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
}

export type RoomTimerAction =
  | { type: "TICK" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "CANCEL" }
  | { type: "RESET_TO_DEFAULT" }
  | { type: "ADD_MINUTE" }
  | { type: "SUB_MINUTE" };

export function defaultPresetSeconds(): number {
  return DEFAULT_TIMER_MINUTES * SECONDS_PER_MINUTE;
}

export function initialRoomTimer(): RoomTimerModel {
  const preset = defaultPresetSeconds();
  return { status: "idle", presetSeconds: preset, remainingSeconds: preset };
}

export function formatTimerMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / SECONDS_PER_MINUTE);
  const sec = s % SECONDS_PER_MINUTE;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function reduceRoomTimer(state: RoomTimerModel, action: RoomTimerAction): RoomTimerModel {
  const minSeconds = MIN_TIMER_MINUTES * SECONDS_PER_MINUTE;
  const maxSeconds = MAX_TIMER_MINUTES * SECONDS_PER_MINUTE;

  switch (action.type) {
    case "TICK": {
      if (state.status !== "running") {
        return state;
      }

      if (state.remainingSeconds <= 1) {
        return { ...state, status: "ended", remainingSeconds: 0 };
      }

      return { ...state, remainingSeconds: state.remainingSeconds - 1 };
    }
    case "PLAY": {
      if (state.status === "running") {
        return state;
      }

      if (state.status === "ended") {
        return state;
      }

      if (state.status === "idle") {
        return { ...state, status: "running", remainingSeconds: state.presetSeconds };
      }

      return { ...state, status: "running" };
    }
    case "PAUSE": {
      if (state.status !== "running") {
        return state;
      }

      return { ...state, status: "paused" };
    }
    case "CANCEL": {
      const preset = defaultPresetSeconds();
      return { status: "idle", presetSeconds: preset, remainingSeconds: preset };
    }
    case "RESET_TO_DEFAULT": {
      const preset = defaultPresetSeconds();
      return { status: "idle", presetSeconds: preset, remainingSeconds: preset };
    }
    case "ADD_MINUTE": {
      if (state.status === "running" || state.status === "ended") {
        return state;
      }

      if (state.status === "idle") {
        const nextPreset = Math.min(state.presetSeconds + SECONDS_PER_MINUTE, maxSeconds);
        return { ...state, presetSeconds: nextPreset, remainingSeconds: nextPreset };
      }

      const nextRemaining = Math.min(state.remainingSeconds + SECONDS_PER_MINUTE, maxSeconds);
      return { ...state, remainingSeconds: nextRemaining };
    }
    case "SUB_MINUTE": {
      if (state.status === "running" || state.status === "ended") {
        return state;
      }

      if (state.status === "idle") {
        const nextPreset = Math.max(state.presetSeconds - SECONDS_PER_MINUTE, minSeconds);
        return { ...state, presetSeconds: nextPreset, remainingSeconds: nextPreset };
      }

      const nextRemaining = Math.max(state.remainingSeconds - SECONDS_PER_MINUTE, minSeconds);
      return { ...state, remainingSeconds: nextRemaining };
    }
    default:
      return state;
  }
}

export function isDefaultIdleState(state: RoomTimerModel): boolean {
  return state.status === "idle" && state.presetSeconds === defaultPresetSeconds();
}

export function isLastMinuteWarning(state: RoomTimerModel): boolean {
  return (
    (state.status === "running" || state.status === "paused") &&
    state.presetSeconds > LAST_MINUTE_MIN_PRESET_SECONDS &&
    state.remainingSeconds <= LAST_MINUTE_THRESHOLD_SECONDS
  );
}
