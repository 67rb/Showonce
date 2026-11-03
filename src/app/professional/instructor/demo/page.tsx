"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Decision = "approved" | "changes requested";

export default function InstructorDemoPage() {
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState<Decision>();
  const [error, setError] = useState("");

  const statusRef = useRef<HTMLParagraphElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const previousDecision = useRef(decision);

  useEffect(() => {
    if (previousDecision.current === decision) return;
    previousDecision.current = decision;
    if (decision) statusRef.current?.focus();
    else feedbackRef.current?.focus();
  }, [decision]);

  function review(next: Decision) {
    if (next === "changes requested" && !feedback.trim()) {
      setError("Add feedback so the learner knows what to change.");
      return;
    }
    setError("");
    setDecision(next);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-16">
      <header>
        <p className="pro-kicker">ShowOnce Professional · Public demo</p>
        <h1 className="mt-3 text-4xl font-bold text-site-ink">Try the instructor desk</h1>
        <p className="mt-3 text-site-muted">
          Review a sample submission and decide what happens next. No sign-in is needed.
          Your decision stays on this page and resets when you reload.
        </p>
      </header>
      <section aria-labelledby="sample-title" className="space-y-4 rounded-2xl border border-site-border bg-white p-5 sm:p-8">
        <p className="pro-kicker">Sample learner · Classroom plumbing</p>
        <h2 id="sample-title" className="text-2xl font-bold text-site-ink">Identify fittings on a worksheet</h2>
        <p><strong>Criterion:</strong> Label the elbow, tee and coupling on a classroom diagram.</p>
        <blockquote className="rounded-xl bg-site-page p-4">
          <p className="font-semibold">Sample learner evidence</p>
          <p className="mt-1">I labelled the 90-degree elbow and the tee. The third fitting is still blank.</p>
        </blockquote>
        {decision ? (
          <div className="space-y-3">
            <p ref={statusRef} role="status" tabIndex={-1} className="font-semibold">Demo decision: {decision}.</p>
            {feedback.trim() && <p className="break-words whitespace-pre-wrap">{feedback.trim()}</p>}
            <button type="button" className="min-h-11 underline" onClick={() => {
              setDecision(undefined);
              setFeedback("");
            }}>Reset sample review</button>
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor="demo-feedback" className="block font-semibold">Feedback to the learner</label>
            <textarea ref={feedbackRef} id="demo-feedback" rows={3} maxLength={500} value={feedback}
              aria-describedby={error ? "demo-feedback-error" : undefined}
              onChange={(event) => { setFeedback(event.target.value); setError(""); }}
              className="block w-full rounded-xl border border-site-border p-3"
              placeholder="For example, label the coupling before resubmitting." />
            {error && <p id="demo-feedback-error" role="alert">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" className="min-h-11 rounded-full bg-site-ink px-5 py-2 font-semibold text-white"
                onClick={() => review("approved")}>Approve sample work</button>
              <button type="button" className="min-h-11 rounded-full border border-site-border px-5 py-2 font-semibold"
                onClick={() => review("changes requested")}>Request changes</button>
            </div>
          </div>
        )}
      </section>
      <Link href="/professional/lesson/sample/" className="inline-flex min-h-11 items-center underline">Try the free learner sample</Link>
    </div>
  );
}
