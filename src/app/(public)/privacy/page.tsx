import s from "@/lib/strings";
import { SerifAccent } from "@/components/Reveal";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <header className="text-center">
        <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
          <SerifAccent text={s.privacyPageHeading} />
        </h1>
        <div
          aria-hidden
          className="mx-auto mt-3 h-1 w-14 rounded-full bg-accent"
        />
      </header>

      {/* the claim — a soft amber statement */}
      <div className="mt-8 rounded-[20px] border border-[#F59E0B]/30 bg-[#F59E0B]/[0.10] px-6 py-6 text-center">
        <p className="font-display-ui text-[1.5rem] font-bold leading-snug text-accent-deep">
          <span className="font-serif-accent">{s.privacyClaim}</span>
        </p>
      </div>

      {/* sections — readable, hairline-separated */}
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