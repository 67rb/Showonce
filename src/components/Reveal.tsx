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

/**
 * Task C — Reveal choreography v2.
 *
 * Plain `<Reveal>` keeps the legacy subtle entrance used ONLY by the frozen
 * hero (which must never receive the blur). The v2 slow rise + blur-clear is
 * the default inside `<RevealGroup>`: groups stagger their Reveal children by
 * 90ms each (up to 5), with opacity 0→1, translateY(32px)→0 and blur(6px)→0
 * over 900ms at cubic-bezier(0.22, 1, 0.36, 1), firing once on entry.
 *
 * Load-bearing guarantees:
 *  - The hidden state is applied ONLY by JavaScript after mount (no-JS always
 *    sees everything).
 *  - Under prefers-reduced-motion content renders fully visible (no transform,
 *    no blur).
 *  - A 1.5s fallback forces visibility if the observer never fires.
 */

type RevealState = "idle" | "hidden" | "visible";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay (ms) applied as transition-delay (set by RevealGroup). */
  delay?: number;
  /** Use the v2 blur choreography (set true by RevealGroup). */
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
    // The hidden state is applied here, only after hydration — no-JS visitors
    // see everything with no transform and no blur.
    setState("hidden");
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show();
        }
      },
      { threshold: 0.15 },
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
 * A reveal group. Its direct Reveal children are re-cloned with the v2 blur
 * choreography and a 90ms-per-step stagger (up to 5). Non-Reveal children
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