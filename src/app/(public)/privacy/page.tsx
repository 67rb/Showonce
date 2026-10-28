import s from "@/lib/strings";
import { SerifAccent } from "@/components/Reveal";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
        <SerifAccent text={s.privacyPageHeading} />
      </h1>

      {/* the claim with poster emphasis — soft amber tint band */}
      <div className="mt-5 rounded-[24px] border border-[#F59E0B]/30 bg-[#F59E0B]/[0.12] px-5 py-4">
        <p className="font-body-ui text-body font-semibold text-accent-deep">
          {s.privacyClaim}
        </p>
      </div>

      {/* readable headed sections, hairline-separated */}
      <div className="mt-8">
        {s.privacySections.map((sec, i) => (
          <section
            key={sec.heading}
            className={
              i > 0 ? "mt-8 border-t border-site-border pt-8" : ""
            }
          >
            <h2 className="font-display-ui text-[1.5rem] font-bold leading-heading text-site-ink">
              {sec.heading}
            </h2>
            <p className="font-body-ui mt-2 text-body leading-relaxed text-site-muted">
              {sec.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}