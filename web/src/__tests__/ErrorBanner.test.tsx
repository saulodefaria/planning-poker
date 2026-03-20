import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBanner } from "../components/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders nothing when error is null", () => {
    const { container } = render(<ErrorBanner error={null} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the message and dismisses", () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <ErrorBanner error={{ code: "X", message: "Something went wrong" }} onDismiss={onDismiss} />,
    );

    expect(within(container).getByText("Something went wrong")).toBeTruthy();
    fireEvent.click(within(container).getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
