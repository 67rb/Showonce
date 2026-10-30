/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Lenis inertial smooth scrolling (Task A) plus the ONE shared requestAnimationFrame
 * loop that also drives Parallax (Task B), the horizontal-gallery track and the
 * cursor badge (Task E). No competing second loop exists anywhere in the app.
 */

type FrameCallback = (time: number) => void;
const frameSubscribers = new Set<FrameCallback>();

/** Register a per-frame callback into SmoothScroll's single rAF loop. */
export function subscribeFrame(callback: FrameCallback): () => void {
  frameSubscribers.add(callback);
  let removed = false;
  return () => {
    if (!removed) {
      removed = true;
      frameSubscribers.delete(callback);
    }
  };
}

/** React binding: run `fn` every animation frame in the shared loop. */
export function useFrame(fn: FrameCallback) {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => subscribeFrame((t) => latest.current(t)), []);
}

/**
 * SSR-safe media query (used for pointer/viewport/reduced-motion gating across
 * the feel layer). The server snapshot is `false`, so the no-JS/SSR render is
 * always the safe (fallback / off) state.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );
}

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const isPop = useRef(false);

  useEffect(() => {
    // prefers-reduced-motion: Lenis is never created and the shared rAF loop
    // never starts, so parallax / gallery pinning / badge all stay off too.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      // Keep smooth wheel motion, with less trailing delay after input.
      lerp: 0.18,
      smoothWheel: true,
      // Smooth touch is OFF. The installed Lenis (1.3.27) has no `smoothTouch`
      // option; its touch-smoothing toggle is `syncTouch` (default false).
      // Leaving it off keeps native instant touch scrolling.
      syncTouch: false,
      // Follow in-page anchor links through the smoothed scroll.
      anchors: true,
      // We drive the single shared loop below; Lenis must not spawn its own.
      autoRaf: false,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      rafId = 0;
      if (document.hidden) return;
      lenis.raf(time);
      frameSubscribers.forEach((cb) => cb(time));
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const onPop = () => {
      isPop.current = true;
    };
    window.addEventListener("popstate", onPop);
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(rafId); rafId = 0; }
      else if (!rafId) rafId = requestAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", visibility);

    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lenis animates the real window scroll position, so both the Resizable
  // Navbar's scroll morph (framer-motion reading scrollY) and the sky gate's
  // IntersectionObserver keep working unchanged — the navbar itself is not
  // touched. On a pathname change we start at the top via the instance,
  // unless the machine issued a popstate (back/forward), in which case the
  // browser's own scroll restoration is left alone.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (prevPath.current !== pathname) {
      if (!isPop.current) {
        lenis.scrollTo(0, { immediate: true });
      }
      prevPath.current = pathname;
      isPop.current = false;
    }
  }, [pathname]);

  return null;
}