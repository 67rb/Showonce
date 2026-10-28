import s from "@/lib/strings";
import Link from "next/link";
import { SerifAccent } from "@/components/Reveal";

type CreateState = "default" | "invalid" | "failed" | "not-configured";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const mode = (state as CreateState) || "default";

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
        <SerifAccent text={s.createHeading} />
      </h1>
      <p className="mt-2 font-body-ui text-body leading-relaxed text-site-muted">
        {s.createScopeNote}
      </p>

      {/* STATE BANDS (state region swapped) */}
      {mode === "failed" && (
        <div className="mt-5 rounded-[20px] border border-[#E5484D]/30 bg-[#E5484D]/[0.10] p-4">
          <p className="font-body-ui text-body font-medium text-site-ink">
            {s.importErrorFailed}
          </p>
          <Link
            href="/create/processing"
            className="mt-1 inline-block font-body-ui text-small font-medium text-danger underline-offset-4 hover:underline"
          >
            {s.createGetSteps}
          </Link>
        </div>
      )}
      {mode === "not-configured" && (
        <div className="mt-5 rounded-[20px] border border-[#F59E0B]/30 bg-[#F59E0B]/[0.12] p-4">
          <p className="font-body-ui text-body font-medium text-site-ink">
            {s.importErrorNotConfigured}
          </p>
        </div>
      )}

      {/* LINK FIELD — the hero of the screen */}
      <div
        className={
          "mt-6 rounded-[20px] border bg-white " +
          (mode === "invalid" ? "border-danger" : "border-site-border")
        }
      >
        <div className="p-4">
          <input
            type="text"
            name="link"
            placeholder={s.importLinkPlaceholder}
            aria-label={s.importFieldLabel}
            className="w-full bg-transparent font-body-ui text-body text-site-ink placeholder:text-site-muted focus:outline-none"
          />
          <p className="mt-1 font-body-ui text-caption text-site-muted">
            {s.importFieldLabel}
          </p>
          {mode === "invalid" && (
            <p className="mt-1 font-body-ui text-small font-medium text-danger">
              {s.importErrorInvalid}
            </p>
          )}
        </div>
      </div>

      {/* primary action */}
      <Link
        href="/create/processing"
        className="mt-4 block rounded-full bg-[#16161A] px-5 py-3 text-center font-body-ui text-body font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
      >
        {s.createGetSteps}
      </Link>

      {/* hairline divider — the "or" is conveyed by the upload line below */}
      <div aria-hidden className="mt-6 h-px w-full bg-site-border" />

      {/* UPLOAD alternative — dashed surface, clearly secondary */}
      <div className="mt-6 rounded-[20px] border border-dashed border-site-border-2 bg-white px-4 py-8 text-center">
        <p className="font-body-ui text-small text-site-muted">
          {s.uploadPrompt}
        </p>
        <button
          type="button"
          className="mt-4 block w-full rounded-full border border-site-border-2 bg-white px-5 py-3 text-center font-body-ui text-body font-semibold text-site-ink transition-colors duration-[150ms] hover:bg-site-page"
        >
          {s.uploadButton}
        </button>
      </div>

      {/* privacy line */}
      <p className="mt-6 text-center font-body-ui text-caption text-site-muted">
        {s.privacyClaim}
      </p>
    </div>
  );
}