import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMER_MINUTES,
  defaultPresetSeconds,
  formatTimerMmSs,
  initialRoomTimer,
  isDefaultIdleState,
  isLastMinuteWarning,
  LAST_MINUTE_THRESHOLD_SECONDS,
  reduceRoomTimer,
  SECONDS_PER_MINUTE,
} from "../room-timer-state";

describe("room timer helpers", () => {
  it("formats duration as MM:SS", () => {
    expect(formatTimerMmSs(0)).toBe("00:00");
    expect(formatTimerMmSs(65)).toBe("01:05");
    expect(formatTimerMmSs(600)).toBe("10:00");
  });

  it("starts at the default preset", () => {
    const initial = initialRoomTimer();
    expect(initial.status).toBe("idle");
    expect(initial.presetSeconds).toBe(DEFAULT_TIMER_MINUTES * SECONDS_PER_MINUTE);
    expect(initial.remainingSeconds).toBe(initial.presetSeconds);
    expect(isDefaultIdleState(initial)).toBe(true);
  });

  it("plays from idle using the preset, then ticks down", () => {
    let state = initialRoomTimer();
    state = reduceRoomTimer(state, { type: "ADD_MINUTE" });
    expect(state.presetSeconds).toBe(DEFAULT_TIMER_MINUTES * SECONDS_PER_MINUTE + SECONDS_PER_MINUTE);
    state = reduceRoomTimer(state, { type: "PLAY" });
    expect(state.status).toBe("running");
    expect(state.remainingSeconds).toBe(state.presetSeconds);
    state = reduceRoomTimer(state, { type: "TICK" });
    expect(state.remainingSeconds).toBe(state.presetSeconds - 1);
  });

  it("pauses without losing remaining time and resumes countdown", () => {
    let state = initialRoomTimer();
    state = reduceRoomTimer(state, { type: "PLAY" });
    state = reduceRoomTimer(state, { type: "TICK" });
    state = reduceRoomTimer(state, { type: "TICK" });
    expect(state.remainingSeconds).toBe(state.presetSeconds - 2);
    state = reduceRoomTimer(state, { type: "PAUSE" });
    expect(state.status).toBe("paused");
    const pausedRemaining = state.remainingSeconds;
    state = reduceRoomTimer(state, { type: "PLAY" });
    expect(state.status).toBe("running");
    expect(state.remainingSeconds).toBe(pausedRemaining);
  });

  it("ignores tick while paused", () => {
    let state = initialRoomTimer();
    state = reduceRoomTimer(state, { type: "PLAY" });
    state = reduceRoomTimer(state, { type: "PAUSE" });
    const pausedRemaining = state.remainingSeconds;
    state = reduceRoomTimer(state, { type: "TICK" });
    expect(state.remainingSeconds).toBe(pausedRemaining);
    expect(state.status).toBe("paused");
  });

  it("enters ended state at 00:00 and waits for reset", () => {
    let state: ReturnType<typeof initialRoomTimer> = {
      ...initialRoomTimer(),
      status: "running",
      presetSeconds: 3,
      remainingSeconds: 1,
    };

    state = reduceRoomTimer(state, { type: "TICK" });
    expect(state.status).toBe("ended");
    expect(state.remainingSeconds).toBe(0);
    expect(state.presetSeconds).toBe(3);
  });

  it("resets to default after ended animation action", () => {
    let state: ReturnType<typeof initialRoomTimer> = {
      ...initialRoomTimer(),
      status: "ended",
      presetSeconds: 900,
      remainingSeconds: 0,
    };

    state = reduceRoomTimer(state, { type: "RESET_TO_DEFAULT" });
    expect(state.status).toBe("idle");
    expect(state.presetSeconds).toBe(defaultPresetSeconds());
    expect(state.remainingSeconds).toBe(defaultPresetSeconds());
  });

  it("cancel restores the default preset and idle status", () => {
    let state = initialRoomTimer();
    state = reduceRoomTimer(state, { type: "ADD_MINUTE" });
    state = reduceRoomTimer(state, { type: "PLAY" });
    state = reduceRoomTimer(state, { type: "PAUSE" });
    state = reduceRoomTimer(state, { type: "CANCEL" });
    expect(state).toMatchObject({
      status: "idle",
      presetSeconds: defaultPresetSeconds(),
      remainingSeconds: defaultPresetSeconds(),
    });
  });

  it("adjusts ±1 minute while idle without starting", () => {
    let state = initialRoomTimer();
    state = reduceRoomTimer(state, { type: "SUB_MINUTE" });
    expect(state.presetSeconds).toBe(DEFAULT_TIMER_MINUTES * SECONDS_PER_MINUTE - SECONDS_PER_MINUTE);
    state = reduceRoomTimer(state, { type: "SUB_MINUTE" });
    expect(state.presetSeconds).toBe(DEFAULT_TIMER_MINUTES * SECONDS_PER_MINUTE - SECONDS_PER_MINUTE * 2);
  });

  it("does not adjust minutes while running", () => {
    let state = reduceRoomTimer(initialRoomTimer(), { type: "PLAY" });
    state = reduceRoomTimer(state, { type: "ADD_MINUTE" });
    state = reduceRoomTimer(state, { type: "SUB_MINUTE" });
    expect(state.remainingSeconds).toBe(state.presetSeconds);
  });

  it("honors floor of one minute while adjusting paused remaining time", () => {
    let state: ReturnType<typeof initialRoomTimer> = {
      ...initialRoomTimer(),
      presetSeconds: 600,
      status: "paused",
      remainingSeconds: SECONDS_PER_MINUTE,
    };
    state = reduceRoomTimer(state, { type: "SUB_MINUTE" });
    expect(state.remainingSeconds).toBe(SECONDS_PER_MINUTE);
  });

  it("enables last-minute warning only for timers that started above one minute", () => {
    expect(
      isLastMinuteWarning({
        ...initialRoomTimer(),
        status: "running",
        presetSeconds: 5 * SECONDS_PER_MINUTE,
        remainingSeconds: LAST_MINUTE_THRESHOLD_SECONDS,
      }),
    ).toBe(true);

    expect(
      isLastMinuteWarning({
        ...initialRoomTimer(),
        status: "running",
        presetSeconds: SECONDS_PER_MINUTE,
        remainingSeconds: LAST_MINUTE_THRESHOLD_SECONDS,
      }),
    ).toBe(false);
  });
});
