import { vi } from "vitest";
import React from "react";

// Render `next/link` as a plain anchor so components render in isolation.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href?: string; children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...rest }, children),
}));

// Neutralise font loader side-effects for isolated renders.
vi.mock("next/font/google", () => ({
  Geist: () => ({ className: "", variable: "" }),
  Geist_Mono: () => ({ className: "", variable: "" }),
}));

// Provide a router stub so client components using `useRouter` render in tests.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  // v2.12: PublicNavbar reads the pathname to scope the light treatment to "/".
  usePathname: () => "/",
}));