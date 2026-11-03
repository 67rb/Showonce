"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Decision = "approved" | "changes requested";

export default function InstructorDemoPage() {
  const [isRevised, setIsRevised] = useState(false);
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

  function openRevisedSample() {
    setIsRevised(true);
    setFeedback("");
    setError("");
    setDecision(undefined);
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
          <p className="font-semibold">{isRevised ? "Revised learner evidence · scripted sample" : "Sample learner evidence"}</p>
          <p className="mt-1">{isRevised
            ? "I updated the worksheet. The elbow, tee and coupling are now labelled."
            : "I labelled the 90-degree elbow and the tee. The third fitting is still blank."}</p>
        </blockquote>
        <figure className="rounded-xl border border-site-border bg-site-page p-4">
          <figcaption className="font-semibold text-site-ink">
            {isRevised ? "Revised sample worksheet" : "Sample worksheet"}
            <span className="mt-1 block text-sm font-normal text-site-muted">
              {isRevised ? "All three fittings are labelled." : "The coupling label is left blank."}
            </span>
          </figcaption>
          <svg
            viewBox="0 0 640 240"
            role="img"
            aria-labelledby="sample-worksheet-title sample-worksheet-desc"
            className="mt-3 h-auto w-full"
            focusable="false"
          >
            <title id="sample-worksheet-title">
              {isRevised
                ? "Revised sample worksheet with elbow, tee and coupling labelled"
                : "Sample worksheet with elbow and tee labelled and coupling left blank"}
            </title>
            <desc id="sample-worksheet-desc">
              {isRevised
                ? "Schematic diagram of three pipe fittings in a row: a 90-degree elbow turning from horizontal to vertical, a tee with a downward branch, and a straight coupling joining two horizontal pipes. Labels below read Elbow, Tee and Coupling."
                : "Schematic diagram of three pipe fittings in a row: a 90-degree elbow turning from horizontal to vertical, a tee with a downward branch, and a straight coupling joining two horizontal pipes. Labels below read Elbow and Tee. The coupling has a dashed leader line to a blank dashed label line."}
            </desc>

            {/* Elbow */}
            <g fill="none" stroke="#242429" strokeWidth="20">
              <path d="M 32 68 H 92 Q 120 68 120 96 V 152" />
            </g>
            <g fill="none" stroke="#ffffff" strokeWidth="10">
              <path d="M 32 68 H 92 Q 120 68 120 96 V 152" />
            </g>
            <path d="M 82 55 V 81" stroke="#242429" strokeWidth="3" />
            <path d="M 107 118 H 133" stroke="#242429" strokeWidth="3" />

            {/* Tee */}
            <g fill="none" stroke="#242429" strokeWidth="20">
              <path d="M 232 68 H 408" />
              <path d="M 320 68 V 152" />
            </g>
            <g fill="none" stroke="#ffffff" strokeWidth="10">
              <path d="M 232 68 H 408" />
              <path d="M 320 68 V 152" />
            </g>
            <path d="M 286 55 V 81" stroke="#242429" strokeWidth="3" />
            <path d="M 354 55 V 81" stroke="#242429" strokeWidth="3" />
            <path d="M 307 102 H 333" stroke="#242429" strokeWidth="3" />

            {/* Coupling */}
            <g fill="none" stroke="#242429" strokeWidth="20">
              <path d="M 448 68 H 608" />
            </g>
            <g fill="none" stroke="#ffffff" strokeWidth="10">
              <path d="M 448 68 H 608" />
            </g>
            <rect x="498" y="52" width="60" height="32" rx="4" fill="#ffffff" stroke="#242429" strokeWidth="3" />
            <path d="M 513 52 V 84 M 543 52 V 84" stroke="#242429" strokeWidth="3" />

            {/* Leader lines and labels */}
            <path d="M 120 152 V 184" stroke="#71717a" strokeWidth="2" />
            <path d="M 320 152 V 184" stroke="#71717a" strokeWidth="2" />
            {isRevised ? (
              <path d="M 528 84 V 184" stroke="#71717a" strokeWidth="2" />
            ) : (
              <path d="M 528 84 V 184" stroke="#71717a" strokeWidth="2" strokeDasharray="6 5" />
            )}
            <text x="120" y="208" textAnchor="middle" fontSize="17" fontWeight="600" fill="#16161a">Elbow</text>
            <text x="320" y="208" textAnchor="middle" fontSize="17" fontWeight="600" fill="#16161a">Tee</text>
            {isRevised ? (
              <text x="528" y="208" textAnchor="middle" fontSize="17" fontWeight="600" fill="#16161a">Coupling</text>
            ) : (
              <line x1="478" y1="200" x2="578" y2="200" stroke="#71717a" strokeWidth="2" strokeDasharray="6 5" />
            )}
          </svg>
        </figure>
        {decision ? (
          <div className="space-y-3">
            <p ref={statusRef} role="status" tabIndex={-1} className="font-semibold">Demo decision: {decision}.</p>
            {feedback.trim() && <p className="break-words whitespace-pre-wrap">{feedback.trim()}</p>}
            <div className="flex flex-wrap gap-3">
              {decision === "changes requested" && !isRevised && (
                <button type="button" className="min-h-11 rounded-full bg-site-ink px-5 py-2 font-semibold text-white"
                  onClick={openRevisedSample}>Open revised sample</button>
              )}
              <button type="button" className="min-h-11 underline" onClick={() => {
                setIsRevised(false);
                setDecision(undefined);
                setFeedback("");
              }}>Reset sample review</button>
            </div>
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
