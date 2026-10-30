/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import s from "@/lib/strings";

// The Hobby face is the default UI at the existing routes; the Professional
// face lives under /professional. The face is read from the pathname only —
// never from a theme/dark class.
const PROFESSIONAL_PREFIX = "/professional";

export function ModeToggle({showDestination=false}:{showDestination?:boolean}) {
  const pathname = usePathname();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isProfessional =
    typeof pathname === "string" && pathname.startsWith(PROFESSIONAL_PREFIX);

  // Normalise the view-transition blend so the circle-spread reveals cleanly.
  // Same static override the installed Lightswind ToggleTheme ships; scoped to
  // this component's mount lifetime.
  useEffect(() => {
    let style = document.getElementById(
      "mode-toggle-vt-override",
    ) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "mode-toggle-vt-override";
      style.textContent = `
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      style?.parentNode?.removeChild(style);
    };
  }, []);

  const switchFace = useCallback(() => {
    const destination = isProfessional ? "/" : PROFESSIONAL_PREFIX;

    // Persist only the face the user is moving toward; never a theme/dark state.
    try {
      localStorage.setItem(
        "showonce-mode",
        isProfessional ? "hobby" : "professional",
      );
    } catch {
      /* storage unavailable — still navigate */
    }

    const navigate = () => router.push(destination);

    const reduced =
      typeof window !== "undefined" &&
      Boolean(
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      );
    const canAnimate =
      !reduced &&
      typeof document !== "undefined" &&
      typeof document.startViewTransition === "function";

    // Honest fallbacks: reduced motion or no View Transition API -> immediate
    // navigation, no spread.
    if (!canAnimate || !buttonRef.current) {
      navigate();
      return;
    }

    // Perform the navigation inside the View Transition so the incoming page is
    // captured as the "new" view, then spread from the button's centre.
    const origin = buttonRef.current.getBoundingClientRect();
    const transition = document.startViewTransition(() => {
      navigate();
    });

    transition.ready.then(() => {
      const { top, left, width, height } =
        origin;
      const x = left + width / 2;
      const y = top + height / 2;
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top),
      );
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    }).catch(() => {/* Navigation still succeeds if the browser skips the effect. */});
  }, [isProfessional, router]);

  const destinationLabel = isProfessional
    ? s.modeSwitchToHobby
    : s.modeSwitchToProfessional;

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-label="Professional mode"
      aria-checked={isProfessional}
      title={destinationLabel}
      onClick={switchFace}
      className={`relative isolate inline-flex h-11 shrink-0 items-center rounded-full border border-black/10 p-1 text-[11px] font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${showDestination ? "w-28" : "w-44 text-[12px]"} ${isProfessional ? "bg-green-50 focus-visible:ring-green-600" : "bg-amber-50 focus-visible:ring-amber-500"}`}
    >
      <span aria-hidden="true" className={`pointer-events-none absolute inset-y-1 left-1 -z-10 w-[calc(50%-4px)] rounded-full shadow-sm transition-[transform,background-color] duration-300 ease-in-out motion-reduce:transition-none ${isProfessional ? "translate-x-full bg-[#16A34A]" : "translate-x-0 bg-[#F59E0B]"}`} />
      <span aria-hidden="true" className={`flex-1 text-center transition-colors duration-200 ${isProfessional ? "text-[#526357]" : "text-[#16161A]"}`}>{s.modeHobby}</span>
      <span aria-hidden="true" className={`flex-1 text-center transition-colors duration-200 ${isProfessional ? "text-white" : "text-[#6b604a]"}`}>{showDestination ? "Pro" : s.modeProfessional}</span>
    </button>
  );
}
