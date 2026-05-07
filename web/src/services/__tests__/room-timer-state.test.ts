import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMER_MINUTES,
  defaultPresetSeconds,
  formatTimerMmSs,
  getDisplayTimerState,
  initialRoomTimer,
  isDefaultIdleState,
  isLastMinuteWarning,
  LAST_MINUTE_THRESHOLD_SECONDS,
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
    expect(initial.endsAtMs).toBeNull();
    expect(isDefaultIdleState(initial)).toBe(true);
  });

  it("keeps non-running state unchanged when building display", () => {
    const paused = {
      status: "paused" as const,
      presetSeconds: 900,
      remainingSeconds: 320,
      endsAtMs: null,
    };
    expect(getDisplayTimerState(paused, Date.now())).toEqual({
      status: "paused",
      presetSeconds: 900,
      remainingSeconds: 320,
    });
  });

  it("uses server time to compute running remaining time", () => {
    const serverNow = 1_000_000;
    const running = {
      status: "running" as const,
      presetSeconds: 600,
      remainingSeconds: 600,
      endsAtMs: serverNow + 125_000,
    };

    expect(getDisplayTimerState(running, serverNow)).toEqual({
      status: "running",
      presetSeconds: 600,
      remainingSeconds: 125,
    });
  });

  it("shows ended when running timer reached zero", () => {
    const serverNow = 2_000_000;
    const running = {
      status: "running" as const,
      presetSeconds: 600,
      remainingSeconds: 600,
      endsAtMs: serverNow,
    };

    expect(getDisplayTimerState(running, serverNow)).toEqual({
      status: "ended",
      presetSeconds: 600,
      remainingSeconds: 0,
    });
  });

  it("exposes default preset helper", () => {
    expect(defaultPresetSeconds()).toBe(DEFAULT_TIMER_MINUTES * SECONDS_PER_MINUTE);
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
