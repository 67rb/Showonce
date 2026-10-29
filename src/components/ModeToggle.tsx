"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconBlocks, IconBriefcase } from "@tabler/icons-react";
import s from "@/lib/strings";

// The Hobby face is the default UI at the existing routes; the Professional
// face lives under /professional. The face is read from the pathname only —
// never from a theme/dark class.
const PROFESSIONAL_PREFIX = "/professional";

export function ModeToggle() {
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
    const transition = document.startViewTransition(() => {
      navigate();
    });

    transition.ready.then(() => {
      const { top, left, width, height } =
        buttonRef.current!.getBoundingClientRect();
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
    });
  }, [isProfessional, router]);

  // The label names the CURRENT face; the aria-label names the DESTINATION.
  const currentLabel = isProfessional ? s.modeProfessional : s.modeHobby;
  const destinationLabel = isProfessional
    ? s.modeSwitchToHobby
    : s.modeSwitchToProfessional;
  const Icon = isProfessional ? IconBlocks : IconBriefcase;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        ref={buttonRef}
        type="button"
        onClick={switchFace}
        aria-label={destinationLabel}
        title={destinationLabel}
        className={`grid h-9 w-9 place-items-center rounded-full border border-site-border bg-white text-[#16161A] transition-colors duration-150 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isProfessional
            ? "focus-visible:ring-[#16A34A]"
            : "focus-visible:ring-[#F59E0B]"
        }`}
      >
        <Icon
          className="h-[18px] w-[18px]"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      <span className="hidden text-[13px] font-semibold text-[#16161A] xl:inline">
        {currentLabel}
      </span>
    </div>
  );
}