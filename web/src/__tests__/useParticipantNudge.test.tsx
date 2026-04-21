import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useParticipantNudge } from "../hooks/useParticipantNudge";
import type { ParticipantNudgeEvent } from "../types";

interface HarnessProps {
  incoming: ParticipantNudgeEvent | null;
  playSound: () => void | Promise<void>;
}

function Harness({ incoming, playSound }: HarnessProps) {
  const { activeNudge, receiveNudge } = useParticipantNudge(playSound, 5000);

  useEffect(() => {
    if (incoming) {
      receiveNudge(incoming);
    }
  }, [incoming, receiveNudge]);

  return <div data-testid="active-nudge">{activeNudge?.id ?? "none"}</div>;
}

const baseEvent = {
  roomId: "room-1",
  fromParticipantId: "alice",
  fromParticipantName: "Alice",
  toParticipantId: "bob",
  createdAt: "2026-04-21T12:00:00.000Z",
};

describe("useParticipantNudge", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps a single nudge visible for five seconds and ignores repeats while active", () => {
    vi.useFakeTimers();

    const playSound = vi.fn();
    const firstEvent: ParticipantNudgeEvent = { ...baseEvent, id: "nudge-1" };
    const secondEvent: ParticipantNudgeEvent = { ...baseEvent, id: "nudge-2", fromParticipantName: "Carol" };
    const thirdEvent: ParticipantNudgeEvent = { ...baseEvent, id: "nudge-3", fromParticipantName: "Dana" };

    const { rerender } = render(<Harness incoming={null} playSound={playSound} />);

    expect(screen.getByTestId("active-nudge").textContent).toBe("none");

    rerender(<Harness incoming={firstEvent} playSound={playSound} />);
    expect(screen.getByTestId("active-nudge").textContent).toBe("nudge-1");
    expect(playSound).toHaveBeenCalledTimes(1);

    rerender(<Harness incoming={secondEvent} playSound={playSound} />);
    expect(screen.getByTestId("active-nudge").textContent).toBe("nudge-1");
    expect(playSound).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByTestId("active-nudge").textContent).toBe("nudge-1");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId("active-nudge").textContent).toBe("none");

    rerender(<Harness incoming={thirdEvent} playSound={playSound} />);
    expect(screen.getByTestId("active-nudge").textContent).toBe("nudge-3");
    expect(playSound).toHaveBeenCalledTimes(2);
  });
});
