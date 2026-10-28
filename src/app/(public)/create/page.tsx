import s from "@/lib/strings";
import Link from "next/link";
import { SerifAccent } from "@/components/Reveal";
import { BorderBeam } from "@/components/lightswind/border-beam";
import { Magnetic } from "@/components/Magnetic";
import { SatinBackdrop } from "@/components/create/SatinBackdrop";

type CreateState = "default" | "invalid" | "failed" | "not-configured";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const mode = (state as CreateState) || "default";

  return (
    <div className="-mt-24 relative min-h-[100svh] overflow-hidden">
      {/* living cinematic amber backdrop */}
      <SatinBackdrop />
      {/* readability veil — keeps text legible over the moving satin */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(18,10,2,0.28),rgba(8,4,1,0.62)_78%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-32 pb-16">
        {/* header — centred hero */}
        <header className="text-center">
          <h1 className="font-display-ui text-[2.75rem] font-extrabold leading-tight tracking-tight text-white">
            <SerifAccent text={s.createHeading} />
          </h1>
          <p className="mx-auto mt-3 max-w-[320px] font-body-ui text-body font-semibold leading-relaxed text-white/90">
            {s.createScopeNote}
          </p>
        </header>

        {/* STATE BANDS (state region swapped) */}
        {mode === "failed" && (
          <div className="mt-7 flex items-start gap-3 rounded-[20px] border border-danger/40 bg-danger/15 p-4 backdrop-blur-md">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/30 text-danger"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </span>
            <div>
              <p className="font-body-ui text-body font-medium text-white/90">
                {s.importErrorFailed}
              </p>
              <Link
                href="/create/processing"
                className="mt-1 inline-block font-body-ui text-small font-medium text-amber-300 underline-offset-4 hover:underline"
              >
                {s.createGetSteps}
              </Link>
            </div>
          </div>
        )}
        {mode === "not-configured" && (
          <div className="mt-7 flex items-start gap-3 rounded-[20px] border border-amber-300/30 bg-amber-300/10 p-4 backdrop-blur-md">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-amber-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" fill="none" />
                <path d="M12 8v4" />
              </svg>
            </span>
            <p className="font-body-ui text-body font-medium text-white/90">
              {s.importErrorNotConfigured}
            </p>
          </div>
        )}

        {/* LINK FIELD — the hero, glass on satin, ringed by an amber beam */}
        <div className="relative mt-9">
          <div className="relative overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.07] p-5 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-shadow duration-[150ms] focus-within:shadow-[0_30px_90px_-20px_rgba(245,158,11,0.55)]">
            <BorderBeam
              aria-hidden
              size={70}
              duration={5}
              colorFrom="#F59E0B"
              colorTo="#fff3d6"
              opacity={0.7}
              beamBorderRadius={24}
            />
            <div className="relative flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                  <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                </svg>
              </span>
              <input
                type="text"
                name="link"
                placeholder={s.importLinkPlaceholder}
                aria-label={s.importFieldLabel}
                className="w-full bg-transparent font-body-ui text-[1.0625rem] text-white caret-amber-300 placeholder:text-white/40 focus:outline-none"
              />
            </div>
            <div className="relative mt-3">
              <p className="font-body-ui text-caption uppercase tracking-[0.14em] text-white/50">
                {s.importFieldLabel}
              </p>
            </div>
            {mode === "invalid" && (
              <p className="relative mt-2 flex items-center gap-1.5 font-body-ui text-small font-medium text-danger">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                {s.importErrorInvalid}
              </p>
            )}
          </div>
        </div>

        {/* primary action — big amber glow pill, magnetic */}
        <Magnetic className="mt-6 w-full">
          <Link
            href="/create/processing"
            className="btn-shine block rounded-full bg-accent px-6 py-3.5 text-center font-body-ui text-body font-semibold text-[#16161A] shadow-[0_16px_44px_-12px_rgba(245,158,11,0.8)] transition-all duration-[150ms] hover:brightness-105"
          >
            {s.createGetSteps}
          </Link>
        </Magnetic>

        {/* divider */}
        <div
          aria-hidden
          className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* UPLOAD alternative — glass dashed surface */}
        <div className="group mt-6 rounded-[24px] border-2 border-dashed border-white/20 bg-white/[0.04] px-6 py-9 text-center backdrop-blur-sm transition-colors duration-[150ms] hover:border-amber-300/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-amber-300 transition-transform duration-[150ms] group-hover:-translate-y-0.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="m6 10 6-6 6 6" />
              <path d="M4 20h16" />
            </svg>
          </div>
          <p className="mt-3 font-body-ui text-small text-white/60">
            {s.uploadPrompt}
          </p>
          <button
            type="button"
            className="btn-shine mt-4 block w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-center font-body-ui text-body font-semibold text-white transition-colors duration-[150ms] hover:bg-white/15"
          >
            {s.uploadButton}
          </button>
        </div>

        {/* privacy line */}
        <p className="mt-6 text-center font-body-ui text-caption text-white/50">
          {s.privacyClaim}
        </p>
      </div>
    </div>
  );
}