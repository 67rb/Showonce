import type { Metadata } from "next";
import s from "@/lib/strings";
import { SerifAccent } from "@/components/Reveal";

export const metadata: Metadata = {
  title: `SHOW ONCE · Professional · ${s.privacyPageHeading}`,
  description: s.privacyClaim,
};

export default function ProfessionalPrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <header className="text-center">
        <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
          <SerifAccent text={s.privacyPageHeading} />
        </h1>
        <div
          aria-hidden
          className="mx-auto mt-3 h-1 w-14 rounded-full bg-[#16A34A]"
        />
      </header>

      {/* the claim — the restored "checks photos, keeps nothing." in a green band */}
      <div className="mt-8 rounded-[20px] border border-[#16A34A]/30 bg-[#16A34A]/[0.10] px-6 py-6 text-center">
        <p className="font-display-ui text-[1.5rem] font-bold leading-snug text-[#15803D]">
          <span className="font-serif-accent">{s.privacyClaim}</span>
        </p>
      </div>

      {/* sections — readable, hairline-separated (reused shared privacy copy) */}
      <div className="mt-8">
        {s.privacySections.map((sec, i) => (
          <section
            key={sec.heading}
            className={i > 0 ? "mt-8 border-t border-site-border pt-8" : ""}
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