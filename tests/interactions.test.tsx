// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReviewPage from "@/app/(public)/create/review/page";
import { SkyGate } from "@/components/SkyGate";
import s from "@/lib/strings";

describe("review delete confirmation", () => {
  it("delete button opens the dialog with its exact title", () => {
    render(<ReviewPage />);

    const deleteLabels = screen.getAllByText(s.deleteStepLabel);
    expect(deleteLabels.length).toBeGreaterThan(0);
    const button = deleteLabels[0].closest("button");
    expect(button).not.toBeNull();
    fireEvent.click(button!);

    expect(screen.getByText(s.deleteStepTitle)).toBeTruthy();
    expect(screen.getByText(s.deleteStepBody)).toBeTruthy();
    expect(screen.getByText(s.cancel)).toBeTruthy();
    expect(screen.getAllByText(s.deleteStepConfirm).length).toBeGreaterThan(0);
  });
});

describe("SkyGate — reduced motion", () => {
  it("still renders the sky (a background is never gated on reduced motion)", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const { container } = render(<SkyGate />);
    // The sky still mounts under reduced motion (freezes via speed 0), so the
    // cloud-sky canvas is present.
    expect(container.querySelector("canvas")).not.toBeNull();
  });
});