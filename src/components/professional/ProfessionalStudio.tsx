/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AccountBar, useIdentity } from "@/components/learning/Identity";
import { EvidenceJournal, PrivateWorkPhoto } from "./EvidenceJournal";
import { AiAllowance } from "@/components/learning/AiAllowance";
import { EmptyState } from "@/components/EmptyState";

import { aiChecksAvailable, photoData, type Entry } from "@/lib/learning";
import s from "@/lib/strings";

const primary =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[#16A34A] px-5 py-3 text-small font-semibold text-white transition hover:bg-[#15803D] disabled:bg-[#E5E5E5] disabled:text-[#71717A] disabled:opacity-100";
const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-site-border bg-white px-5 py-3 text-small font-semibold text-site-ink transition hover:border-[#16A34A] disabled:bg-[#E5E5E5] disabled:text-[#71717A] disabled:opacity-100";
const field =
  "mt-2 w-full min-w-0 rounded-xl border border-site-border bg-white px-4 py-3 text-site-ink placeholder:text-site-muted focus:outline focus:outline-2 focus:outline-[#16A34A]";
const statusName = (value: string) =>
  ({
    learning: "Practice in progress",
    pending_review: "Waiting for instructor review",
    changes_requested: "Instructor requested changes",
    instructor_approved: "Classroom practice reviewed by instructor",
  })[value] || value;
type Course = {
  id: string;
  title: string;
  trade: string;
  level: string;
  content_status: string;
  description: string;
  prerequisites: string[];
  lessons: { id: string; title: string; steps: number }[];
};
type Enrollment = {
  id: string;
  status: string;
  version: number;
  learner_name?: string;
  practice_complete: boolean;
  evidence_count?: number;
  evidence_shared?: boolean;
  course: Course;
  lessons: {
    id: string;
    title: string;
    completed_steps: number;
    total_steps: number;
    session_id: string | null;
  }[];
  reviews: { decision: string; notes: string }[];
};
type LearningRequest = {
  id: string;
  goal: string;
  trade?: string;
  experience_level?: string;
  success_criteria?: string;
  source_url: string | null;
  has_photo: boolean;
  status: string;
  href: string | null;
};
type Assignment = {
  id: string;
  enrollment_id: string;
  learner_name?: string | null;
  brief: { title: string; outcome: string; materials: string[] };
  criteria: {
    id: string;
    label: string;
    required: boolean;
    latest_decision: { decision: string; notes: string } | null;
  }[];
  preparation: { id: string; label: string; done: boolean }[];
  status: string;
  version: number;
  practice_complete: boolean;
  decisions?: {
    id: string;
    criterion_id: string;
    decision: string;
    notes: string;
  }[];
};
function Panel({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={
        "relative rounded-[16px] border border-site-border bg-white p-4 lg:p-6 " +
        className
      }
    >
      {children}
    </section>
  );
}
export function ProfessionalStudio({
  view = "create",
}: {
  view?: "create" | "library" | "instructor";
}) {
  /* 5.2 — the studio shows a real loading state: skeleton blocks matching its
    own layout, not a lone pill sentence. The account check resolves within 8s
    or the signed-out page renders with the timeout notice (Identity). */
  const identity = useIdentity();
  if (!identity.ready) {
    const label =
      view === "create"
        ? s.loadingCreate
        : view === "instructor"
          ? s.loadingPractice
          : s.loadingLibrary;
    return (
      <div
        className={
          "professional-studio mx-auto w-full px-4 pt-6 pb-24 md:px-6 lg:px-8 lg:pt-10 " +
          (view === "instructor"
            ? "max-w-[720px]"
            : "max-w-[640px] lg:max-w-[1120px]")
        }
        role="status"
        aria-label={label}
      >
        <div className="h-10 w-2/3 rounded-xl bg-site-border" />
        <div className="h-5 mt-2 w-1/3 rounded bg-site-border" />
        <div className="h-24 mt-5 rounded-[16px] border border-site-border bg-white" />
        <div className="h-24 mt-3 rounded-[16px] border border-site-border bg-white" />
      </div>
    );
  }
  return <StudioBody key={identity.account?.user?.id || "guest"} view={view} />;
}
function StudioBody({ view }: { view: "create" | "library" | "instructor" }) {
  const identity = useIdentity(),
    [courses, setCourses] = useState<Course[]>([]),
    [enrollments, setEnrollments] = useState<Enrollment[]>([]),
    [requests, setRequests] = useState<LearningRequest[]>([]),
    [queue, setQueue] = useState<Enrollment[]>([]),
    [assignments, setAssignments] = useState<Assignment[]>([]),
    [entries, setEntries] = useState<Entry[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [trade, setTrade] = useState(""),
    [confirmAll, setConfirmAll] = useState(false);
  const active = useRef(true),
    inFlight = useRef(false),
    life = useRef<AbortController | null>(null),
    signedIn = !!identity.account?.authenticated;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "instructor") {
        if (identity.account?.is_admin) {
          const result = await identity.request<{ enrollments: Enrollment[] }>(
            "/v1/professional/review-queue",
            undefined,
            { signal: life.current?.signal },
          );
          if (active.current) setQueue(result.enrollments);
          const assigned = await identity
            .request<{ assignments: Assignment[] }>(
              "/v1/professional/assignments",
              undefined,
              { signal: life.current?.signal },
            )
            .catch(() => ({ assignments: [] as Assignment[] }));
          if (active.current) setAssignments(assigned.assignments);
        }
      } else {
        const [catalogue, progress, saved, library, assigned] =
          await Promise.all([
            identity.request<{ courses: Course[] }>(
              "/v1/professional/courses",
              undefined,
              { signal: life.current?.signal },
            ),
            signedIn
              ? identity.request<{ enrollments: Enrollment[] }>(
                  "/v1/professional/enrollments",
                  undefined,
                  { signal: life.current?.signal },
                )
              : Promise.resolve({ enrollments: [] }),
            signedIn
              ? identity.request<{ requests: LearningRequest[] }>(
                  "/v1/professional/requests",
                  undefined,
                  { signal: life.current?.signal },
                )
              : Promise.resolve({ requests: [] }),
            signedIn
              ? identity.request<{ entries: Entry[] }>(
                  "/v1/library",
                  undefined,
                  { signal: life.current?.signal },
                )
              : Promise.resolve({ entries: [] }),
            signedIn
              ? identity
                  .request<{ assignments: Assignment[] }>(
                    "/v1/professional/assignments",
                    undefined,
                    { signal: life.current?.signal },
                  )
                  .catch(() => ({ assignments: [] as Assignment[] }))
              : Promise.resolve({ assignments: [] as Assignment[] }),
          ]);
        if (active.current) {
          setCourses(catalogue.courses);
          setEnrollments(progress.enrollments);
          setRequests(saved.requests);
          setEntries(library.entries);
          setAssignments(assigned.assignments);
        }
      }
    } finally {
      if (active.current) setLoading(false);
    }
  }, [identity.request, identity.account?.is_admin, signedIn, view]);
  useEffect(() => {
    active.current = true;
    life.current = new AbortController();
    void load().catch((e) => {
      if (active.current)
        setError(e instanceof Error ? e.message : "Could not load saved data.");
    });
    return () => {
      active.current = false;
      life.current?.abort();
    };
  }, [load]);
  // Saved cards arrive after navigation; wait for that data before following
  // a brief fragment instead of leaving the learner at the empty create form.
  useEffect(() => {
    if (view !== "create" || loading) return;
    let id: string;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    if (id.startsWith("brief-"))
      document.getElementById(id)?.scrollIntoView?.({ block: "start" });
  }, [view, loading, requests]);
  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      if (active.current)
        setError(
          e instanceof Error
            ? e.message
            : "Could not complete that action. Refresh saved data before retrying.",
        );
    } finally {
      inFlight.current = false;
      if (active.current) setBusy(false);
    }
  }
  const post = <T,>(path: string, body: unknown, key?: string) =>
    identity.request<T>(path, body, { key, signal: life.current?.signal });
  const start = async (entry: Enrollment, lessonID: string) => {
    const value = await post<{ href: string }>(
      "/v1/professional/enrollments/" + entry.id + "/start",
      { lesson_id: lessonID },
    );
    if (active.current) window.location.assign(value.href);
  };
  const shown = courses.filter(
    (item) =>
      (!trade || item.trade === trade) &&
      (item.title + " " + item.trade)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const inTraining = enrollments.filter((e) => e.status === "learning").length,
    actionNeeded = enrollments.filter(
      (e) => e.status === "changes_requested",
    ).length,
    awaiting = enrollments.filter((e) => e.status === "pending_review").length,
    reviewed = enrollments.filter(
      (e) => e.status === "instructor_approved",
    ).length;
  /* 5.5 — containers: text pages readable single column max-w-[720px]; tool
    pages max-w-[640px] on tablet, max-w-[1120px] on desktop; 16/24/32px sides;
    24px/40px page-top padding. */
  return (
    <div
      className={
        "professional-studio mx-auto w-full px-4 pt-6 pb-24 md:px-6 lg:px-8 lg:pt-10 " +
        (view === "instructor"
          ? "max-w-[720px]"
          : "max-w-[640px] lg:max-w-[1120px]")
      }
    >
      {/* 5.3 (L12) — the title block spans the full header width; the scope tag
          becomes the meta line under the H1 instead of a competing right
          column that squeezed the H1 on /professional/instructor. */}
      <header className="pro-workspace-heading">
        <p className="pro-kicker">
          SHOW ONCE / PROFESSIONAL · TRAINING WORKSPACE
        </p>
        <h1 className="mt-3 font-body-ui text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-tight tracking-tight text-site-ink">
          {view === "create"
            ? "Build your training brief."
            : view === "instructor"
              ? "Instructor review desk."
              : "Your training hub."}
        </h1>
        <p className="mt-4 max-w-[672px] text-body text-site-muted">
          {view === "create"
            ? "Set a trade, define the outcome and bring a reference or work photo."
            : view === "instructor"
              ? "Review completed practice, shared evidence and the learner’s next steps."
              : "Continue a trade course, record work evidence and prepare for instructor review."}
        </p>
        <span className="pro-scope-tag mt-3 self-start">CLASSROOM / DISCONNECTED TRAINING</span>
      </header>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-site-ink"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-2xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4 text-site-ink"
        >
          {notice}
        </p>
      )}
      {view === "library" &&
        !loading &&
        (signedIn ||
          inTraining > 0 ||
          actionNeeded > 0 ||
          awaiting > 0 ||
          reviewed > 0) && (
          <div className="pro-stat-grid">
            {[
              ["In training", inTraining],
              ["Action needed", actionNeeded],
              ["Awaiting review", awaiting],
              ["Reviewed", reviewed],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="pro-kicker">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      {/* 5.3 (L7) — the sign-in gate notice is a page-level banner ABOVE the
          form card (full container width, amber notice styling), no longer a
          header inside the form card. */}
      {view === "create" && !signedIn && (
        <div className="mb-5 rounded-[16px] border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4">
          <p className="text-small text-site-ink">
            {identity.account?.sign_in_url
              ? s["proCreate.signInGateNoticeAvailable"]
              : s["proCreate.signInGateNotice"]}
          </p>
          <a
            className="mt-2 inline-block text-small font-semibold text-[#15803D] underline"
            href={identity.account?.sign_in_url || "/professional/lessons"}
          >
            {identity.account?.sign_in_url
              ? "Sign in with GitHub"
              : s["proCreate.trainingHubLink"]}
          </a>
        </div>
      )}
      {view === "create" && (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-start lg:gap-8">
          <div className="lg:max-w-[640px]">
            <RequestForm
              busy={busy}
              signedIn={signedIn}
              run={run}
              save={async (body, key) => {
                await post("/v1/professional/requests", body, key);
                if (active.current)
                  setNotice(
                    "Saved privately. No AI call was made. Your photo has not been analyzed yet.",
                  );
                await load();
              }}
            />
          </div>
          <aside className="mt-10 space-y-5 lg:sticky lg:top-[112px] lg:mt-0 lg:w-[320px]">
            <div className="rounded-[16px] border border-site-border bg-white p-5">
              <p className="pro-kicker">WHAT HAPPENS NEXT</p>
              <p className="mt-3 text-small text-site-ink">
                1. Build brief · 2. Practise · 3. Instructor review
              </p>
            </div>
            {/* 5.3 (L7) — the briefs rail becomes a proper card with the shared
                empty-state anatomy (heading, one line, action slot); the brief
                cards render inside it, no duplicated list. */}
            <div className="rounded-[16px] border border-site-border bg-white">
              <h2 className="border-b border-site-border px-4 py-3 font-body-ui text-lg font-bold text-site-ink lg:px-5">
                Saved training briefs
              </h2>
              {!loading && !requests.length ? (
                <EmptyState
                  line={
                    signedIn
                      ? "No learning requests saved yet."
                      : s.signInWorkspaceLine
                  }
                >
                  <a className={secondary} href="/professional/create/">
                    {s.proNavBrief}
                  </a>
                </EmptyState>
              ) : (
                <div className="space-y-4 p-4 lg:p-5">
                  {requests.map((item) => (
                    <RequestCard
                      key={item.id}
                      item={item}
                      busy={busy}
                      aiReady={aiChecksAvailable(identity.config)}
                      run={run}
                      generate={async () => {
                        const value = await post<{ message?: string }>(
                          "/v1/professional/requests/" + item.id + "/plan",
                          { ai_consent: true },
                        );
                        if (active.current)
                          setNotice(
                            value.message || "Your AI-suggested practice is ready.",
                          );
                        await load();
                      }}
                      remove={async () => {
                        await identity.request(
                          "/v1/professional/requests/" + item.id + "/photo",
                          undefined,
                          { method: "DELETE", signal: life.current?.signal },
                        );
                        await load();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
      <div className="my-6 flex items-center justify-between gap-3">
        <p className="text-small text-site-muted" role="status">
          {loading ? "Loading saved learning…" : "Saved progress and requests"}
        </p>
        <button
          className={secondary}
          disabled={busy || loading}
          onClick={() => void run(load)}
        >
          Refresh saved data · free
        </button>
      </div>
      {view === "library" && (
        <div className="pro-hub-sections">
          {/* 5.3 (L8a) — order: Next action FIRST, then saved progress + saved
              briefs in one grid, then Trade courses. Every group is a card. */}
          <section className="pro-active-training scroll-mt-28 mt-8">
            <Panel>
              <div>
                <p className="pro-kicker">YOUR NEXT ACTION</p>
                <h2 className="mt-2 font-body-ui text-2xl font-bold text-site-ink">
                  Active training
                </h2>
              </div>
              {!loading && !enrollments.length && (
                <EmptyState line="Enroll in a course to begin.">
                  <a className={secondary} href="/professional/create/">
                    {s.proNavBrief}
                  </a>
                </EmptyState>
              )}
              {enrollments.map((entry) => (
                <EnrollmentCard
                  key={entry.id}
                  entry={entry}
                  assignment={
                    assignments.find((item) => item.enrollment_id === entry.id) ||
                    null
                  }
                  busy={busy}
                  start={(id) => void run(() => start(entry, id))}
                  refresh={load}
                  run={run}
                  review={(share) =>
                    void run(async () => {
                      await post(
                        "/v1/professional/enrollments/" +
                          entry.id +
                          "/request-review",
                        {
                          expected_version: entry.version,
                          share_evidence: share,
                        },
                      );
                      await load();
                    })
                  }
                />
              ))}
            </Panel>
          </section>
          <div className="mt-8 grid gap-3 lg:grid-cols-2 lg:gap-5">
            <section className="pro-saved-sessions scroll-mt-28 space-y-3">
              <Panel className="h-full">
                <h2 className="font-body-ui text-2xl font-bold text-site-ink">
                  Saved practice sessions
                </h2>
                {!loading && !entries.length && (
                  <EmptyState line="No saved practice sessions yet." />
                )}
                {entries.map((entry) => (
                  <a
                    key={entry.id}
                    href={
                      "/professional/lesson/runtime/play/?" +
                      new URLSearchParams({
                        lesson_id: entry.lesson_id,
                        session_id: entry.id,
                      })
                    }
                    className="group flex items-center justify-between gap-4 border-b border-site-border py-5 text-site-ink transition last:border-b-0 hover:text-[#16A34A]"
                  >
                    <div className="min-w-0">
                      <h3 className="break-words font-body-ui text-xl font-semibold">
                        {entry.title}
                      </h3>
                      <p className="mt-2 text-small text-site-muted">
                        {entry.completed_steps}/{entry.total_steps} practice
                        checkpoints
                      </p>
                    </div>
                    <span aria-hidden>→</span>
                  </a>
                ))}
              </Panel>
            </section>
            <section className="pro-saved-briefs scroll-mt-28 space-y-3">
              <Panel className="h-full">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-body-ui text-2xl font-bold text-site-ink">
                    Saved training briefs
                  </h2>
                  <a className={secondary} href="/professional/create/">
                    Open in New training brief
                  </a>
                </div>
                {!loading && !requests.length && (
                  <EmptyState
                    line={
                      signedIn
                        ? "No training briefs saved yet. Start one from New training brief."
                        : s.signInWorkspaceLine
                    }
                  />
                )}
                {requests.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-site-border py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <h3 className="break-words font-body-ui text-lg font-semibold text-site-ink">
                        {item.goal}
                      </h3>
                      <p className="mt-1 text-small text-site-muted">
                        {item.trade || "Training brief"} ·{" "}
                        {item.status === "ready"
                          ? "Practice plan ready"
                          : item.status === "processing"
                            ? "Processing"
                            : item.status === "failed"
                              ? "Attempt failed · no automatic repeat"
                              : item.status === "draft"
                                ? "Saved · not analyzed"
                                : "Status unavailable · refresh saved data"}
                      </p>
                    </div>
                    <a
                      className="text-small font-semibold text-[#15803D] underline"
                      href={
                        item.href ||
                        "/professional/create/#brief-" + encodeURIComponent(item.id)
                      }
                    >
                      {item.href
                        ? "Open practice plan →"
                        : item.status === "failed"
                          ? "View failed brief →"
                          : "Open brief →"}
                    </a>
                  </div>
                ))}
              </Panel>
            </section>
          </div>
          <section className="pro-catalogue scroll-mt-28 mt-8">
            <Panel>
              <h2 className="font-body-ui text-2xl font-bold text-site-ink">
                Trade courses
              </h2>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <label className="text-small font-semibold text-site-ink lg:flex-1">
                  Find a course
                  <input
                    className={field}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label className="text-small font-semibold text-site-ink">
                  Trade
                  <select
                    className={field}
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                  >
                    <option value="">All trades</option>
                    {Array.from(new Set(courses.map((item) => item.trade))).map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              {/* 5.3 (L8b) — the notice keeps its text only; the classroom
                  confirmation lives in its own labelled row (not inside the
                  notice box, and not deleted: it still gates enrol). */}
              <p className="rounded-[16px] border border-site-border bg-site-page p-4 text-small text-site-muted">
                {s["hub.sharedNotice"]}
              </p>
              <label className="mt-4 flex items-start gap-3 text-small text-site-ink">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmAll}
                  onChange={(e) => setConfirmAll(e.target.checked)}
                  disabled={busy}
                />
                <span>{s["hub.confirmLabel"]}</span>
              </label>
              {!loading && !shown.length && (
                <EmptyState line="No matching courses." />
              )}
              {/* 5.6 — course cards: two columns from 1024px (2x2 at ≥1280), equal height per row */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-5">
                {shown.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    busy={busy}
                    confirmed={confirmAll}
                    signedIn={signedIn}
                    enroll={() =>
                      void run(async () => {
                        await post("/v1/professional/enrollments", {
                          course_id: course.id,
                          training_only: true,
                        });
                        await load();
                      })
                    }
                  />
                ))}
              </div>
            </Panel>
          </section>
        </div>
      )}
      {view === "instructor" && (
        <div className="space-y-5">
          {!identity.account?.is_admin ? (
            <div className="rounded-[16px] border border-site-border bg-white p-8 text-center">
              <h2 className="font-body-ui text-2xl font-bold text-site-ink">
                {s["proInstructor.EmptyTitle"]}
              </h2>
              <p className="mx-auto mt-2 max-w-[448px] text-small text-site-muted">
                {s["proInstructor.EmptyLine"]}
              </p>
              <a className={secondary + " mt-4"} href="/professional/lessons">
                {s["proInstructor.EmptyAction"]}
              </a>
            </div>
          ) : !loading && !queue.length ? (
            <p className="text-site-muted">No reviews waiting.</p>
          ) : (
            queue.map((entry) => (
              <InstructorCard
                key={entry.id}
                entry={entry}
                busy={busy}
                run={run}
                refresh={load}
                decide={(decision, notes) =>
                  void run(async () => {
                    await post(
                      "/v1/professional/enrollments/" + entry.id + "/review",
                      { expected_version: entry.version, decision, notes },
                    );
                    await load();
                  })
                }
              />
            ))
          )}
        </div>
      )}
      {view === "instructor" && identity.account?.is_admin && (
        <InstructorAssignments
          assignments={assignments}
          busy={busy}
          run={run}
          post={post}
          refresh={load}
        />
      )}
      {/* 5.10 — the allowance block and the workspace account block appear once, after the main content, as one combined compact block */}
      <section aria-label={s.footnoteBlocks} className="mt-10 space-y-5">
        <AiAllowance config={identity.config} />
        <p className="text-caption text-site-muted">
          Practice and AI feedback are separate from instructor approval.
          Starter curricula need instructor validation; this is not a trade
          qualification or safety certification.
        </p>
        <AccountBar />
      </section>
    </div>
  );
}
function RequestForm({
  busy,
  signedIn,
  run,
  save,
}: {
  busy: boolean;
  signedIn: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  save: (body: unknown, key: string) => Promise<void>;
}) {
  const identity = useIdentity();
  const [goal, setGoal] = useState(""),
    [link, setLink] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<string | null>(null),
    [scope, setScope] = useState(false),
    [trade, setTrade] = useState("Plumbing"),
    [experience, setExperience] = useState("beginner"),
    [outcome, setOutcome] = useState(""),
    [fileError, setFileError] = useState("");
  const pending = useRef<{ body: string; key: string } | null>(null);
  const DRAFT_KEY = "showonce-pro-brief-draft-v5";
  // Leaving and returning restores the filled draft (5.7). The restore runs on a
  // deferred tick so state is not set synchronously inside the effect (lint).
  useEffect(() => {
    const tick = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d && typeof d === "object") {
            if (typeof d.goal === "string") setGoal(d.goal);
            if (typeof d.link === "string") setLink(d.link);
            if (typeof d.scope === "boolean") setScope(d.scope);
            if (typeof d.trade === "string") setTrade(d.trade);
            if (typeof d.experience === "string") setExperience(d.experience);
            if (typeof d.outcome === "string") setOutcome(d.outcome);
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(tick);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          goal,
          link,
          scope,
          trade,
          experience,
          outcome,
          hasPhoto: !!file,
        }),
      );
    } catch {}
  }, [goal, link, scope, trade, experience, outcome, file]);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const saveReason = !signedIn
    ? identity.account?.sign_in_url
      ? s["proCreate.disabledNoSignInAvailable"]
      : s["proCreate.disabledNoSignIn"]
    : !scope
      ? s["proCreate.disabledConfirmClassroom"]
      : null;
  return (
    <form
      aria-label="Professional learning request"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          if (!goal.trim() || !scope)
            throw Error(
              "Add your learning goal and confirm classroom training.",
            );
          const photo = file ? await photoData(file) : {};
          const body = {
              goal: goal.trim(),
              trade,
              experience_level: experience,
              success_criteria: outcome.trim(),
              source_url: link.trim() || null,
              training_only: true,
              ...photo,
            },
            snapshot = JSON.stringify(body);
          if (!pending.current || pending.current.body !== snapshot)
            pending.current = { body: snapshot, key: crypto.randomUUID() };
          await save(body, pending.current.key);
          pending.current = null;
        });
      }}
    >
      {/* 5.3 (L7) — ONE form card: brief fields, a divider, the photo upload as
          an internal section, a divider, the confirmation checkbox, then the
          footer action row. Nothing form-related renders outside the card. */}
      <Panel>
        <div className="space-y-5">
          <p className="pro-kicker">01 / TRAINING BRIEF</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-small font-semibold text-site-ink">
              Your trade
              <select
                className={field}
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                disabled={busy}
              >
                {[
                  "Plumbing",
                  "Electrical",
                  "Carpentry",
                  "Maintenance",
                  "Other trade",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block text-small font-semibold text-site-ink">
              Experience level
              <select
                className={field}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                disabled={busy}
              >
                <option value="beginner">New to this skill</option>
                <option value="some_experience">Some experience</option>
                <option value="experienced">Experienced / refreshing</option>
              </select>
            </label>
          </div>
          <label className="block text-small font-semibold text-site-ink">
            What do you want to learn?
            <textarea
              className={field}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              maxLength={300}
              rows={3}
              disabled={busy}
              placeholder="For example: identify the plumbing components in my training photo"
            />
          </label>
          <label className="block text-small font-semibold text-site-ink">
            What should you be able to do? (optional)
            <textarea
              className={field}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              maxLength={1200}
              rows={2}
              disabled={busy}
              placeholder="For example: name each fitting and explain its role to my instructor"
            />
          </label>
          <label className="block text-small font-semibold text-site-ink">
            Tutorial link (optional)
            <input
              className={field}
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={2048}
              disabled={busy}
              placeholder="https://…"
            />
          </label>
        </div>
        <div className="mt-5 border-t border-site-border pt-4">
          <label className="block text-small font-semibold text-site-ink">
            Photo of what you’re doing (optional)
            <input
              className="mt-3 block w-full min-w-0 text-small"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              onChange={(e) => {
                const value = e.target.files?.[0] || null;
                setFileError("");
                if (
                  value &&
                  (!["image/png", "image/jpeg", "image/webp"].includes(
                    value.type,
                  ) ||
                    value.size === 0 ||
                    value.size > 5 * 1024 * 1024)
                ) {
                  setFile(null);
                  e.target.value = "";
                  setFileError("Choose a PNG, JPEG or WebP up to 5 MiB.");
                  return;
                }
                setFile(value);
              }}
            />
          </label>
          {fileError && (
            <p role="alert" className="mt-3 text-small text-danger">
              {fileError}
            </p>
          )}
          {preview && (
            <img
              src={preview}
              alt="Your selected work photo"
              className="mt-4 max-h-72 w-full rounded-xl object-contain"
            />
          )}
          <p className="mt-3 text-caption text-site-muted">
            PNG, JPEG or WebP · up to 5 MiB. Preview stays local. Saving uploads
            it privately without an AI call.
          </p>
        </div>
        <div className="mt-5 border-t border-site-border pt-4">
          <label className="flex items-start gap-3 text-small text-site-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={scope}
              onChange={(e) => setScope(e.target.checked)}
              required
              disabled={busy}
            />
            <span>Classroom or disconnected training only.</span>
          </label>
          <p className="mt-2 text-caption text-site-muted">
            {s["proCreate.classroomHelp"]}
          </p>
        </div>
        <div className="sticky bottom-0 -mx-4 mt-5 space-y-3 border-t border-site-border bg-white px-4 py-4 lg:static lg:mx-0 lg:mt-4 lg:border-0 lg:bg-transparent lg:p-0">
          {signedIn ? (
            <button
              type="submit"
              className={primary + " w-full"}
              disabled={busy || !scope}
            >
              {busy ? "Saving…" : s["proCreate.saveForReviewLabel"]}
            </button>
          ) : null}
          {saveReason && (
            <p className="text-small text-site-muted">{saveReason}</p>
          )}
        </div>
      </Panel>
    </form>
  );
}
function PrivatePhoto({ id }: { id: string }) {
  const identity = useIdentity(),
    [url, setURL] = useState<string | null>(null),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let created: string | null = null;
    void identity
      .request<Blob>("/v1/professional/requests/" + id + "/photo", undefined, {
        image: true,
        signal: controller.signal,
      })
      .then((blob) => {
        if (!controller.signal.aborted) {
          created = URL.createObjectURL(blob);
          setURL(created);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => {
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [identity.request, id]);
  return url ? (
    <img
      src={url}
      alt="Your privately saved work photo"
      className="my-4 max-h-64 w-full rounded-xl object-contain"
    />
  ) : (
    <p className="mt-3 text-small text-site-muted">
      {error
        ? "Saved photo could not be loaded. Refresh before retrying."
        : "Loading saved photo…"}
    </p>
  );
}
function RequestCard({
  item,
  busy,
  aiReady,
  run,
  generate,
  remove,
}: {
  item: LearningRequest;
  busy: boolean;
  aiReady: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  generate: () => Promise<void>;
  remove: () => Promise<void>;
}) {
  const [consent, setConsent] = useState(false),
    [showPhoto, setShowPhoto] = useState(false);
  return (
    <Panel id={"brief-" + item.id}>
      <p className="pro-kicker">
        {item.trade || "Training brief"} ·{" "}
        {(item.experience_level || "beginner").replace("_", " ")}
      </p>
      <h3 className="break-words font-body-ui text-xl font-semibold text-site-ink">
        {item.goal}
      </h3>
      <p className="mt-2 text-small text-site-muted">
        {item.status === "draft"
          ? "Saved inputs · not analyzed by AI"
          : item.status === "ready"
            ? "AI-suggested practice ready · instructor validation required"
            : item.status === "processing"
              ? "Processing · refresh saved data to check"
              : "Attempt failed · no automatic repeat"}
      </p>
      {item.success_criteria && (
        <p className="mt-3 text-small text-site-ink">
          <strong>Target outcome:</strong> {item.success_criteria}
        </p>
      )}
      {item.source_url && (
        <a
          className="mt-3 inline-block text-small text-[#15803D] underline"
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Your tutorial link ↗
        </a>
      )}
      {item.has_photo && (
        <>
          <button
            className={secondary + " mt-3"}
            onClick={() => setShowPhoto(!showPhoto)}
          >
            {showPhoto ? "Hide input photo" : "View input photo"}
          </button>
          {showPhoto && <PrivatePhoto id={item.id} />}
          <button
            className={secondary}
            disabled={busy || item.status === "processing"}
            onClick={() => void run(remove)}
          >
            Delete saved input photo
          </button>
        </>
      )}
      {item.href ? (
        <a className={primary + " mt-4 w-full"} href={item.href}>
          Open your practice plan
        </a>
      ) : item.status === "draft" ? (
        <div className="mt-5 space-y-3">
          <label className="flex items-start gap-3 text-small text-site-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={busy}
            />
            <span>
              Send my goal, tutorial content and photo to AI using the shared
              allowance.
            </span>
          </label>
          <button
            className={primary + " w-full"}
            disabled={busy || !consent || !aiReady}
            onClick={() => void run(generate)}
          >
            Create AI practice plan · uses allowance
          </button>
          {!aiReady && (
            <p className="text-small text-site-muted">
              AI is not configured or allowance is unavailable. Your inputs
              remain saved and free practice still works.
            </p>
          )}
        </div>
      ) : null}
    </Panel>
  );
}
function CourseCard({
  course,
  busy,
  confirmed,
  signedIn,
  enroll,
}: {
  course: Course;
  busy: boolean;
  confirmed: boolean;
  signedIn: boolean;
  enroll: () => void;
}) {
  /* 5.8 — the classroom confirmation lives once at hub level; each card keeps only the trade label, title, lesson names with step counts and the Enroll button, with the disabled reason inline */
  const identity = useIdentity();
  const reason =
    !signedIn
      ? identity.account?.sign_in_url
        ? s["hub.enrollDisabledSignInAvailable"]
        : s["hub.enrollDisabledSignIn"]
      : !confirmed
        ? s["hub.enrollDisabledConfirm"]
        : null;
  return (
    <Panel>
      <p className="text-caption font-semibold uppercase tracking-wide text-[#15803D]">
        {course.trade}
      </p>
      <a href={"/professional/course/" + course.id}>
        <h3 className="mt-2 font-body-ui text-xl font-bold text-site-ink group-hover:text-[#15803D]">
          {course.title}
        </h3>
      </a>
      <ol className="mt-4 list-inside list-decimal space-y-2 text-small text-site-ink">
        {course.lessons.map((lesson) => (
          <li key={lesson.id}>
            <a
              className="underline hover:text-[#15803D]"
              href={
                "/professional/course/" + course.id + "#lesson-" + lesson.id
              }
            >
              {lesson.title} · {lesson.steps} steps
            </a>
          </li>
        ))}
      </ol>
      {/* 5.3 (L8c) — hierarchy swapped: Enrol/resume is the primary pill (green);
          Read course preview is the secondary ghost action in the same row. The
          enrol gate reason stays as the small line under the row. */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={primary}
          onClick={enroll}
          disabled={busy || !signedIn || !confirmed}
        >
          Enroll / resume course
        </button>
        <a className={secondary} href={"/professional/course/" + course.id}>
          {s["proCourse.previewCta"]}
        </a>
      </div>
      {reason && <p className="mt-2 text-small text-site-muted">{reason}</p>}
    </Panel>
  );
}
function EnrollmentCard({
  entry,
  assignment,
  busy,
  start,
  review,
  run,
  refresh,
}: {
  entry: Enrollment;
  assignment?: Assignment | null;
  busy: boolean;
  start: (id: string) => void;
  review: (share: boolean) => void;
  run: (action: () => Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const [share, setShare] = useState(false),
    done = entry.lessons.reduce((n, item) => n + item.completed_steps, 0),
    total = entry.lessons.reduce((n, item) => n + item.total_steps, 0),
    next = entry.lessons.find((l) => l.completed_steps < l.total_steps),
    locked = ["pending_review", "instructor_approved"].includes(entry.status);
  return (
    <Panel>
      <p className="pro-kicker">
        {entry.course.trade} / {statusName(entry.status)}
      </p>
      <h3 className="mt-2 font-body-ui text-xl font-semibold text-site-ink">
        {entry.course.title}
      </h3>
      <p className="mt-2 text-small text-site-muted">
        {done}/{total} practice steps · {entry.evidence_count || 0} evidence
        records ·{" "}
        {entry.evidence_shared
          ? "Evidence shared with instructors"
          : "Evidence private"}
      </p>
      <progress
        className="mt-3 w-full accent-[#16A34A]"
        aria-label={entry.course.title + " practice progress"}
        value={done}
        max={total}
      />
      {next && (
        <button
          className={primary + " mt-4"}
          disabled={busy}
          onClick={() => start(next.id)}
        >
          Continue training: {next.title}
        </button>
      )}
      <details className="mt-5">
        <summary className="cursor-pointer py-2 text-small font-semibold">
          Lesson checkpoints
        </summary>
        <div className="divide-y divide-site-border">
          {entry.lessons.map((lesson, i) => {
            const prerequisite =
              i > 0 &&
              entry.lessons[i - 1].completed_steps !==
                entry.lessons[i - 1].total_steps;
            return (
              <div key={lesson.id} className="py-4">
                <p className="mb-3 text-small font-semibold text-site-ink">
                  {lesson.title} · {lesson.completed_steps}/{lesson.total_steps}
                </p>
                <button
                  className={secondary}
                  disabled={busy || prerequisite}
                  onClick={() => start(lesson.id)}
                >
                  {prerequisite
                    ? "Finish previous lesson first"
                    : lesson.session_id
                      ? "Open saved practice"
                      : "Start lesson"}
                </button>
              </div>
            );
          })}
        </div>
      </details>
      {assignment && (
        <AssignmentPanel
          key={assignment.id + ":" + assignment.version}
          assignment={assignment}
          practiceComplete={done === total}
          busy={busy}
          run={run}
          refresh={refresh}
        />
      )}
      <EvidenceJournal
        enrollmentID={entry.id}
        lessons={entry.lessons}
        criteria={assignment?.criteria}
        locked={locked}
        shared={!!entry.evidence_shared}
        busy={busy}
        run={run}
        refresh={refresh}
      />
      {entry.reviews.map((item, i) => (
        <p
          key={i}
          className="mt-3 rounded-xl bg-site-page p-3 text-small text-site-ink"
        >
          {statusName(item.decision)}: {item.notes}
        </p>
      ))}
      <div className="mt-5 border-t border-site-border pt-5">
        {!locked && (
          <label className="mb-4 flex items-start gap-3 text-small">
            <input
              type="checkbox"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
              disabled={busy}
            />
            <span>
              Share my course evidence notes and photos with instructors for
              this review.
            </span>
          </label>
        )}
        <button
          className={primary}
          disabled={busy || !entry.practice_complete || locked}
          onClick={() => review(share)}
        >
          Request instructor review
        </button>
        {!entry.practice_complete && (
          <p className="mt-2 text-small text-site-muted">
            Complete all lesson checkpoints before requesting review.
          </p>
        )}
      </div>
    </Panel>
  );
}
function InstructorCard({
  entry,
  busy,
  decide,
  run,
  refresh,
}: {
  entry: Enrollment;
  busy: boolean;
  decide: (decision: string, notes: string) => void;
  run: (action: () => Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(""),
    [decision, setDecision] = useState("changes_requested");
  return (
    <Panel>
      <p className="pro-kicker">{entry.course.trade} / REVIEW REQUEST</p>
      <h3 className="mt-2 font-body-ui text-xl font-bold text-site-ink">
        {entry.course.title}
      </h3>
      <p className="mt-2 text-small text-site-muted">
        Learner: {entry.learner_name}. Review the classroom work directly before
        deciding.
      </p>
      {entry.lessons.map((lesson) => (
        <p key={lesson.id} className="mt-3 text-small text-site-ink">
          {lesson.title} · {lesson.completed_steps}/{lesson.total_steps}{" "}
          practiced
        </p>
      ))}
      {entry.evidence_shared ? (
        <EvidenceJournal
          enrollmentID={entry.id}
          lessons={entry.lessons}
          readOnly
          busy={busy}
          run={run}
          refresh={refresh}
        />
      ) : (
        <p className="mt-4 text-small text-site-muted">
          The learner has not shared their private work evidence.
        </p>
      )}
      <label className="mt-4 block text-small font-semibold text-site-ink">
        Review notes
        <textarea
          className={field}
          maxLength={2000}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
        />
      </label>
      <label className="mt-4 block text-small font-semibold text-site-ink">
        Decision
        <select
          className={field}
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          disabled={busy}
        >
          <option value="changes_requested">Request changes</option>
          <option value="instructor_approved">
            Approve classroom practice
          </option>
        </select>
      </label>
      <button
        className={primary + " mt-4"}
        disabled={busy || !notes.trim()}
        onClick={() => decide(decision, notes)}
      >
        Save instructor decision
      </button>
    </Panel>
  );
}

function AssignmentPanel({
  assignment,
  practiceComplete,
  busy,
  run,
  refresh,
}: {
  assignment: Assignment;
  practiceComplete: boolean;
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const identity = useIdentity(),
    [prepDone, setPrepDone] = useState<string[]>(
      assignment.preparation.filter((item) => item.done).map((item) => item.id),
    ),
    [share, setShare] = useState(false);
  const base = "/v1/professional/assignments/" + assignment.id;
  const nextAction =
    assignment.status === "approved"
      ? "Instructor assessment complete."
      : assignment.status === "submitted"
        ? "Waiting for your instructor to assess each criterion."
        : assignment.status === "changes_requested"
          ? "Read the instructor feedback, add revised evidence, then resubmit."
          : assignment.preparation.some((item) => !prepDone.includes(item.id))
            ? "Next: complete every preparation check."
            : !practiceComplete
              ? "Next: finish all course practice, then submit your evidence."
              : "Next: submit your evidence for instructor assessment.";
  const statusLabel =
    {
      preparation: "Preparation",
      practice: "In practice",
      submitted: "Submitted for assessment",
      changes_requested: "Changes requested",
      approved: "Passed — instructor-reviewed training assessment",
    }[assignment.status] || assignment.status;
  return (
    <div className="mt-5 rounded-2xl border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
      <p className="pro-kicker">PROFESSIONAL ASSIGNMENT</p>
      <h4 className="mt-2 font-body-ui text-lg font-bold text-site-ink">
        {assignment.brief.title}
      </h4>
      <p className="mt-2 text-small text-site-ink">
        {assignment.brief.outcome}
      </p>
      {assignment.brief.materials.length > 0 && (
        <p className="mt-2 text-small text-site-muted">
          Materials: {assignment.brief.materials.join(" · ")}
        </p>
      )}
      <p
        role="status"
        className="mt-3 rounded-xl bg-white p-3 text-small font-semibold text-site-ink"
      >
        {statusLabel} · {nextAction}
      </p>
      <h5 className="mt-4 text-small font-semibold text-site-ink">
        Preparation checks
      </h5>
      <div className="mt-2 space-y-2">
        {assignment.preparation.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 text-small text-site-ink"
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={prepDone.includes(item.id)}
              disabled={
                busy || !["preparation", "practice"].includes(assignment.status)
              }
              onChange={(e) =>
                setPrepDone((previous) =>
                  e.target.checked
                    ? [...previous, item.id]
                    : previous.filter((value) => value !== item.id),
                )
              }
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      {["preparation", "practice"].includes(assignment.status) && (
        <button
          className={secondary + " mt-3"}
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await identity.request(
                base + "/preparation",
                { expected_version: assignment.version, done: prepDone },
                {},
              );
              await refresh();
            })
          }
        >
          Save preparation
        </button>
      )}
      <h5 className="mt-4 text-small font-semibold text-site-ink">
        Required criteria
      </h5>
      <ul className="mt-2 space-y-2">
        {assignment.criteria.map((item) => (
          <li
            key={item.id}
            className="rounded-xl bg-white p-3 text-small text-site-ink"
          >
            <strong>{item.label}</strong>
            {item.required ? " · required" : ""}
            {item.latest_decision ? (
              <>
                <span className="mt-1 block font-semibold">
                  {item.latest_decision.decision === "approved"
                    ? "Approved by instructor"
                    : "Changes requested"}
                </span>
                {item.latest_decision.notes && (
                  <span className="mt-1 block text-site-muted">
                    {item.latest_decision.notes}
                  </span>
                )}
              </>
            ) : (
              <span className="mt-1 block text-site-muted">
                No instructor decision yet.
              </span>
            )}
          </li>
        ))}
      </ul>
      {["practice", "changes_requested"].includes(assignment.status) && (
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 text-small text-site-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
              disabled={busy}
            />
            <span>
              Share my course evidence with instructors for this assessment.
            </span>
          </label>
          <button
            className={primary}
            disabled={busy || !share || !practiceComplete}
            onClick={() =>
              void run(async () => {
                await identity.request(
                  base + "/submit",
                  {
                    expected_version: assignment.version,
                    share_evidence: true,
                  },
                  {},
                );
                await refresh();
              })
            }
          >
            {assignment.status === "changes_requested"
              ? "Resubmit for assessment"
              : "Submit evidence for assessment"}
          </button>
          {!practiceComplete && (
            <p className="text-small text-site-muted">
              Finish all course practice before submitting.
            </p>
          )}
        </div>
      )}
      {assignment.status === "approved" && (
        <p className="mt-3 text-small text-site-muted">
          This records an instructor-reviewed training assessment. It is not a
          professional licence, safety certification or independent
          accreditation.
        </p>
      )}
    </div>
  );
}
function InstructorAssignments({
  assignments,
  busy,
  run,
  post,
  refresh,
}: {
  assignments: Assignment[];
  busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
  post: <T>(path: string, body: unknown, key?: string) => Promise<T>;
  refresh: () => Promise<void>;
}) {
  const [enrollmentID, setEnrollmentID] = useState(""),
    [title, setTitle] = useState(""),
    [outcome, setOutcome] = useState(""),
    [materials, setMaterials] = useState(""),
    [criteriaText, setCriteriaText] = useState(""),
    [prepText, setPrepText] = useState(""),
    [notes, setNotes] = useState<Record<string, string>>({});
  const lines = (value: string) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  return (
    <div className="mt-10 space-y-5">
      <div>
        <p className="pro-kicker">ASSIGNMENTS</p>
        <h2 className="mt-2 font-body-ui text-2xl font-bold text-site-ink">
          Assignment briefs and assessment
        </h2>
      </div>
      <Panel>
        <form
          aria-label="Create assignment"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await post("/v1/professional/assignments", {
                enrollment_id: enrollmentID.trim(),
                brief_title: title.trim(),
                brief_outcome: outcome.trim(),
                materials: lines(materials),
                criteria: lines(criteriaText).map((label, index) => ({
                  id: "criterion_" + (index + 1),
                  label,
                  required: true,
                })),
                prep_checks: lines(prepText).map((label, index) => ({
                  id: "prep_" + (index + 1),
                  label,
                })),
              });
              setEnrollmentID("");
              setTitle("");
              setOutcome("");
              setMaterials("");
              setCriteriaText("");
              setPrepText("");
              await refresh();
            });
          }}
        >
          <label className="block text-small font-semibold text-site-ink">
            Learner enrollment ID
            <input
              className={field}
              value={enrollmentID}
              onChange={(e) => setEnrollmentID(e.target.value)}
              required
              disabled={busy}
              placeholder="enrollment_…"
            />
          </label>
          <label className="block text-small font-semibold text-site-ink">
            Brief title
            <input
              className={field}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              disabled={busy}
            />
          </label>
          <label className="block text-small font-semibold text-site-ink">
            Expected outcome
            <textarea
              className={field}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              required
              maxLength={1200}
              rows={2}
              disabled={busy}
            />
          </label>
          <label className="block text-small font-semibold text-site-ink">
            Materials (one per line)
            <textarea
              className={field}
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              rows={2}
              disabled={busy}
            />
          </label>
          <label className="block text-small font-semibold text-site-ink">
            Observable criteria (one per line)
            <textarea
              className={field}
              value={criteriaText}
              onChange={(e) => setCriteriaText(e.target.value)}
              required
              rows={3}
              disabled={busy}
              placeholder="Fittings identified on the labelled diagram"
            />
          </label>
          <label className="block text-small font-semibold text-site-ink">
            Preparation checks (one per line)
            <textarea
              className={field}
              value={prepText}
              onChange={(e) => setPrepText(e.target.value)}
              required
              rows={2}
              disabled={busy}
              placeholder="Disconnected mock rig confirmed"
            />
          </label>
          <button className={primary} disabled={busy}>
            Create assignment · free
          </button>
        </form>
      </Panel>
      {assignments.map((assignment) => (
        <Panel key={assignment.id + ":" + assignment.version}>
          <p className="pro-kicker">
            {assignment.learner_name || "Learner"} · {assignment.status}
          </p>
          <h3 className="mt-2 font-body-ui text-xl font-bold text-site-ink">
            {assignment.brief.title}
          </h3>
          <p className="mt-2 text-small text-site-muted">
            {assignment.brief.outcome}
          </p>
          {assignment.status === "submitted" ? (
            <div className="mt-4 space-y-4">
              {assignment.criteria.map((criterion) => {
                const key = assignment.id + ":" + criterion.id;
                return (
                  <div
                    key={criterion.id}
                    className="rounded-xl bg-site-page p-3"
                  >
                    <p className="text-small font-semibold text-site-ink">
                      {criterion.label}
                    </p>
                    <label className="mt-2 block text-small font-semibold text-site-ink">
                      Criterion feedback
                      <textarea
                        className={field}
                        value={notes[key] || ""}
                        onChange={(e) =>
                          setNotes((previous) => ({
                            ...previous,
                            [key]: e.target.value,
                          }))
                        }
                        maxLength={2000}
                        rows={2}
                        disabled={busy}
                      />
                    </label>
                    <CriterionEvidence
                      enrollmentID={assignment.enrollment_id}
                      criterionID={criterion.id}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className={primary}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await post(
                              "/v1/professional/assignments/" +
                                assignment.id +
                                "/assess",
                              {
                                criterion_id: criterion.id,
                                decision: "approved",
                                notes: (notes[key] || "").trim(),
                                expected_version: assignment.version,
                              },
                            );
                            await refresh();
                          })
                        }
                      >
                        Approve criterion
                      </button>
                      <button
                        className={secondary}
                        disabled={busy || !(notes[key] || "").trim()}
                        onClick={() =>
                          void run(async () => {
                            await post(
                              "/v1/professional/assignments/" +
                                assignment.id +
                                "/assess",
                              {
                                criterion_id: criterion.id,
                                decision: "changes_requested",
                                notes: (notes[key] || "").trim(),
                                expected_version: assignment.version,
                              },
                            );
                            await refresh();
                          })
                        }
                      >
                        Request changes
                      </button>
                    </div>
                  </div>
                );
              })}
              <h4 className="text-small font-semibold text-site-ink">
                General evidence
              </h4>
              <CriterionEvidence
                enrollmentID={assignment.enrollment_id}
                criterionID={null}
              />
            </div>
          ) : (
            <p className="mt-3 text-small text-site-muted">
              {assignment.status === "approved"
                ? "Assessment complete."
                : "Waiting for the learner to submit."}
            </p>
          )}
        </Panel>
      ))}
    </div>
  );
}

const evidenceInFlight = new Map<
  string,
  Promise<{
    evidence: {
      id: string;
      notes: string;
      has_photo: boolean;
      criterion_id?: string | null;
    }[];
  }>
>();

function CriterionEvidence({
  enrollmentID,
  criterionID,
}: {
  enrollmentID: string;
  criterionID: string | null;
}) {
  const identity = useIdentity(),
    [items, setItems] = useState<
      {
        id: string;
        notes: string;
        has_photo: boolean;
        criterion_id?: string | null;
      }[]
    >([]),
    [state, setState] = useState<"loading" | "ready" | "unavailable">(
      "loading",
    ),
    [visible, setVisible] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    let shared = evidenceInFlight.get(enrollmentID);
    if (!shared) {
      shared = identity.request<{
        evidence: {
          id: string;
          notes: string;
          has_photo: boolean;
          criterion_id?: string | null;
        }[];
      }>(
        "/v1/professional/enrollments/" + enrollmentID + "/evidence",
        undefined,
        {},
      );
      evidenceInFlight.set(enrollmentID, shared);
      const clear = () => {
        if (evidenceInFlight.get(enrollmentID) === shared)
          evidenceInFlight.delete(enrollmentID);
      };
      shared.then(clear, clear);
    }
    void shared
      .then((value) => {
        if (!controller.signal.aborted) {
          setItems(
            value.evidence.filter((item) =>
              criterionID
                ? (item.criterion_id || null) === criterionID
                : item.criterion_id == null,
            ),
          );
          setState("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("unavailable");
      });
    return () => controller.abort();
  }, [identity.request, enrollmentID, criterionID]);
  if (state === "loading")
    return (
      <p role="status" className="mt-2 text-small text-site-muted">
        Loading submitted evidence…
      </p>
    );
  if (state === "unavailable")
    return (
      <p className="mt-2 text-small text-site-muted">
        Submitted evidence is not shared with instructors right now.
      </p>
    );
  if (!items.length)
    return (
      <p className="mt-2 text-small text-site-muted">
        {criterionID
          ? "No evidence linked to this criterion yet."
          : "No general evidence submitted."}
      </p>
    );
  return (
    <div className="mt-2 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg bg-white p-3">
          <p className="text-small font-semibold text-site-ink">
            Learner evidence
          </p>
          {item.notes && (
            <p className="mt-1 whitespace-pre-wrap break-words text-small text-site-ink">
              {item.notes}
            </p>
          )}
          {item.has_photo && (
            <button
              type="button"
              className={secondary + " mt-2"}
              onClick={() =>
                setVisible((previous) =>
                  previous.includes(item.id)
                    ? previous.filter((value) => value !== item.id)
                    : [...previous, item.id],
                )
              }
            >
              {visible.includes(item.id) ? "Hide photo" : "View photo"}
            </button>
          )}
          {item.has_photo && visible.includes(item.id) && (
            <PrivateWorkPhoto
              path={"/v1/professional/evidence/" + item.id + "/photo"}
            />
          )}
        </div>
      ))}
    </div>
  );
}
