/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { InteriorHeader } from "@/components/InteriorHeader";
import NotFound from "@/app/not-found";

const route = vi.hoisted(() => ({ pathname: "/professional/lessons/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/Magnetic", () => ({ Magnetic: ({ children }: { children: React.ReactNode }) => children }));

beforeEach(() => { route.pathname = "/professional/lessons/"; });
afterEach(cleanup);

describe("Navigation recovery", () => {
  it("identifies the current page, exposes the menu, and returns keyboard focus on Escape", () => {
    render(<InteriorHeader />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(toggle);
    const menu = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(menu).not.toBeNull();
    expect(within(menu).getByRole("link", { name: "Training hub" }).getAttribute("aria-current")).toBe("page");
    within(menu).getByRole("link", { name: "Instructor review" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("does not carry an expanded menu across a mode or route change", () => {
    const view = render(<InteriorHeader />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    route.pathname = "/lessons/";
    view.rerender(<InteriorHeader />);
    expect(screen.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("interior-navigation")).toBeNull();
  });

  it("keeps Professional 404 recovery in Professional and provides the skip-link target", () => {
    route.pathname = "/professional/missing/";
    const { container } = render(<NotFound />);
    expect(container.querySelector('a[href="/professional/lesson/sample"]')).not.toBeNull();
    expect(container.querySelector("main#main-content")?.getAttribute("tabindex")).toBe("-1");
  });
});
