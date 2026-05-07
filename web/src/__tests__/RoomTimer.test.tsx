import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoomTimer } from "../components/RoomTimer";
import type { RoomTimerState } from "../types";

function renderRoomTimer(timer: RoomTimerState, serverNowMs: number = Date.now()) {
  const handlers = {
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onCancel: vi.fn(),
    onAddMinute: vi.fn(),
    onSubMinute: vi.fn(),
  };

  const view = render(<RoomTimer timer={timer} serverNowMs={serverNowMs} {...handlers} />);
  return { ...handlers, unmount: view.unmount };
}

describe("RoomTimer", () => {
  it("shows idle snapshot and dispatches minute/cancel actions", () => {
    const handlers = renderRoomTimer({
      status: "idle",
      presetSeconds: 600,
      remainingSeconds: 600,
      endsAtMs: null,
    });

    let region = screen.getByRole("region", { name: /room timer/i });
    expect(within(region).getByText("10:00")).toBeTruthy();

    fireEvent.click(within(region).getByRole("button", { name: /increase timer/i }));
    expect(handlers.onAddMinute).toHaveBeenCalledTimes(1);

    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    expect(handlers.onSubMinute).toHaveBeenCalledTimes(1);
    fireEvent.click(within(region).getByRole("button", { name: /cancel timer/i }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it("toggles primary control between start and pause", () => {
    let handlers = renderRoomTimer({
      status: "idle",
      presetSeconds: 600,
      remainingSeconds: 600,
      endsAtMs: null,
    });

    let region = screen.getByRole("region", { name: /room timer/i });

    fireEvent.click(within(region).getByRole("button", { name: /start timer/i }));
    expect(handlers.onPlay).toHaveBeenCalledTimes(1);

    handlers.unmount();
    handlers = renderRoomTimer({
      status: "running",
      presetSeconds: 600,
      remainingSeconds: 590,
      endsAtMs: Date.now() + 590_000,
    });
    region = screen.getByRole("region", { name: /room timer/i });

    fireEvent.click(within(region).getByRole("button", { name: /pause timer/i }));
    expect(handlers.onPause).toHaveBeenCalledTimes(1);
  });

  it("does not expose minute controls while running", () => {
    renderRoomTimer({
      status: "running",
      presetSeconds: 600,
      remainingSeconds: 580,
      endsAtMs: Date.now() + 580_000,
    });

    const region = screen.getByRole("region", { name: /room timer/i });

    const minus = within(region).getByRole("button", { name: /decrease timer/i });
    const plus = within(region).getByRole("button", { name: /increase timer/i });
    expect((minus as HTMLButtonElement).disabled).toBe(true);
    expect((plus as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows last-minute warning style only when initial time is above one minute", () => {
    vi.useFakeTimers();
    const serverNow = Date.now();
    const firstRender = renderRoomTimer(
      {
        status: "running",
        presetSeconds: 10 * 60,
        remainingSeconds: 10 * 60,
        endsAtMs: serverNow + 10 * 60 * 1000,
      },
      serverNow,
    );
    const region = screen.getByRole("region", { name: /room timer/i });

    act(() => {
      vi.advanceTimersByTime(9 * 60 * 1000);
    });
    expect(region.className.includes("timer-last-minute-alert")).toBe(true);

    firstRender.unmount();
    renderRoomTimer(
      {
        status: "running",
        presetSeconds: 60,
        remainingSeconds: 60,
        endsAtMs: Date.now() + 60 * 1000,
      },
      Date.now(),
    );
    const oneMinuteRegion = screen.getByRole("region", { name: /room timer/i });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(within(oneMinuteRegion).getByText("00:59")).toBeTruthy();
    expect(oneMinuteRegion.className.includes("timer-last-minute-alert")).toBe(false);
    vi.useRealTimers();
  });

  it("uses server time as source of truth for running display", () => {
    vi.useFakeTimers();
    const localNow = Date.now();
    const serverNow = localNow + 5_000;
    renderRoomTimer(
      {
        status: "running",
        presetSeconds: 600,
        remainingSeconds: 600,
        endsAtMs: serverNow + 60_000,
      },
      serverNow,
    );
    const region = screen.getByRole("region", { name: /room timer/i });
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(within(region).getByText("00:58")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(58_000);
    });
    expect(within(region).getByText("00:00")).toBeTruthy();
    expect(region.className.includes("timer-ended-alert")).toBe(true);
    vi.useRealTimers();
  });
});
