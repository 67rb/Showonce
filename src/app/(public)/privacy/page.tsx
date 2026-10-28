import s from "@/lib/strings";
import { Reveal, RevealGroup } from "@/components/Reveal";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <RevealGroup>
        <Reveal>
          <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight text-site-ink">
            {s.privacyPageHeading}
          </h1>
          <p className="font-body-ui mt-3 text-body font-medium text-accent-deep">{s.privacyClaim}</p>
        </Reveal>
      </RevealGroup>
      <div className="mt-8 space-y-8">
        {s.privacySections.map((sec) => (
          <section key={sec.heading}>
            <h2 className="font-display-ui text-h2 text-[1.5rem] font-bold leading-heading text-site-ink">
              {sec.heading}
            </h2>
            <p className="font-body-ui mt-2 text-body text-site-muted">{sec.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}