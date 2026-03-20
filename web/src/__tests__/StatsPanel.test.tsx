import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsPanel } from "../components/StatsPanel";
import type { RoomStats } from "../types";

describe("StatsPanel", () => {
  it("sorts tied counts by deck order (lower card first)", () => {
    const stats: RoomStats = {
      average: 6.5,
      nearestFibonacci: 5,
      groupedVotes: [
        { vote: "8", count: 2 },
        { vote: "5", count: 2 },
        { vote: "13", count: 1 },
      ],
    };

    const { container } = render(<StatsPanel stats={stats} />);
    const list = within(container).getByRole("list", { name: /votes per card value/i });
    const labels = within(list)
      .getAllByRole("listitem")
      .map((li) => within(li).getByText(/Points|Uncertain/).textContent);

    expect(labels[0]).toContain("5");
    expect(labels[1]).toContain("8");
    expect(labels[2]).toContain("13");
  });

  it("labels uncertain votes and shows no-average copy when there are only non-numeric votes", () => {
    const stats: RoomStats = {
      average: null,
      nearestFibonacci: null,
      groupedVotes: [{ vote: "?", count: 3 }],
    };

    const { container } = render(<StatsPanel stats={stats} />);
    expect(within(container).getByText("No numeric votes")).toBeTruthy();
    expect(within(container).getByText("Uncertain")).toBeTruthy();
  });

  it("renders average and nearest Fibonacci when numeric votes exist", () => {
    const stats: RoomStats = {
      average: 5,
      nearestFibonacci: 5,
      groupedVotes: [{ vote: "5", count: 1 }],
    };

    const { container } = render(<StatsPanel stats={stats} />);
    expect(within(container).getByText("5.0")).toBeTruthy();
    expect(within(container).getByText("5 Points")).toBeTruthy();
    const nearestLabel = within(container).getByText("Nearest Fibonacci");
    expect(nearestLabel.closest("div")?.textContent).toContain("5");
  });
});
