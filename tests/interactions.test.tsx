/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReviewPage from "@/app/(public)/create/review/page";
import { SkyGate } from "@/components/SkyGate";
import s from "@/lib/strings";

// jsdom has no IntersectionObserver; the cinematic SatinBackdrop (via the
// installed satin-flow, which uses framer's useInView) needs one to render.
class IntersectionObserverStub implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
if (typeof globalThis.IntersectionObserver === "undefined") {
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

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
