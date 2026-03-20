import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VoteDeck } from "../components/VoteDeck";
import { VOTE_DECK } from "../types";

describe("VoteDeck", () => {
  it("renders one button per deck value", () => {
    const { container } = render(<VoteDeck selectedVote={null} onVote={vi.fn()} />);
    const deck = container.querySelector('[data-testid="vote-deck"]');
    expect(deck).toBeTruthy();
    const buttons = within(deck as HTMLElement).getAllByRole("button");
    expect(buttons).toHaveLength(VOTE_DECK.length);
    for (const value of VOTE_DECK) {
      expect(within(deck as HTMLElement).getByRole("button", { name: value })).toBeTruthy();
    }
  });

  it("notifies parent when a card is chosen", () => {
    const onVote = vi.fn();
    const { container } = render(<VoteDeck selectedVote={null} onVote={onVote} />);
    const deck = container.querySelector('[data-testid="vote-deck"]') as HTMLElement;

    fireEvent.click(within(deck).getByRole("button", { name: "13" }));
    expect(onVote).toHaveBeenCalledWith("13");
  });

  it("disables every card when disabled is true", () => {
    const { container } = render(<VoteDeck selectedVote="5" onVote={vi.fn()} disabled />);
    const deck = container.querySelector('[data-testid="vote-deck"]') as HTMLElement;
    for (const btn of within(deck).getAllByRole("button")) {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
