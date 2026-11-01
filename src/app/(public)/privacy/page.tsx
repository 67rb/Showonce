/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import s from "@/lib/strings";

export default function PrivacyPage() {
  return (
    // 5.6 — text pages: readable single column, max-w-[720px], 16px sides on
    // mobile, centred on desktop, left-aligned text.
    <div className="mx-auto w-full max-w-[720px] px-4 py-16">
      <header>
        <h1 className="font-body-ui text-[2.5rem] font-bold tracking-[-0.02em] text-site-ink">
          {s.privacyPageHeading}
        </h1>
        <div
          aria-hidden
          className="mt-3 h-1 w-14 rounded-full bg-accent"
        />
      </header>

      {/* the claim — a soft amber statement */}
      <div className="mt-8 rounded-[20px] border border-[#F59E0B]/30 bg-[#F59E0B]/[0.10] px-6 py-6 text-center">
        <p className="font-body-ui text-[1.5rem] font-bold tracking-[-0.01em] text-accent-deep">
          {s.privacyClaim}
        </p>
      </div>

      {/* sections — readable, hairline-separated */}
      <div className="mt-8">
        {s.privacySections.map((sec, i) => (
          <section
            key={sec.heading}
            className={i > 0 ? "mt-8 border-t border-site-border pt-8" : ""}
          >
            <h2 className="font-body-ui text-[1.5rem] font-bold tracking-[-0.01em] text-site-ink">
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