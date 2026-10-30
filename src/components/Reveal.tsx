/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

/** Entrance movement is progressive enhancement: text never becomes hidden
 * after hydration and never waits for a blur layer to finish rasterizing. */

type RevealState = "idle" | "hidden" | "visible";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay (ms) applied as transition-delay (set by RevealGroup). */
  delay?: number;
  /** Use the larger entrance movement (legacy prop name). */
  blur?: boolean;
};

export function Reveal({ children, delay = 0, blur = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("idle");

  useEffect(() => {
    const el = ref.current;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Reduced motion / no IO support → fully visible.
    if (!el || mq.matches || !("IntersectionObserver" in window)) {
      setState("visible");
      return;
    }
    let io: IntersectionObserver | null = null;
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setState("visible");
      io?.disconnect();
    };
    // Prepare movement only; the CSS keeps text visible in every state.
    setState("hidden");
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show();
        }
      },
      { threshold: 0, rootMargin: "180px 0px" },
    );
    io.observe(el);
    // If the observer never fires, force visibility after 1.5s.
    const fallback = window.setTimeout(show, 1500);
    return () => {
      io?.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const cls = blur
    ? state === "hidden"
      ? "reveal-blur"
      : state === "visible"
        ? "reveal-blur is-visible"
        : ""
    : state === "hidden"
      ? "reveal"
      : state === "visible"
        ? "reveal is-visible"
        : "";

  return (
    <div
      ref={ref}
      className={cls}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * A reveal group keeps entrance movement and its 90ms stagger (up to 5). Non-Reveal children
 * (e.g. the Task E pinned gallery) pass through untouched — they are never
 * wrapped in a reveal.
 */
export function RevealGroup({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.toArray(children).map((child, index) => {
        if (!isValidElement(child)) return child;
        const element = child as ReactElement;
        if (element.type !== Reveal) return element;
        const step = Math.min(index, 4); // stagger up to 5 children
        return cloneElement(element, {
          blur: true,
          delay: step * 90,
        } as Partial<RevealProps>);
      })}
    </>
  );
}

/**
 * Task D — render `text` with its final word inside a `.font-serif-accent`
 * span (Instrument Serif italic, 1.04em). Single-word headings and the footer
 * wordmark are exempt. The strings themselves are unchanged.
 */
export function SerifAccent({ text }: { text: string }) {
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return <>{text}</>;
  const last = words[words.length - 1];
  const rest = words.slice(0, -1).join(" ");
  return (
    <>
      {rest} <span className="font-serif-accent">{last}</span>
    </>
  );
}