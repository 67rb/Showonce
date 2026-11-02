/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { origamiSample } from "@/lib/sample";
import s from "@/lib/strings";

export const metadata: Metadata = { title: "SHOW ONCE · Sample complete" };

const primary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full bg-accent px-6 py-3 font-semibold text-[#16161A] transition hover:brightness-105";
const secondary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full border border-site-border-2 bg-white px-5 py-3 font-semibold text-site-ink";

export default function SampleCompletePage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-24 md:px-6">
      <div className="pt-6">
        <div className="border border-site-border bg-white p-4 text-sm text-site-ink" role="status">
          <strong>{s["fixture.banner"]}</strong>{" "}
          <span className="text-site-muted">{s["fixture.bannerSub"]}</span>
        </div>
        <h1 className="mt-8 font-body-ui text-[2rem] font-bold tracking-[-0.02em] text-site-ink">
          {s.completeHeading}
        </h1>
        <p className="mt-3 font-body-ui text-body text-site-muted">
          {origamiSample.title} · {origamiSample.steps.length} steps — this preview saves nothing.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className={primary} href="/lesson/sample">
            Back to the sample overview
          </a>
          <a className={secondary} href="/lesson/sample/play">
            Open the sample player
          </a>
        </div>
      </div>
    </div>
  );
}
