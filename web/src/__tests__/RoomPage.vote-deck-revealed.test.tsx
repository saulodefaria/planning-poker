import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRoomPageState } from "../hooks/useRoomPageState";
import { RoomPage } from "../pages/RoomPage";
import type { RoomState } from "../types";

vi.mock("../hooks/useRoomPageState");

const revealedRoom: RoomState = {
  id: "r1",
  name: "Sprint room",
  status: "revealed",
  round: 1,
  participants: [{ id: "p1", name: "You", vote: "5", hasVoted: true }],
  stats: {
    average: 5,
    nearestFibonacci: 5,
    groupedVotes: [{ vote: "5", count: 1 }],
  },
  tickets: [],
  votedTickets: [],
  currentTicketKey: null,
  voteHistory: [],
};

function mockRoomPageState(overrides: Record<string, unknown> = {}) {
  return {
    activeThrows: [],
    addTicket: vi.fn(),
    clearError: vi.fn(),
    connected: true,
    documentTitle: "Sprint room",
    error: null,
    handleCountdownComplete: vi.fn(),
    handleJoin: vi.fn(),
    handleReveal: vi.fn(),
    handleThrowPaperBall: vi.fn(),
    handleVote: vi.fn(),
    identity: { participantId: "p1", name: "You" },
    joinStatus: "joined",
    pageStage: "room",
    removeTicket: vi.fn(),
    restart: vi.fn(),
    roomState: revealedRoom,
    selectedVote: "5",
    setCurrentTicket: vi.fn(),
    showCountdown: false,
    subtitle: "Round 1 • 1 participant",
    activeRoom: revealedRoom,
    ...overrides,
  };
}

describe("RoomPage — vote deck after reveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leaves every vote card clickable when the round is revealed (votes can be changed)", () => {
    vi.mocked(useRoomPageState).mockReturnValue(mockRoomPageState() as ReturnType<typeof useRoomPageState>);

    render(
      <MemoryRouter initialEntries={["/room/r1"]}>
        <Routes>
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const deck = screen.getByTestId("vote-deck");
    const buttons = within(deck).getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    }
  });
});
