/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { useEffect, useRef } from "react";
import { useFrame, useMediaQuery } from "./SmoothScroll";

/**
 * Task E — cursor-following circular badge for the horizontal lessons gallery.
 *
 * 96px, ink background, white text. It follows the cursor with lerped smoothing
 * in the shared rAF loop, scales in on card enter and out on leave.
 * pointer-events-none; fine-pointer only (absent on touch) and absent under
 * prefers-reduced-motion. The label is the lesson card's call-to-action string
 * (strings.startLessonShort). The badge node and cards are looked up by
 * attribute inside the loop (no component ref is mutated there).
 */
export function CursorBadge({ label }: { label: string }) {
  const fine = useMediaQuery("(pointer: fine)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const target = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const over = useRef(false);

  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);

  useFrame(() => {
    const el = document.querySelector<HTMLElement>("[data-cursor-badge]");
    if (!el) return;
    // Lerped smoothing toward the cursor.
    cur.current.x += (target.current.x - cur.current.x) * 0.2;
    cur.current.y += (target.current.y - cur.current.y) * 0.2;
    let hovering = false;
    for (const card of document.querySelectorAll<HTMLElement>("[data-gallery-card]")) {
      const r = card.getBoundingClientRect();
      if (
        target.current.x >= r.left &&
        target.current.x <= r.right &&
        target.current.y >= r.top &&
        target.current.y <= r.bottom
      ) {
        hovering = true;
        break;
      }
    }
    const entering = hovering && !over.current;
    over.current = hovering;
    el.style.transform =
      `translate3d(${cur.current.x}px, ${cur.current.y}px, 0) ` +
      `translate(-50%, -50%) scale(${hovering ? 1 : 0.5})`;
    el.style.opacity = entering || hovering ? "1" : "0";
  });

  if (!enabled) return null;

  return (
    <div
      data-cursor-badge
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-50 flex h-24 w-24 items-center justify-center rounded-full bg-site-ink text-sm font-semibold text-white opacity-0"
    >
      {label}
    </div>
  );
}