import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JoinForm } from "../components/JoinForm";

function getSubmitButton(container: HTMLElement) {
  const btn = container.querySelector('form button[type="submit"]');
  expect(btn).toBeTruthy();
  return btn as HTMLButtonElement;
}

describe("JoinForm", () => {
  it("submits a trimmed display name", () => {
    const onJoin = vi.fn();
    const { container } = render(<JoinForm onJoin={onJoin} />);

    fireEvent.change(within(container).getByPlaceholderText("Enter your name"), {
      target: { value: "  Dana  " },
    });
    fireEvent.click(getSubmitButton(container));

    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onJoin).toHaveBeenCalledWith("Dana");
  });

  it("disables submit when the name is empty or whitespace", () => {
    const onJoin = vi.fn();
    const { container } = render(<JoinForm onJoin={onJoin} />);

    expect(getSubmitButton(container).disabled).toBe(true);

    fireEvent.change(within(container).getByPlaceholderText("Enter your name"), {
      target: { value: "   " },
    });
    expect(getSubmitButton(container).disabled).toBe(true);
  });

  it("shows the room title when a preview name is provided", () => {
    const { container } = render(<JoinForm onJoin={vi.fn()} roomName="Sprint 42" />);
    const heading = within(container).getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Join Sprint 42");
  });

  it("respects disabled and shows loading label", () => {
    const { container } = render(<JoinForm onJoin={vi.fn()} disabled loading />);
    const submit = within(container).getByRole("button", { name: /joining/i });
    expect(submit).toBeTruthy();
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });
});
