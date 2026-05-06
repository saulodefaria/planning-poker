import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoomTimer } from "../components/RoomTimer";
import { ROOM_TIMER_ENDED_RESET_DELAY_MS } from "../hooks/useRoomTimer";

describe("RoomTimer", () => {
  it("starts at 10:00 and resets via cancel controls", () => {
    render(<RoomTimer />);

    const region = screen.getByRole("region", { name: /room timer/i });
    expect(within(region).getByText("10:00")).toBeTruthy();

    fireEvent.click(within(region).getByRole("button", { name: /increase timer/i }));
    expect(within(region).getByText("11:00")).toBeTruthy();

    fireEvent.click(within(region).getByRole("button", { name: /cancel timer/i }));
    expect(within(region).getByText("10:00")).toBeTruthy();
  });

  it("toggles primary control between start and pause", () => {
    render(<RoomTimer />);

    const region = screen.getByRole("region", { name: /room timer/i });

    fireEvent.click(within(region).getByRole("button", { name: /start timer/i }));
    expect(within(region).getByRole("button", { name: /pause timer/i })).toBeTruthy();

    fireEvent.click(within(region).getByRole("button", { name: /pause timer/i }));
    expect(within(region).getByRole("button", { name: /resume timer/i })).toBeTruthy();
  });

  it("does not expose minute controls while running", () => {
    render(<RoomTimer />);

    const region = screen.getByRole("region", { name: /room timer/i });
    fireEvent.click(within(region).getByRole("button", { name: /start timer/i }));

    const minus = within(region).getByRole("button", { name: /decrease timer/i });
    const plus = within(region).getByRole("button", { name: /increase timer/i });
    expect((minus as HTMLButtonElement).disabled).toBe(true);
    expect((plus as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows last-minute warning style only when initial time is above one minute", () => {
    vi.useFakeTimers();
    render(<RoomTimer />);
    const region = screen.getByRole("region", { name: /room timer/i });

    fireEvent.click(within(region).getByRole("button", { name: /start timer/i }));
    act(() => {
      vi.advanceTimersByTime(9 * 60 * 1000);
    });
    expect(region.className.includes("timer-last-minute-alert")).toBe(true);

    fireEvent.click(within(region).getByRole("button", { name: /cancel timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    fireEvent.click(within(region).getByRole("button", { name: /decrease timer/i }));
    expect(within(region).getByText("01:00")).toBeTruthy();

    fireEvent.click(within(region).getByRole("button", { name: /start timer/i }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(within(region).getByText("00:59")).toBeTruthy();
    expect(region.className.includes("timer-last-minute-alert")).toBe(false);
    vi.useRealTimers();
  });

  it("shows ended animation at 00:00 then auto-resets to default", () => {
    vi.useFakeTimers();
    render(<RoomTimer />);
    const region = screen.getByRole("region", { name: /room timer/i });

    fireEvent.click(within(region).getByRole("button", { name: /start timer/i }));
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(within(region).getByText("00:00")).toBeTruthy();
    expect(region.className.includes("timer-ended-alert")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(ROOM_TIMER_ENDED_RESET_DELAY_MS);
    });
    expect(within(region).getByText("10:00")).toBeTruthy();
    expect(region.className.includes("timer-ended-alert")).toBe(false);
    vi.useRealTimers();
  });
});
