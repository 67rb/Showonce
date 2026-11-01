/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import s from "@/lib/strings";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: `SHOW ONCE · Professional · ${s.privacyPageHeading}`,
  description: "How professional learning data and photos are used",
};

export default function ProfessionalPrivacyPage() {
  return (
    // 5.6 — text pages: readable single column, max-w-[720px], 16px sides on
    // mobile, centred on desktop, left-aligned text.
    <>
      <div className="mx-auto w-full max-w-[720px] px-4 py-16">
      <header>
        <h1 className="font-body-ui text-[2.5rem] font-bold tracking-[-0.02em] text-site-ink">
          {s.privacyPageHeading}
        </h1>
        <div
          aria-hidden
          className="mt-3 h-1 w-14 rounded-full bg-[#16A34A]"
        />
      </header>

      {/* the claim — privacy statement in a green band */}
      <div className="mt-8 rounded-[20px] border border-[#16A34A]/30 bg-[#16A34A]/[0.10] px-6 py-6 text-center">
        <p className="font-body-ui text-[1.5rem] font-bold tracking-[-0.01em] text-[#15803D]">
          Private practice. Clear control.
        </p>
      </div>

      {/* sections — readable, hairline-separated (reused shared privacy copy) */}
      <div className="mt-8">
        {[
          {heading:'Saved learning requests',body:'Your learning goal, tutorial link and optional input photo are saved privately with your account. You can delete an input photo from your learning request.'},
          {heading:'Practice and camera',body:'Live camera preview and still comparison remain on your device. An explicit live AI check sends the selected picture to Meta and retains feedback, not the picture. The separate Check my work flow stores private photo history, with deletion controls.'},
          {heading:'AI services',body:'AI processing occurs only after the labelled action. Your goal, imported tutorial content and selected photo may be sent to the configured provider. Provider processing and retention follow its own terms. No provider API key is sent to the browser.'},
          {heading:'Instructor review',body:'Authorized instructors can see course review requests, learner names, progress and review notes. Classroom approval is separate from learner self-review and AI feedback. It is not a professional licence or safety certification.'}
        ].map((sec, i) => (
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
    <PublicFooter />
    </>
  );
}