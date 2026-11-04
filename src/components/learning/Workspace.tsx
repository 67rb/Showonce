/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import { AiAllowance } from "./AiAllowance";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import s from "@/lib/strings";
import { cn } from "@/lib/utils";
import { SavedLessonCover } from "./SavedLessonCover";
import { Magnetic } from "@/components/Magnetic";
import { AccountBar, useIdentity } from "./Identity";
import { StepIllustration, StepIllustrationPrefetch } from "./StepIllustration";
import { LiveCamera } from "./LiveCamera";
import { StepQuestions, StepQuestionToggle } from "./StepQuestions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  workspaceHref,
  abortableDelay,
  aiChecksAvailable,
  currentQuery,
  entryFrom,
  lessonHref,
  photoData,
  LearningError,
  type Config,
  type Assessment,
  type Entry,
  type Lesson,
  type Progress,
  type Step,
  type Submission,
} from "@/lib/learning";
const primary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full bg-accent px-6 py-3 font-semibold text-[#16161A] transition hover:brightness-105 disabled:opacity-50";
const secondary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full border border-site-border bg-white px-5 py-3 font-semibold text-site-ink disabled:opacity-50";
const field =
  "mt-4 w-full rounded-2xl border border-site-border bg-white p-4 text-site-ink";
/* 5.4 (M5c) — committed media for the example rail cards: the origami example
   reuses the committed origami sample asset; the other categories use
   committed category line-diagrams drawn in the same style. No external
   images, no art generated at view time. */
function exampleVisual(category: string): string {
  switch (category) {
    case "origami":
      return "/samples/origami/step-1.svg";
    case "drawing":
      return "/samples/examples/drawing.svg";
    case "crochet":
      return "/samples/examples/crochet.svg";
    case "music":
      return "/samples/examples/music.svg";
    default:
      return "";
  }
}
/* 5.5 — the sticky bottom action bar: mobile only, solid ground colour, 1px
   top border, 12px padding, safe-area inset. Desktop renders the primary
   action inline (the same markup becomes static and loses the bar chrome). */
const stickyBar =
  "sticky bottom-0 -mx-4 mt-5 border-t border-site-border bg-site-page px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0";
function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <p
      role="alert"
      className="my-4 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-small text-site-ink"
    >
      {message}
    </p>
  ) : null;
}
/* 5.4/5.5 — interior cards: solid white, 1px existing line colour, 16px
   radius, 16px padding mobile / 24px desktop, no shadows. */
function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-[16px] border border-site-border bg-white p-4 lg:p-6 " +
        className
      }
    >
      {children}
    </div>
  );
}
function SavedObservations({
  progress,
  lesson,
  stepID,
}: {
  progress: Progress;
  lesson: Lesson;
  stepID?: string;
}) {
  const entries = progress.completed_checkpoints.filter(
    (item) =>
      item.kind === "self" &&
      item.observations?.length &&
      (!stepID || item.step_id === stepID),
  );
  if (!entries.length) return null;
  return (
    <div className="mt-5 rounded-2xl border border-site-border bg-site-page p-4">
      <h3 className="font-semibold text-site-ink">Your saved self-review</h3>
      <ul className="mt-3 list-inside list-disc space-y-3 text-site-ink">
        {entries.flatMap((entry) => {
          const stepIndex = lesson.steps.findIndex(
            (item) => item.id === entry.step_id,
          );
          const label =
            stepIndex >= 0 ? "Step " + (stepIndex + 1) : "Completed step";
          return (entry.observations || []).map(
            (observation, observationIndex) => (
              <li key={entry.step_id + ":" + observationIndex}>
                {label + " · self-reviewed — you confirmed: " + observation}
              </li>
            ),
          );
        })}
      </ul>
    </div>
  );
}
export function LearningWorkspace({
  screen,
  professional = false,
}: {
  screen: "create" | "library" | "overview" | "play" | "live" | "complete";
  professional?: boolean;
}) {
  const identity = useIdentity();
  const body =
    screen === "create" ? (
      <CreatePanel />
    ) : screen === "library" ? (
      <LibraryPanel />
    ) : (
      <LessonPanel screen={screen} professional={professional} />
    );
  /* 5.4 — interior pages sit on solid ground: Hobby #F7F7F8, Professional
    #FFFFFF. No photo, texture, gradient, glow or per-load background remains.
    5.5 — containers: mobile 16px sides; tablet max-w-[640px] centred, 24px
    sides; desktop max-w-[1120px] centred, 32px sides; 24px/40px page-top
    padding, 32px/48px vertical gap between sections (section spacing lives in
    the panels' own space-y values, updated below). */
  const player =
    screen === "overview" ||
    screen === "play" ||
    screen === "live" ||
    screen === "complete";
  return (
    <div
      className={
        "learning-workspace relative min-h-[100svh] " +
        (professional ? "bg-white" : screen === "create" ? "bg-transparent" : "bg-site-page")
      }
    >
      <div
        className={
          "relative z-10 mx-auto w-full font-body-ui " +
          (player
            ? "max-w-[430px] px-4 pt-6 pb-24 lg:max-w-[1120px] lg:px-8 lg:pt-10"
            : screen === "library"
              ? "max-w-[640px] px-4 pt-6 pb-24 md:px-6 lg:max-w-[1120px] lg:px-8 lg:pt-10"
              : "max-w-[640px] px-4 pt-6 pb-24 md:px-6 lg:max-w-[1120px] lg:px-8 lg:pt-10")
        }
      >
        {/* 5.4 (M4c) — ONE back link per player: on Professional it lives in
            the banner (rendering immediately, before the account check), on
            Hobby in the LessonPanel row. The classroom notice stays as the
            banner text. */}
        {professional && (
          <div className="mb-4 rounded-[16px] border border-site-border bg-white p-3 text-small text-site-ink">
            <a className="underline" href="/professional/lessons/">
              ← Professional courses
            </a>
            <p>
              Classroom training only · Self-review and AI feedback do not grant
              instructor approval or trade certification.
            </p>
          </div>
        )}
        {screen === "create" && !professional && <CreateHeading />}
        {identity.ready ? (
          <div key={identity.account?.user?.id || "anonymous"} className={screen === "create" && !professional ? "rounded-[28px] bg-site-page p-4 shadow-xl md:p-6" : undefined}>{body}</div>
        ) : (
          <LoadingPanel screen={screen} />
        )}
        {identity.ready && (
          <div className="mt-8 lg:mt-12">
            <FootnoteBlocks />
          </div>
        )}
      </div>
    </div>
  );
}
/* 5.2 — every surface shows a real loading state: skeleton blocks matching the
   page's own layout, not a lone pill sentence. */
function LoadingPanel({ screen }: { screen: string }) {
  const label =
    screen === "library"
      ? s.loadingLibrary
      : screen === "create"
        ? s.loadingCreate
        : s.loadingPractice;
  const block = "h-24 rounded-[16px] border border-site-border bg-white";
  return (
    <section aria-label={label} role="status" className="space-y-4">
      <div className="h-10 w-2/3 rounded-xl bg-site-border" />
      <div className="h-5 w-1/3 rounded bg-site-border" />
      {screen === "create" ? (
        <>
          <div className="h-[72px] rounded-[16px] border border-site-border bg-white" />
          <div className={block} />
          <div className={block} />
        </>
      ) : (
        <>
          <div className={block} />
          <div className={block} />
          <div className={block} />
        </>
      )}
    </section>
  );
}
/* 5.10 — the AI allowance block and the practice-workspace account block appear
   ONCE per interior page, after the main content, as one combined compact
   block (face-aware colours and links). */
function FootnoteBlocks() {
  return (
    <section aria-label={s.footnoteBlocks} className="space-y-3">
      <AllowancePanel />
      <AccountBar />
    </section>
  );
}
function AllowancePanel() {
  const identity = useIdentity(),
    [snapshot, setSnapshot] = useState<Config | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function refresh() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const request = new AbortController();
    controller.current = request;
    try {
      const value = await identity.request<Config>("/api/config", undefined, {
        signal: request.signal,
      });
      if (!request.signal.aborted) setSnapshot(value);
    } catch {
      if (!request.signal.aborted)
        setError(
          "Could not refresh the balance. The last checked balance is shown.",
        );
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }
  /* 5.3 (L4) — the balance line and Refresh action are the allowance card's
     footer row (rendered inside the card), not orphaned open-space rows. */
  return (
    <section aria-label="Shared AI allowance">
      <AiAllowance
        config={snapshot || identity.config}
        footer={
          <>
            <span className="text-site-muted">Balance at last check</span>
            <button
              type="button"
              className="min-h-11 rounded-full bg-white px-4 text-site-ink underline disabled:opacity-50"
              disabled={busy}
              onClick={() => void refresh()}
            >
              {busy ? "Refreshing balance…" : "Refresh balance · free"}
            </button>
            {error && (
              <p
                role="alert"
                className="w-full text-small text-site-ink"
              >
                {error}
              </p>
            )}
          </>
        }
      />
    </section>
  );
}
function CreateHeading() {
  /* 5.3 (L1) — one stacked header block: eyebrow row, H1 and subtitle all
     share the container's left edge (the old mx-auto centred subtitle block is
     removed), mirroring the /professional/create heading structure. */
  return (
    <div className="mx-auto mb-8 max-w-xl pt-4 text-center">
      <header>
        <h1 className="font-body-ui text-[2.75rem] font-bold tracking-[-0.02em] text-white lg:text-[3.5rem]">
          Learn something <em className="block font-serif font-normal">new</em>
        </h1>
        <p className="mx-auto mt-3 max-w-[420px] font-body-ui text-body font-semibold leading-relaxed text-white">
          {s.createScopeNote}
        </p>
      </header>
    </div>
  );
}
function CreatePanel() {
  const identity = useIdentity(),
    router = useRouter(),
    draft = identity.draft,
    [preview, setPreview] = useState<Lesson | null>(null),
    [editedSteps, setEditedSteps] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [status, setStatus] = useState(""),
    [errorCode, setErrorCode] = useState(""),
    [fieldError, setFieldError] = useState(""),
    [practiceName, setPracticeName] = useState(""),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const aiReady = aiChecksAvailable(identity.config);
  // 5.3 — inline validation under the field, no native-only behaviour: empty
  // submits and links that are not YouTube/Instagram show importErrorInvalidEmpty
  // / importErrorInvalid under the field and never navigate.
  const validLink = (value: string) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === "https:" && !url.username && !url.password && !url.port &&
        ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "instagram.com", "www.instagram.com"].includes(url.hostname);
    } catch {
      return false;
    }
  };
  function validate(): boolean {
    if (draft.mode === "link") {
      if (!draft.url.trim()) {
        setFieldError(s.importErrorInvalidEmpty);
        return false;
      }
      if (!validLink(draft.url)) {
        setFieldError(s.importErrorInvalid);
        return false;
      }
      setFieldError("");
      return true;
    }
    if (!(draft.mode === "steps" ? draft.stepsText : draft.text).trim()) {
      setFieldError(s.importErrorInvalidEmpty);
      return false;
    }
    if (draft.mode === "topic" && draft.text.trim().length < 100) {
      setFieldError(s["topic.tooShort"]);
      return false;
    }
    setFieldError("");
    return true;
  }
  const useFree = () => {
    setError(null);
    setErrorCode("");
    setFieldError("");
    identity.setDraft({
      ...draft,
      mode: "steps",
      stepsReference: draft.mode === "link" ? draft.url : draft.reference,
      stepsText:
        draft.stepsText ||
        (draft.mode === "text" || draft.mode === "topic"
          ? draft.text
          : draft.linkTranscript),
    });
  };
  // When /api/config says automatic source processing is off, link mode
  // must offer the paste recovery up front (keeping the link as the source
  // reference) instead of only after a link attempt fails on the server.
  const sourceProcessingDisabled =
    identity.config?.source_processing?.enabled === false &&
    identity.config.source_processing.video_downloader?.enabled !== true;
  const sourceCreditsExhausted = errorCode === "source_free_quota_exhausted";
  const linkSourceFailed =
    draft.mode === "link" &&
    /^(transcript_required|source_|unsupported_source|insufficient_source)/.test(errorCode);
  const pasteInstructions = () => {
    setError(null);
    setErrorCode("");
    setFieldError("");
    identity.setDraft({
      ...draft,
      mode: "text",
      reference: draft.mode === "link" ? draft.url : draft.reference,
      text: draft.text || draft.linkTranscript,
    });
  };
  const textKey = draft.mode === "steps" ? "stepsText" : "text",
    referenceKey = draft.mode === "steps" ? "stepsReference" : "reference";
  const update = (key: keyof typeof draft, value: string) =>
    identity.setDraft({ ...draft, [key]: value });
  async function create(example?: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setErrorCode("");
    setStatus(example ? "Opening the example…" : "Preparing your lesson…");
    const signal = new AbortController();
    controller.current = signal;
    const sourceText =
      draft.mode === "steps"
        ? practiceName.trim()
          ? practiceName.trim() + "\n" + draft.stepsText
          : draft.stepsText
        : draft.mode === "link"
          ? draft.linkTranscriptURL && draft.linkTranscriptURL === draft.url
            ? draft.linkTranscript
            : ""
          : draft[textKey];
    const body = example
      ? { example_id: example, save_to_account: !!identity.account?.user }
      : {
          source_url: draft.mode === "link" ? draft.url : draft[referenceKey],
          source_text: sourceText,
          processing_mode: draft.mode === "steps" ? "structured_text" : "ai",
          learning_mode: draft.learningMode,
          learning_goal:
            draft.goal ||
            (draft.mode === "topic" ? draft.text.trim().slice(0, 300) : ""),
          save_to_account: !!identity.account?.user,
        };
    try {
      let value = await identity.request<
        Lesson | { status: string; retry_after_ms?: number }
      >("/v1/lessons", body, { signal: signal.signal });
      const deadline = Date.now() + 300000;
      while ("status" in value && value.status === "source_processing") {
        if (Date.now() > deadline)
          throw new Error(
            "The source is still processing. Try again shortly; its extraction is cached.",
          );
        setStatus(
          "Reading the source demonstration. This can take a few minutes…",
        );
        await abortableDelay(
          Math.max(
            1500,
            Math.min(
              ("retry_after_ms" in value ? value.retry_after_ms : 3000) || 3000,
              10000,
            ),
          ),
          signal.signal,
        );
        value = await identity.request<
          Lesson | { status: string; retry_after_ms?: number }
        >("/v1/lessons", body, { signal: signal.signal });
      }
      if (!("id" in value))
        throw new Error("The source did not return a complete lesson.");
      const lesson = value;
      setPreview(lesson);
      setEditedSteps(lesson.steps.map((step) => step.instructions));
    } catch (e) {
      if (!signal.signal.aborted) {
        setError(e instanceof Error ? e.message : "Could not create a lesson.");
        setErrorCode(e instanceof LearningError ? e.code : "");
        if (
          !example &&
          draft.mode === "link" &&
          e instanceof LearningError &&
          /^(transcript_required|source_|unsupported_source|insufficient_source)/.test(
            e.code,
          )
        )
          identity.setDraft({
            ...draft,
            linkTranscriptURL: draft.url,
            linkTranscript: "",
          });
      }
    } finally {
      if (controller.current === signal) {
        setBusy(false);
        setStatus("");
      }
    }
  }
  async function startReviewed() {
    if (!preview || busy) return;
    setBusy(true);
    setError(null);
    try {
      let lesson = preview;
      const changed = editedSteps.some(
        (step, index) =>
          step.trim() !== preview.steps[index].instructions.trim(),
      );
      if (changed) {
        const source_text =
          preview.title +
          "\n" +
          editedSteps
            .map(
              (step, index) =>
                index + 1 + ". " + step.trim().replace(/\s+/g, " "),
            )
            .join("\n");
        lesson = await identity.request<Lesson>("/v1/lessons", {
          source_text,
          source_url: preview.source_url?.startsWith("https://")
            ? preview.source_url
            : "",
          processing_mode: "structured_text",
          save_to_account: !!identity.account?.user,
        });
      }
      const progress = await identity.request<Progress>("/v1/sessions", {
        lesson_id: lesson.id,
        save_to_account: !!identity.account?.user,
      });
      identity.remember(lesson, progress, progress.access_token);
      router.push(lessonHref(lesson.id, progress.session_id, "play"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start practice.");
    } finally {
      setBusy(false);
    }
  }
  if (preview)
    return (
      <div className="lg:grid lg:grid-cols-[minmax(0,640px)_minmax(0,320px)] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-5 lg:max-w-[640px]">
          <p className="text-small font-semibold uppercase text-site-muted">
            2 of 3 · Review your lesson
          </p>
          <ol className="space-y-4">
            {editedSteps.map((step, index) => (
              <li key={index}>
                <label className="block font-semibold text-site-ink">
                  Step {index + 1}
                  <textarea
                    className={field}
                    rows={3}
                    minLength={8}
                    maxLength={1200}
                    value={step}
                    disabled={busy}
                    onChange={(event) =>
                      setEditedSteps((steps) =>
                        steps.map((value, i) =>
                          i === index ? event.target.value : value,
                        ),
                      )
                    }
                  />
                </label>
              </li>
            ))}
          </ol>
          <ErrorMessage message={error} />
          <div className={stickyBar}>
            <button
              type="button"
              className={primary + " w-full"}
              disabled={
                busy || editedSteps.some((step) => step.trim().length < 8)
              }
              onClick={() => void startReviewed()}
            >
              {busy ? "Starting…" : "3 · Start practicing"}
            </button>
            <button
              type="button"
              className={secondary + " mt-3 w-full"}
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setError(null);
              }}
            >
              Back to source
            </button>
          </div>
        </div>
        <aside className="mt-8 space-y-5 lg:mt-0 lg:sticky lg:top-20 lg:w-[320px]">
          <Card>
            <h2 className="text-2xl font-bold text-site-ink">
              {preview.title}
            </h2>
            <p className="mt-3 text-site-ink">
              Review the steps and edit any instructions before you start.
            </p>
          </Card>
          <p className="text-small text-site-muted">
            If you edit a step, the new lesson uses your instructions and free
            self-review; generated photo checks and materials are not carried
            over.
          </p>
        </aside>
      </div>
    );
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,640px)_minmax(0,320px)] lg:items-start lg:gap-8">
      <div className="min-w-0 lg:max-w-[640px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!validate()) return;
            void create();
          }}
          aria-busy={busy}
        >
          <Card>
            {/* 5.4 (M5a) — ONE segmented mode selector: a single tab container;
                the selected tab is filled ink, the rest quiet. This replaces the
                old dashed "or start another way" stack whose selected state was
                a second orange primary. */}
            <div
              aria-label="Choose how to bring your practice"
              className="flex flex-col gap-1 rounded-full border border-site-border bg-site-page p-1 sm:flex-row"
            >
              {[
                ["link", "Tutorial link"],
                ["topic", s["topic.mode"]],
                ["text", "Paste instructions"],
                ["steps", "Free numbered steps"],
              ].map(([mode, label]) => (
                <button
                  type="button"
                  key={mode}
                  aria-pressed={draft.mode === mode}
                  className={
                    draft.mode === mode
                      ? "min-h-11 flex-1 rounded-full bg-site-ink px-5 py-3 text-center text-small font-semibold text-white"
                      : "min-h-11 flex-1 rounded-full border border-transparent bg-white px-5 py-3 text-center text-small font-semibold text-site-ink transition-colors duration-[150ms] hover:bg-site-page"
                  }
                  onClick={() => {
                    update("mode", mode);
                    setFieldError("");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {draft.mode === "link" ? (
              <>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-site-page text-accent-deep"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                    </svg>
                  </span>
                  <input
                    aria-label="Tutorial link"
                    aria-invalid={fieldError ? true : undefined}
                    className="w-full min-w-0 rounded-2xl border border-site-border bg-white px-4 py-3 font-body-ui text-[1.0625rem] text-site-ink placeholder:text-site-muted focus:outline focus:outline-2 focus:outline-accent"
                    type="url"
                    inputMode="url"
                    maxLength={2048}
                    value={draft.url}
                    onChange={(e) => {
                      update("url", e.target.value);
                      if (fieldError) setFieldError("");
                    }}
                    disabled={busy}
                    placeholder={s.importLinkPlaceholder}
                  />
                </div>
                <p className="mt-3 font-body-ui text-caption uppercase tracking-[0.14em] text-site-muted">
                  Tutorial link
                </p>
                {fieldError && (
                  <p role="alert" className="mt-3 text-small text-danger">
                    {fieldError}
                  </p>
                )}
                {sourceProcessingDisabled && !linkSourceFailed && (
                  <div
                    role="status"
                    className="mt-4 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-small text-site-ink"
                  >
                    <p>
                      Automatic link reading is not connected. Only publicly
                      readable captions and descriptions can be extracted from
                      a link, so you can paste the tutorial instructions or
                      switch to free numbered steps.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {/(?:youtube\.com|youtu\.be)/i.test(draft.url) &&
                        draft.learningMode === "visual" && (
                          <button
                            type="button"
                            className="min-h-11 underline"
                            disabled={busy}
                            onClick={() => update("learningMode", "auto")}
                          >
                            Try public YouTube captions
                          </button>
                        )}
                      <button
                        type="button"
                        className="min-h-11 underline"
                        disabled={busy}
                        onClick={pasteInstructions}
                      >
                        Paste instructions instead
                      </button>
                      <button
                        type="button"
                        className="min-h-11 underline"
                        disabled={busy}
                        onClick={useFree}
                      >
                        Use numbered steps · free
                      </button>
                    </div>
                    {/(?:youtube\.com|youtu\.be)/i.test(draft.url) &&
                      draft.learningMode === "auto" && (
                        <p className="mt-2">
                          Spoken captions selected. Choose Get the steps to try
                          reading available public captions. This works only
                          when the video has usable captions. Creating the AI
                          lesson still uses the existing allowance. Visual
                          actions are not analysed.
                        </p>
                      )}
                  </div>
                )}
              </>
            ) : (
              <>
                {draft.mode === "steps" && (
                  <label className="block font-semibold text-site-ink">
                    {s["freeSteps.nameLabel"]}
                    <input
                      type="text"
                      className={field}
                      value={practiceName}
                      maxLength={120}
                      disabled={busy}
                      onChange={(e) => setPracticeName(e.target.value)}
                      placeholder={s["freeSteps.nameHint"]}
                    />
                    <span className="mt-3 block text-small text-site-muted">
                      {s["freeSteps.nameHint"]}
                    </span>
                  </label>
                )}
                <label className="block font-semibold text-site-ink">
                  {draft.mode === "steps"
                    ? "2–18 numbered instructions"
                    : draft.mode === "topic"
                      ? s["topic.heading"]
                      : "Instructions or transcript"}
                  <textarea
                    aria-invalid={fieldError ? true : undefined}
                    maxLength={24000}
                    rows={7}
                    value={draft[textKey]}
                    disabled={busy}
                    placeholder={
                      draft.mode === "topic" ? s["topic.placeholder"] : undefined
                    }
                    onChange={(e) => {
                      update(textKey, e.target.value);
                      if (fieldError) setFieldError("");
                    }}
                    className={field}
                  />
                  {draft.mode === "topic" && (
                    <span className="mt-3 block text-small font-normal text-site-muted">
                      {s["topic.hint"]}
                    </span>
                  )}
                  {fieldError && (
                    <p role="alert" className="mt-3 text-small text-danger">
                      {fieldError}
                    </p>
                  )}
                </label>
              </>
            )}
          </Card>
          {draft.mode !== "link" && (
            <label className="mt-5 block text-site-ink">
              Source reference (optional)
              <input
                type="url"
                value={draft[referenceKey]}
                disabled={busy}
                onChange={(e) => update(referenceKey, e.target.value)}
                className={field}
              />
            </label>
          )}
          {draft.mode === "link" &&
            !!draft.linkTranscriptURL &&
            draft.linkTranscriptURL === draft.url && (
              <label className="mt-5 block text-site-ink">
                Paste this tutorial’s transcript or written instructions
                <textarea
                  maxLength={24000}
                  rows={6}
                  value={draft.linkTranscript}
                  disabled={busy}
                  onChange={(e) => update("linkTranscript", e.target.value)}
                  className={field}
                />
                <span className="mt-3 block text-small text-site-muted">
                  Your original link remains attached. Changing the link will
                  not submit this transcript for a different source.
                </span>
              </label>
            )}
          <details className="mt-5 text-small text-site-ink">
            <summary className="cursor-pointer">
              Learning options (optional)
            </summary>
            <div className="mt-4 space-y-4">
              {draft.mode === "link" && (
                <label className="block">
                  Learning approach
                  <select
                    value={draft.learningMode}
                    disabled={busy}
                    onChange={(e) => update("learningMode", e.target.value)}
                    className={field}
                  >
                    <option value="visual">Learn by watching</option>
                    <option value="auto">
                      Use spoken / written instructions
                    </option>
                  </select>
                </label>
              )}
              <label className="block">
                What do you want to practice? (optional)
                <input
                  value={draft.goal}
                  maxLength={300}
                  disabled={busy}
                  onChange={(e) => update("goal", e.target.value)}
                  className={field}
                />
              </label>
            </div>
          </details>
          <div className={stickyBar}>
            <button
              type="submit"
              className="block min-h-11 w-full rounded-full bg-accent px-6 py-3.5 text-center font-body-ui text-body font-semibold text-[#16161A] transition-all duration-[150ms] hover:brightness-105 disabled:opacity-50"
              disabled={busy || (draft.mode !== "steps" && !aiReady)}
            >
              {busy
                ? status
                : draft.mode === "steps"
                  ? "Create free practice"
                  : s.createGetSteps}
            </button>
          </div>
          {busy && (
            <p
              role="status"
              className="mt-4 flex items-center gap-3 text-small text-site-ink"
            >
              <span aria-hidden className="learning-spinner" />
              {status}
            </p>
          )}
          {busy && (
            <button
              type="button"
              className="mt-4 min-h-11 underline text-site-ink"
              onClick={() => {
                controller.current?.abort();
                setBusy(false);
                setStatus("");
                setError(
                  "Stopped waiting. A request already sent may finish and use the allowance. Check your library before starting again.",
                );
              }}
            >
              Stop waiting
            </button>
          )}
          <p className="mt-4 text-center text-caption text-site-muted">
            {draft.mode === "steps"
              ? "No AI charge. Checkpoints use your own self-review."
              : "Creating a lesson sends your source to AI services and uses the existing allowance. Only share material you are allowed to use."}
          </p>
          <ErrorMessage message={error} />
          {error && draft.mode !== "steps" && (
            <div className="mt-4 rounded-2xl border border-site-border p-4 text-small text-site-ink">
              <p>
                {sourceCreditsExhausted
                  ? "Automatic video-reading credits are used up. Keep this link as a reference and write your own steps to practice for free."
                  : "You can continue with your own instructions."}
              </p>
              {draft.mode === "link" && /(?:youtube\.com|youtu\.be)/i.test(draft.url) && ["source_free_quota_exhausted", "source_paid_usage_disabled", "source_rate_limited", "source_provider_setup", "source_visual_quota"].includes(errorCode) && (
                <div className="mt-3">
                  {draft.learningMode === "visual" ? <button type="button" className="min-h-11 underline" onClick={() => update("learningMode", "auto")}>Use spoken captions instead</button> : <p role="status">Spoken captions selected. Choose Get the steps to try reading available public captions. This works only when the video has usable captions. Creating the AI lesson still uses the existing allowance. Visual actions are not analysed.</p>}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4">
                <button type="button" className="min-h-11 underline" onClick={useFree}>
                  Use numbered steps · free
                </button>
                {linkSourceFailed && aiReady && (
                  <button type="button" className="min-h-11 underline" onClick={pasteInstructions}>
                    Paste instructions or a transcript · uses AI allowance
                  </button>
                )}
              </div>
              <p className="mt-3 text-site-muted">
                Write 2–18 steps. Your source link stays attached; no AI request
                is needed.
              </p>
            </div>
          )}
        </form>
        <p className="mt-8 text-center font-body-ui text-caption text-site-muted">
          {s.privacyClaim}
        </p>
      </div>
      <aside className="mt-8 space-y-5 lg:mt-0 lg:sticky lg:top-20 lg:w-[320px]">
        <Card>
          <p className="text-small font-semibold uppercase text-site-muted">
            {s.createStepStripTitle}
          </p>
          <p className="mt-3 text-small text-site-ink">{s.createStepStrip}</p>
          <button
            type="button"
            className={secondary + " mt-4 w-full"}
            disabled={busy}
            onClick={useFree}
          >
            Start free
          </button>
        </Card>
        {!aiReady && (
          <div
            role="status"
            className="rounded-[16px] border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-small text-site-ink"
          >
            <strong>Free practice is ready.</strong>
            <p className="mt-1">
              {identity.config?.budget?.paused
                ? "AI checks are paused."
                : identity.config?.ai_available
                  ? "The shared AI allowance is unavailable."
                  : "AI processing is currently unavailable."}{" "}
              Try an example or enter your own numbered steps.
            </p>
          </div>
        )}
        <section id="examples" className="learning-examples scroll-mt-18">
          <h2 className="font-body-ui text-2xl font-bold text-site-ink">
            Try a free example.
          </h2>
          <p className="mt-3 text-small text-site-muted">
            Opening an author-written example uses no AI credits.
          </p>
          <div className="mt-5 grid gap-3 lg:gap-5">
            {identity.config?.examples.map((example) => (
              <button
                disabled={busy}
                key={example.id}
                onClick={() => void create(example.id)}
                className="rounded-[16px] border border-site-border bg-white p-4 text-left lg:p-6"
              >
                {/* 5.4 (M5c) — shared lesson-card anatomy with a committed
                    media thumb: the origami example reuses the committed sample
                    asset; the other categories use committed category
                    line-diagrams in the same drawing style. */}
                <div className="aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-xl border border-site-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="h-full w-full object-contain"
                    src={exampleVisual(example.category)}
                    alt={`${example.title} reference diagram`}
                    width={420}
                    height={320}
                  />
                </div>
                <p className="mt-3 text-small uppercase text-site-muted">
                  {example.category} · {example.steps} steps
                </p>
                <h3 className="mt-3 text-xl font-semibold text-site-ink">
                  {example.title}
                </h3>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
function LibraryPanel() {
  const identity = useIdentity(),
    [entries, setEntries] = useState<Entry[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState<string | null>(null),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [imports, setImports] = useState<Entry[] | null>(null),
    [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const sequence = useRef(0);
  const verify = useCallback(async () => {
    const source = identity.guestEntries(),
      results: (Entry | null)[] = new Array(source.length).fill(null);
    let next = 0;
    const unavailableIDs: string[] = [];
    await Promise.all(
      Array.from({ length: Math.min(4, source.length) }, async () => {
        while (next < source.length) {
          const at = next++,
            entry = source[at];
          try {
            const progress = await identity.request<Progress>(
              "/v1/sessions/" + entry.id,
              undefined,
              { token: entry.token },
            );
            if (progress.account_owned) continue;
            const lesson = await identity.request<Lesson>(
              "/v1/lessons/" + progress.lesson_id,
              undefined,
              { token: entry.token },
            );
            results[at] = {
              ...entry,
              ...entryFrom(lesson, progress, entry.token),
              created_at: entry.created_at,
            };
          } catch (e) {
            if (
              e instanceof LearningError &&
              [401, 404].includes(e.status || 0)
            )
              continue;
            if (e instanceof LearningError && ['account_changed', 'account_unchecked'].includes(e.code)) throw e;
            // A temporary outage for one session must not hide every other
            // saved practice. Keep its browser access untouched for retry.
            unavailableIDs.push(entry.id);
          }
        }
      }),
    );
    return {
      entries: results.filter((entry): entry is Entry => entry !== null),
      unavailableIDs,
      warning: unavailableIDs.length ? `${unavailableIDs.length} saved practice${unavailableIDs.length === 1 ? '' : 's'} could not be refreshed. Your browser access is still saved. Refresh to try again.` : null,
    };
  }, [identity.guestEntries, identity.request]);
  const load = useCallback(
    async (append = false) => {
      const id = ++sequence.current;
      setBusy(true);
      setError(null);
      try {
        if (identity.account?.user) {
          const result = await identity.request<{
            entries: Entry[];
            next_cursor: string | null;
          }>(
            "/v1/library?filter=" +
              filter +
              (append && cursor ? "&cursor=" + encodeURIComponent(cursor) : ""),
          );
          if (id !== sequence.current) return;
          setEntries((previous) =>
            append
              ? [
                  ...new Map(
                    [...previous, ...result.entries].map((entry) => [
                      entry.id,
                      entry,
                    ]),
                  ).values(),
                ]
              : result.entries,
          );
          setCursor(result.next_cursor);
        } else {
          const verified = await verify();
          if (id !== sequence.current) return;
          setEntries(previous => [...verified.entries, ...previous.filter(entry => verified.unavailableIDs.includes(entry.id))].sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
          setError(verified.warning);
          setCursor(null);
        }
      } catch (e) {
        if (id === sequence.current)
          setError(
            e instanceof Error ? e.message : "Could not load practices.",
          );
      } finally {
        if (id === sequence.current) setBusy(false);
      }
    },
    [identity.account?.user?.id, identity.request, filter, cursor, verify],
  );
  useEffect(() => {
    void load();
    return () => {
      sequence.current++;
    };
  }, [identity.account?.user?.id, filter]);
  async function connect(entry: Entry) {
    setError(null);
    try {
      await identity.request("/v1/library/attach", {
        session_id: entry.id,
        access_token: entry.token,
      });
      setImports(
        (previous) => previous?.filter((item) => item.id !== entry.id) || [],
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed.");
    }
  }
  // 5.1b (B6) — delete a lesson (browser store): removes the entry AND its
  // sessions/progress for that lesson_id, then reloads list + counts so they
  // update immediately. Signed-out only; account-signed entries use the backend.
  async function removeLesson() {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);
    try {
      const result = identity.forget(target.lesson_id);
      if (result.error) setError(result.error);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not delete that lesson.",
      );
    }
    await load();
  }
  const shown = entries.filter(
    (entry) =>
      (filter === "all" ||
        (filter === "completed"
          ? entry.status === "completed"
          : entry.status !== "completed")) &&
      (entry.title + " " + entry.category)
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const hasFilters = !!search.trim() || filter !== "all";
  return (
    <div className="space-y-8 lg:space-y-12">
      {/* 5.3 (L6) — exactly ONE New lesson action: desktop right-aligned on the
          H1 row (hidden on mobile, which uses the sticky bottom bar below). */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-body-ui text-[2.5rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[3rem]">
            {s.lessonsHeading}
          </h1>
          <div aria-hidden className="mt-3 h-1 w-16 rounded-full bg-accent" />
        </div>
        <a
          href={workspaceHref("create")}
          className={cn(primary, "hidden shrink-0 md:inline-flex")}
        >
          {s.newLesson}
        </a>
      </header>
      {/* 5.3 (L6) — the filter card keeps Search + Status only, labels above
          both on a shared baseline; the New lesson button no longer lives here. */}
      <div className="scroll-mt-18 rounded-[16px] border border-site-border bg-white p-4 lg:p-6">
        <p className="text-small font-semibold text-site-ink">
          Find and filter practices
        </p>
        {/* 5.6 — desktop: one toolbar row; search grows beside the filter */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="grow">
            Find a practice
            <input
              className={field}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
            />
          </label>
          <label>
            Status
            <select
              className={field}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All practices</option>
              <option value="active">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
        {hasFilters && <button type="button" className="mt-3 min-h-11 text-small font-semibold underline" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</button>}
      </div>
      {/* 5.3 (L6) — mobile-only sticky bottom bar (removed from the desktop flow) */}
      <div className={stickyBar + " md:hidden"}>
        <a href={workspaceHref("create")} className={primary + " w-full"}>
          {s.newLesson}
        </a>
      </div>
      <ErrorMessage message={error} />
      {busy && (
        <p
          role="status"
          className="flex items-center gap-3 text-small text-site-ink"
        >
          <span aria-hidden className="learning-spinner" />
          Refreshing saved practices…
        </p>
      )}
      {!busy && entries.length > 0 && (
        <p role="status" className="text-small text-site-muted">
          {shown.length} shown · {entries.length} loaded
        </p>
      )}
      {/* 5.6 — lesson cards: one column on mobile/tablet, two columns from 1024px; equal height per row, titles never truncate */}
      <div className="mt-4 grid scroll-mt-18 grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-5">
        {shown.map((entry, idx) => (
          <article
            key={entry.id}
            className="learning-library-card flex h-full flex-col rounded-[16px] border border-site-border bg-white"
          >
            <a
              href={lessonHref(
                entry.lesson_id,
                entry.id,
                entry.status === "completed" ? "complete" : "play",
              )}
              aria-label="Continue practice"
              title={entry.title}
              className="group flex flex-1 gap-4 p-4 lg:p-6"
            >
              <SavedLessonCover entry={entry} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-body-ui break-words text-xl font-bold tracking-[-0.01em] text-site-ink">
                    {entry.title}
                  </h2>
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-site-border bg-white text-site-ink transition-colors duration-[150ms] group-hover:border-accent group-hover:bg-accent"
                  >
                    →
                  </span>
                </div>
                <p className="mt-3 font-body-ui text-small font-medium text-site-muted">
                  {String(idx + 1).padStart(2, "0")} · {entry.total_steps}{" "}
                  checkpoints · {entry.category}
                </p>
                <progress
                  className="library-progress mt-3 w-full"
                  value={entry.completed_steps}
                  max={entry.total_steps}
                  aria-label={`${entry.completed_steps} of ${entry.total_steps} checkpoints practiced`}
                />
                <p className="mt-3 text-small font-medium text-site-muted">
                  {entry.completed_steps} of {entry.total_steps} checkpoints
                  practiced ·{" "}
                  {entry.completed_steps === 0
                    ? "Not started"
                    : entry.status === "completed"
                      ? "Completed"
                      : "In progress"}
                </p>
              </div>
            </a>
            <div className="flex items-center justify-between gap-3 border-t border-site-border px-4 py-3 lg:px-6">
              <a
                href={lessonHref(
                  entry.lesson_id,
                  entry.id,
                  entry.status === "completed" ? "complete" : "play",
                )}
                className={primary}
              >
                {s.lessonsContinue}
              </a>
              {!entry.account_owned && (
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-site-border bg-white px-4 py-2 text-small font-semibold text-site-ink transition-colors hover:text-danger"
                  onClick={() => setDeleteTarget(entry)}
                >
                  {s.lessonsDelete}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!busy && !error && !shown.length && (
        <Card>
          <h2 className="text-xl font-semibold text-site-ink">
            {hasFilters ? "No matching practices." : "Your next practice starts here."}
          </h2>
          <p className="my-3 text-site-muted">
            {hasFilters
              ? "Try another search or clear the filters."
              : "Try a free example or bring a tutorial."}
          </p>
          <a className={primary} href={workspaceHref("create")}>
            Find something to practice
          </a>
        </Card>
      )}
      {cursor && (
        <div className="space-y-2">
        {!!search.trim() && <p className="text-small text-site-muted">More saved practices are available. Load more to include them in your search.</p>}
        <button
          disabled={busy}
          className={secondary}
          onClick={() => void load(true)}
        >
          Load more practices
        </button>
        </div>
      )}
      <button className={secondary} disabled={busy} onClick={() => void load()}>
        Refresh library
      </button>
      {identity.account?.user && (
        <Card>
          <button
            className={secondary}
            onClick={() => {
              setError(null);
              void verify()
                .then(result => { setImports(result.entries); setError(result.warning); })
                .catch((e) => setError(e.message));
            }}
          >
            Connect an earlier browser practice
          </button>
          {imports && (
            <div className="mt-4 space-y-4">
              <p className="text-small text-site-muted">
                Only connect practices that belong to you. Access moves into
                your current account.
              </p>
              {imports.length ? (
                imports.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <span className="text-site-ink">{entry.title}</span>
                    <button
                      className={secondary}
                      onClick={() => void connect(entry)}
                    >
                      Connect to my account
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-site-muted">
                  No accessible browser-only practices found.
                </p>
              )}
            </div>
          )}
        </Card>
      )}
      <a href="/studio" className="block text-small underline text-site-ink">
        Open the earlier practice workspace
      </a>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={s["lessonsDelete.confirmTitle"]}
        body={
          deleteTarget
            ? s["lessonsDelete.confirmBody"].replace(
                "{title}",
                deleteTarget.title,
              )
            : ""
        }
        cancelLabel={s["lessonsDelete.cancel"]}
        confirmLabel={s["lessonsDelete.confirmAction"]}
        onConfirm={() => void removeLesson()}
      />
    </div>
  );
}
function LessonPanel({
  screen,
  professional = false,
}: {
  screen: string;
  professional?: boolean;
}) {
  const identity = useIdentity(),
    router = useRouter(),
    [lesson, setLesson] = useState<Lesson | null>(null),
    [progress, setProgress] = useState<Progress | null>(null),
    [token, setToken] = useState<string | null>(null),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [acking, setAcking] = useState(false),
    [error, setError] = useState<string | null>(null),
    [history, setHistory] = useState<Submission[] | null>(null),
    [feedback, setFeedback] = useState<Assessment | null>(null),
    [feedbackID, setFeedbackID] = useState<string | null>(null),
    [photo, setPhoto] = useState<File | null>(null),
    [photoURL, setPhotoURL] = useState<string | null>(null),
    [historyURL, setHistoryURL] = useState<string | null>(null),
    [localPhoto, setLocalPhoto] = useState<string | null>(null),
    [reportOpen, setReportOpen] = useState(false),
    [reportReason, setReportReason] = useState("incorrect_instructions"),
    [reportDetails, setReportDetails] = useState(""),
    [reportResult, setReportResult] = useState<string | null>(null),
    [revisit, setRevisit] = useState(false),
    [checkConfirm, setCheckConfirm] = useState(false);
  const active = useRef(true),
    pending = useRef<{ fingerprint: string; key: string } | null>(null),
    ackKey = useRef<{ step: string; key: string } | null>(null),
    reportPending = useRef<{ key: string; body: unknown } | null>(null),
    reportTarget = useRef<{
      step_id: string;
      submission_id: string | null;
      camera_feedback_id: string | null;
      observations: string[];
    } | null>(null),
    mediaStop = useRef<(preserve?: boolean) => void>(() => {}),
    objectURLs = useRef(new Set<string>()),
    observations = useRef<string[]>([]);
  useEffect(
    () => () => {
      if (photoURL) {
        URL.revokeObjectURL(photoURL);
        objectURLs.current.delete(photoURL);
      }
    },
    [photoURL],
  );
  useEffect(
    () => () => {
      if (historyURL) {
        URL.revokeObjectURL(historyURL);
        objectURLs.current.delete(historyURL);
      }
    },
    [historyURL],
  );
  useEffect(
    () => () => {
      if (localPhoto) {
        URL.revokeObjectURL(localPhoto);
        objectURLs.current.delete(localPhoto);
      }
    },
    [localPhoto],
  );
  const objectURL = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    objectURLs.current.add(url);
    return url;
  }, []);
  const noteObservations = useCallback((list: string[]) => {
    observations.current = list;
  }, []);
  const apply = useCallback(
    (value: Progress, currentLesson: Lesson, access?: string | null) => {
      setProgress(value);
      identity.remember(currentLesson, value, access);
    },
    [identity.remember],
  );
  const reload = useCallback(async () => {
    const query = currentQuery(),
      id = query.get("session_id"),
      lessonID =
        query.get("lesson_id") || window.location.pathname.split("/")[2];
    setError(null);
    try {
      const access = id
        ? identity.guestEntries().find((entry) => entry.id === id)?.token ||
          null
        : null;
      const value = id
        ? await identity.request<Progress>("/v1/sessions/" + id, undefined, {
            token: access,
          })
        : null;
      const loaded = await identity.request<Lesson>(
        "/v1/lessons/" + (value?.lesson_id || lessonID),
        undefined,
        { token: access },
      );
      if (!active.current) return;
      setToken(access);
      setLesson(loaded);
      setProgress(value);
      setIndex(
        value?.current_step_id
          ? Math.max(
              0,
              loaded.steps.findIndex(
                (step) => step.id === value.current_step_id,
              ),
            )
          : 0,
      );
      if (value) identity.remember(loaded, value, access);
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "Could not open practice.");
    }
  }, [identity.request, identity.guestEntries, identity.remember]);
  useEffect(() => {
    active.current = true;
    void reload();
    return () => {
      active.current = false;
      mediaStop.current();
      for (const url of objectURLs.current) URL.revokeObjectURL(url);
      objectURLs.current.clear();
    };
  }, [reload]);
  useEffect(() => {
    setPhoto(null);
    setPhotoURL(null);
    setLocalPhoto(null);
    setFeedback(null);
    setFeedbackID(null);
    setReportOpen(false);
    pending.current = null;
    ackKey.current = null;
    observations.current = [];
    mediaStop.current();
  }, [index]);
  const path = progress ? "/v1/sessions/" + progress.session_id : "";
  const aiReady = aiChecksAvailable(identity.config);
  const step = lesson?.steps[index],
    current = !!progress && progress.current_step_id === step?.id;
  async function start() {
    if (!lesson || busy) return;
    setBusy(true);
    setError(null);
    try {
      const value = await identity.request<Progress>("/v1/sessions", {
        lesson_id: lesson.id,
        save_to_account: !!identity.account?.user,
      });
      if (!active.current) return;
      identity.remember(lesson, value, value.access_token);
      router.push(lessonHref(lesson.id, value.session_id, "play"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start practice.");
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    mediaStop.current();
    setFeedback(null);
    setFeedbackID(null);
    await reload();
  }
  async function acknowledge() {
    if (!lesson || !progress || !step || !current || busy) return;
    const seen = [...observations.current];
    setBusy(true);
    setAcking(true);
    setError(null);
    ackKey.current =
      ackKey.current?.step === step.id
        ? ackKey.current
        : { step: step.id, key: crypto.randomUUID() };
    try {
      const value = await identity.request<{ progress: Progress }>(
        path + "/acknowledgements",
        { step_id: step.id, observations: seen },
        { token, key: ackKey.current.key },
      );
      if (!active.current) return;
      apply(value.progress, lesson, token);
      ackKey.current = null;
      mediaStop.current();
      if (value.progress.current_step_id)
        setIndex(
          Math.max(
            0,
            lesson.steps.findIndex(
              (item) => item.id === value.progress.current_step_id,
            ),
          ),
        );
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "Could not save progress.");
    } finally {
      if (active.current) {
        setBusy(false);
        setAcking(false);
      }
    }
  }
  async function checkPhoto() {
    if (!photo || !step || !current || !progress || !lesson || busy) return;
    mediaStop.current(true);
    setBusy(true);
    setError(null);
    setFeedback(null);
    setFeedbackID(null);
    try {
      const body = { step_id: step.id, ...(await photoData(photo)) },
        fingerprint = JSON.stringify(body);
      pending.current =
        pending.current?.fingerprint === fingerprint
          ? pending.current
          : { fingerprint, key: crypto.randomUUID() };
      const result = await identity.request<{
        progress: Progress;
        submission: Submission;
      }>(path + "/submissions", body, { token, key: pending.current.key });
      if (!active.current) return;
      apply(result.progress, lesson, token);
      if (result.submission.status === "processing") {
        setError(
          "This photo is still processing. Refresh history before submitting again.",
        );
      } else if (result.submission.status === "failed") {
        pending.current = null;
        setError("The photo check failed. You can retry as a new submission.");
      } else {
        setFeedback(result.submission.assessment);
        setFeedbackID(result.submission.id);
        pending.current = null;
      }
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "Photo check failed.");
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function loadHistory() {
    if (!progress) return;
    setBusy(true);
    setError(null);
    try {
      const result = await identity.request<{ submissions: Submission[] }>(
        path + "/submissions",
        undefined,
        { token },
      );
      if (active.current) setHistory(result.submissions);
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "History failed.");
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function historyImage(submission: Submission, remove = false) {
    setBusy(true);
    setError(null);
    try {
      const url = path + "/submissions/" + submission.id + "/image";
      if (remove) {
        await identity.request(url, undefined, { token, method: "DELETE" });
        if (active.current) {
          setHistoryURL(null);
          setHistory(
            (items) =>
              items?.map((item) =>
                item.id === submission.id
                  ? { ...item, image_available: false }
                  : item,
              ) || null,
          );
        }
      } else {
        const image = await identity.request<Blob>(url, undefined, {
          token,
          image: true,
        });
        if (active.current) setHistoryURL(objectURL(image));
      }
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "Photo action failed.");
    } finally {
      if (active.current) setBusy(false);
    }
  }

  function report(saved?: Submission) {
    if (!step) return;
    const seen =
      saved && saved.step_id !== step.id ? [] : [...observations.current];
    mediaStop.current();
    setReportOpen(true);
    setReportResult(null);
    setReportReason(
      saved || feedback ? "ai_feedback" : "incorrect_instructions",
    );
    setReportDetails("");
    reportPending.current = null;
    reportTarget.current = {
      step_id: saved?.step_id || step.id,
      submission_id: saved?.id || feedbackID,
      camera_feedback_id: saved ? null : feedback?.feedback_id || null,
      observations: seen,
    };
  }
  async function sendReport() {
    if (!step || !progress || busy) return;
    setBusy(true);
    setError(null);
    reportPending.current ||= {
      key: crypto.randomUUID(),
      body: {
        ...reportTarget.current,
        reason: reportReason,
        details: reportDetails,
      },
    };
    try {
      const value = await identity.request<{ id: string }>(
        path + "/reports",
        reportPending.current.body,
        { token, key: reportPending.current.key },
      );
      if (active.current) setReportResult(value.id);
    } catch (e) {
      if (active.current)
        setError(
          e instanceof Error
            ? e.message
            : "Could not confirm the report. Retry the same report.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  if (!lesson || !step)
    return (
      <>
        <ErrorMessage message={error} />
        {!error && <p role="status">Opening saved practice…</p>}
        <a href={workspaceHref("library")} className={secondary}>
          Back to your lessons
        </a>
      </>
    );
  const completed = progress?.status === "completed";
  // 5.10/5.6 — history and report render once, below the play columns (inside
  // the completion right column when complete).
  const historyBlock = progress && (
    <Card>
      {/* 5.3 (L11d) — the practice-history actions sit in the card's header row,
          right-aligned. */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          className={secondary}
          disabled={busy}
          onClick={() => void loadHistory()}
        >
          View / refresh practice history
        </button>
        <button className={secondary} disabled={busy} onClick={() => report()}>
          Report a problem
        </button>
      </div>
      {history && (
        <ul className="mt-5 space-y-5">
          {history.length ? (
            history.map((item) => (
              <li key={item.id} className="border-t border-site-border pt-4">
                <strong className="text-site-ink">
                  Step{" "}
                  {lesson.steps.findIndex((step) => step.id === item.step_id) +
                    1}{" "}
                  · {item.assessment?.result || item.status}
                </strong>
                <p className="my-3 text-site-ink">
                  {item.assessment?.feedback}
                </p>
                <p className="text-small text-site-muted">
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {item.image_available && (
                    <>
                      <button
                        disabled={busy}
                        className={secondary}
                        onClick={() => void historyImage(item)}
                      >
                        View saved photo
                      </button>
                      <button
                        disabled={busy}
                        className={secondary}
                        onClick={() => void historyImage(item, true)}
                      >
                        Delete saved photo
                      </button>
                    </>
                  )}
                  <button
                    disabled={busy}
                    className="underline text-site-ink"
                    onClick={() => report(item)}
                  >
                    Report this feedback
                  </button>
                </div>
              </li>
            ))
          ) : (
            /* 5.3 (L11d) — the empty state uses the shared centred anatomy. */
            <li className="py-8 text-center text-small text-site-muted">
              No photo submissions yet. Self-reviews are included in your
              checkpoint totals.
            </li>
          )}
        </ul>
      )}
      {historyURL && (
        <div className="mt-5">
          <img
            className="max-h-96 w-full rounded-2xl object-contain"
            src={historyURL}
            alt="Your private saved practice photo"
          />
          <button
            className="mt-3 underline text-site-ink"
            onClick={() => setHistoryURL(null)}
          >
            Close photo
          </button>
        </div>
      )}
    </Card>
  );
  const reportBlock = reportOpen && (
    <Card>
      <h2 className="text-2xl font-semibold text-site-ink">Report a problem</h2>
      {reportResult ? (
        <p role="status" className="mt-4 text-site-ink">
          Report saved for the team. Reference: {reportResult}
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendReport();
          }}
          className="mt-5 space-y-4"
        >
          <p className="text-small text-site-muted">
            The team receives this checkpoint, source and selected feedback.
            Photos are not included.
          </p>
          <label className="block text-site-ink">
            Issue type
            <select
              className={field}
              value={reportReason}
              disabled={busy || !!reportPending.current}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="incorrect_instructions">
                Incorrect instructions
              </option>
              <option value="ai_feedback">Poor AI feedback</option>
              <option value="broken_source">Broken source link</option>
              <option value="other">Something else</option>
            </select>
          </label>
          <label className="block text-site-ink">
            What went wrong?
            <textarea
              className={field}
              rows={4}
              maxLength={2000}
              value={reportDetails}
              readOnly={!!reportPending.current}
              disabled={busy}
              onChange={(e) => setReportDetails(e.target.value)}
            />
          </label>
          <button className={primary} disabled={busy}>
            {busy
              ? "Saving…"
              : reportPending.current
                ? "Retry same report"
                : "Send report"}
          </button>
        </form>
      )}
      <button
        className="mt-4 underline text-site-ink"
        disabled={busy}
        onClick={() => setReportOpen(false)}
      >
        Close report
      </button>
    </Card>
  );
  return (
    <div className="space-y-8 lg:space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 5.4 (M4c) — ONE back link per player: on Professional it lives in
            the banner (rendering immediately, before the account check), on
            Hobby here in the LessonPanel row. */}
        {!professional && (
          <a
            href={workspaceHref("library")}
            className="text-small underline text-site-ink"
          >
            ← Your lessons
          </a>
        )}
        {progress && (
          <button
            className={secondary}
            disabled={busy}
            onClick={() => void refresh()}
          >
            Refresh saved progress
          </button>
        )}
      </div>
      <header>
        <p className="text-small uppercase tracking-wider text-site-muted">
          {lesson.category} · {lesson.steps.length} checkpoints
        </p>
        <h1 className="mt-3 font-body-ui text-[1.75rem] font-bold tracking-[-0.01em] text-site-ink">
          {lesson.title}
        </h1>
        {progress && (
          <p className="mt-3 text-site-muted">
            {progress.completed_step_ids.length} of {lesson.steps.length}{" "}
            checkpoints practiced
          </p>
        )}
      </header>
      <ErrorMessage message={error} />
      {completed && !revisit ? (
        /* 5.6 — completion state: summary left, history/actions right (same two columns) */ <div className="lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-5 lg:sticky lg:top-20 lg:max-w-[560px]">
            <Card>
              <h2 className="text-3xl font-bold text-site-ink">
                A step further along.
              </h2>
              <p className="my-4 text-site-ink">
                All checkpoints are saved.{" "}
                {
                  progress.completed_checkpoints.filter(
                    (item) => item.kind === "photo",
                  ).length
                }{" "}
                photo-supported ·{" "}
                {
                  progress.completed_checkpoints.filter(
                    (item) => item.kind === "self",
                  ).length
                }{" "}
                self-reviewed.
              </p>
              <p className="text-small text-site-muted">
                Practice progress does not certify competence or safety.
              </p>
              <SavedObservations progress={progress} lesson={lesson} />
            </Card>
          </div>
          <div className="min-w-0 space-y-5">
            <Card>
              <h2 className="text-xl font-semibold text-site-ink">
                Revisit a step
              </h2>
              <label className="mt-3 block text-small">
                Step
                <select
                  className={field}
                  value={index}
                  title={lesson.steps[index]?.title || undefined}
                  onChange={(event) => {
                    setIndex(Number(event.target.value));
                    setRevisit(true);
                  }}
                >
                  {lesson.steps.map((item, i) => (
                    <option key={item.id} value={i}>
                      {i + 1}. {item.title || item.instructions}
                    </option>
                  ))}
                </select>
              </label>
              <StepQuestions
                key={progress.session_id + ":questions:" + step.id}
                sessionID={progress.session_id}
                step={step}
                token={token}
                disabled={busy}
              />
            </Card>
            <Card>
              <div className="flex flex-wrap gap-3">
                <button
                  disabled={busy}
                  className={primary}
                  onClick={() => void start()}
                >
                  Practice again
                </button>
                <a className={secondary} href={workspaceHref("create")}>
                  Try another skill
                </a>
              </div>
            </Card>
            {historyBlock}
            {reportBlock}
          </div>
        </div>
      ) : /* 5.6 — lesson overview: cover left, path + materials right, same two-column desktop grid */ screen ===
          "overview" || !progress ? (
        <div className="mt-4 scroll-mt-18 lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="mb-8 min-w-0 self-start lg:mb-0 lg:sticky lg:top-20 lg:max-w-[560px]">
            <div className="rounded-[16px] border border-site-border bg-white p-3">
              <SavedLessonCover lesson={lesson} token={token} large />
            </div>
          </div>
          <div className="min-w-0 space-y-5">
            <Card>
              <h2 className="text-xl font-semibold text-site-ink">
                Your path, step by step.
              </h2>
              <ol className="learning-path mt-5 space-y-5">
                {lesson.steps.map((item, i) => (
                  <li
                    key={item.id}
                    data-state={
                      progress?.completed_step_ids.includes(item.id)
                        ? "done"
                        : progress?.current_step_id === item.id ||
                            (!progress && i === 0)
                          ? "current"
                          : "upcoming"
                    }
                  >
                    <strong className="text-site-ink">
                      {i + 1}. {item.title || item.instructions}
                    </strong>
                    <p className="mt-1 text-site-muted">
                      {item.expected_visual_result}
                    </p>
                    <span className="text-small text-site-ink">
                      {item.photo_assessable === false
                        ? "Self-review"
                        : "Photo checkpoint"}
                    </span>
                    {progress && (
                      <StepQuestionToggle
                        sessionID={progress.session_id}
                        step={item}
                        token={token}
                        disabled={busy}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold text-site-ink">
                Bring to the table.
              </h2>
              <ul className="my-4 list-inside list-disc text-site-ink">
                {lesson.materials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Source lesson={lesson} />
              <div className="mt-8">
                {progress ? (
                  <a
                    className={primary}
                    href={lessonHref(lesson.id, progress.session_id, "play")}
                  >
                    Continue practicing
                  </a>
                ) : (
                  <button
                    disabled={busy}
                    className={primary}
                    onClick={() => void start()}
                  >
                    Start practicing
                  </button>
                )}
                {progress && (
                  <a
                    className={secondary + " mt-3 w-full"}
                    href={lessonHref(lesson.id, progress.session_id, "live")}
                  >
                    Live camera practice · free
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* 5.6 — runtime play: two columns on desktop (progress + target visual + step text left, sticky; Check / camera panel / Ask right); single column on mobile with the primary step action in the sticky bottom bar */ <div className="scroll-mt-18 lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-5 lg:sticky lg:top-20 lg:max-w-[560px]">
            <label className="block font-semibold text-site-ink">
              Checkpoint
              <select
                className={field}
                value={index}
                disabled={busy}
                title={step.title || step.instructions}
                onChange={(event) => setIndex(Number(event.target.value))}
              >
                {/* 5.4 (M4b) — the dropdown's closed display shows the step
                    position, not the full title; the title renders once as the
                    step card heading below. */}
                {lesson.steps.map((item, i) => (
                  <option key={item.id} value={i}>
                    {`Step ${i + 1} of ${lesson.steps.length}`}
                    {progress.completed_step_ids.includes(item.id)
                      ? " · practiced"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
            {/* 5.1.3 — explicit Previous / Next step nav. Previous disabled on step 1; on the last step the primary action stays the self-review / check action already present. */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={busy || index === 0}
                className={secondary + " flex-1"}
                onClick={() => setIndex(Math.max(0, index - 1))}
              >
                {s.prevStep}
              </button>
              <button
                type="button"
                disabled={busy || index >= lesson.steps.length - 1}
                className={secondary + " flex-1"}
                onClick={() =>
                  setIndex(Math.min(lesson.steps.length - 1, index + 1))
                }
              >
                {s.nextStep}
              </button>
            </div>
            <SavedObservations
              progress={progress}
              lesson={lesson}
              stepID={step.id}
            />
            <Card>
              <p className="step-label">Your target · step {index + 1}</p>
              <h2 className="mt-3 text-2xl font-bold text-site-ink">
                {step.title || "Try this step"}
              </h2>
              <p className="mt-4 text-xl text-site-ink">{step.instructions}</p>
              <div className="my-5 rounded-2xl bg-site-page p-4 text-site-ink lg:p-6">
                <p>{step.expected_visual_result}</p>
                <StepIllustration
                  key={lesson.id + ":" + step.id}
                  lessonID={lesson.id}
                  step={step}
                  token={token}
                  disabled={busy}
                  onPrepare={() => mediaStop.current()}
                />
                {lesson.steps[index + 1] && (
                  <StepIllustrationPrefetch
                    key={"prefetch:" + lesson.steps[index + 1].id}
                    lessonID={lesson.id}
                    step={lesson.steps[index + 1]}
                    token={token}
                  />
                )}
              </div>
              <ul className="space-y-3 text-site-ink">
                {step.assessment_criteria?.map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
              <p className="mt-4 text-small text-site-muted">
                {step.visual_limits?.join(" ")}
              </p>
              {step.coaching_origin && (
                <p className="mt-3 text-small text-site-ink">
                  {step.coaching_origin === "observed"
                    ? "Observed in the source demonstration."
                    : "Suggested coaching exercise, added by AI."}
                </p>
              )}
              <Source lesson={lesson} step={step} />
            </Card>
          </div>
          <div className="min-w-0 mt-8 space-y-5 lg:mt-0">
            <Card>
              {!current ? (
                <>
                  <h2 className="text-2xl font-bold text-site-ink">
                    Review this checkpoint.
                  </h2>
                  <p className="my-4 text-site-ink">
                    Reading ahead does not change your saved progress.
                  </p>
                  {feedback && <Feedback value={feedback} />}
                  <button
                    className={primary}
                    onClick={() =>
                      setIndex(
                        Math.max(
                          0,
                          lesson.steps.findIndex(
                            (item) => item.id === progress.current_step_id,
                          ),
                        ),
                      )
                    }
                  >
                    Return to current checkpoint
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-site-ink">
                    Make it. Then show it.
                  </h2>
                  {step.photo_assessable === false ? (
                    lesson.source_url ? (
                      <p className="mt-4 text-site-muted">
                        This step needs listening, thinking or a quality that a
                        photo cannot establish. Practice it, then acknowledge
                        your work.
                      </p>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-site-border bg-site-page p-4">
                        <h3 className="font-semibold text-site-ink">
                          {s["freeSteps.localCompareTitle"]}
                        </h3>
                        <p className="mt-3 text-small text-site-muted">
                          {s["freeSteps.localCompareBody"]}
                        </p>
                        <label className="mt-3 block text-small font-semibold text-site-ink">
                          {s["freeSteps.choosePhoto"]}
                          <input
                            className="mt-4 w-full rounded-2xl border border-site-border bg-white px-4 py-3 text-small text-site-ink"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            disabled={busy}
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setLocalPhoto(f ? objectURL(f) : null);
                            }}
                          />
                        </label>
                        {localPhoto && (
                          <img
                            className="mt-3 max-h-72 w-full rounded-xl object-contain"
                            src={localPhoto}
                            alt="Your selected work"
                          />
                        )}
                      </div>
                    )
                  ) : (
                    <>
                      <p className="my-4 text-small text-site-muted">
                        Check my work sends your photo to Meta and saves it
                        privately with this practice. You can delete it from
                        history.
                      </p>
                      <label className="block text-site-ink">
                        Photo of your work
                        <input
                          className={field}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setPhoto(file);
                            setPhotoURL(file ? objectURL(file) : null);
                            pending.current = null;
                            setFeedback(null);
                            setFeedbackID(null);
                          }}
                        />
                      </label>
                      {photoURL && (
                        <img
                          className="my-4 max-h-80 w-full rounded-2xl object-contain"
                          src={photoURL}
                          alt="Your selected work"
                        />
                      )}
                      {!aiReady && (
                        <p className="mt-3 text-small text-site-muted">
                          AI photo checks are unavailable. Use the free camera
                          preview or self-review below.
                        </p>
                      )}
                    </>
                  )}
                  <LiveCamera
                    key={progress.session_id + ":" + step.id}
                    lesson={lesson}
                    step={step}
                    progress={progress}
                    token={token}
                    disabled={busy && !acking}
                    stopRef={mediaStop}
                    initialLive={screen === "live"}
                    onChecksChange={noteObservations}
                    onClearFeedback={() => {
                      setFeedback(null);
                      setFeedbackID(null);
                    }}
                    onFeedback={(value) => {
                      setFeedback(value);
                      setFeedbackID(null);
                    }}
                    onError={setError}
                  />
                  {feedback && <Feedback value={feedback} />}
                  {/* 5.5 — the step's primary action renders inline on desktop, in the sticky bottom bar on mobile; each shows on exactly one breakpoint */}
                  <div className="hidden lg:block">
                    {step.photo_assessable === false ? (
                      <button
                        disabled={busy}
                        className={primary + " w-full"}
                        onClick={() => void acknowledge()}
                      >
                        I’ve practiced this step · self-review
                      </button>
                    ) : (
                      <button
                        className={primary + " w-full"}
                        disabled={!photo || busy || !aiReady}
                        onClick={() => setCheckConfirm(true)}
                      >
                        {busy ? "Working…" : "Check my work"}
                      </button>
                    )}
                  </div>
                  {step.photo_assessable === false ? null : (
                    <button
                      disabled={busy}
                      className={secondary + " mt-4 w-full lg:mt-8"}
                      onClick={() => void acknowledge()}
                    >
                      I’ve practiced this step · self-review
                    </button>
                  )}
                  <p className="mt-3 text-small text-site-muted">
                    Self-review records practice, not an AI pass or safety
                    certification.
                  </p>
                  {progress && (
                    <StepQuestions
                      key={progress.session_id + ":questions:" + step.id}
                      sessionID={progress.session_id}
                      step={step}
                      token={token}
                      disabled={busy}
                    />
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      )}
      {!completed && historyBlock}
      {!completed && reportBlock}
      <p className="text-small text-site-muted">
        {lesson.safety_notice ||
          "Visual feedback cannot certify physical safety."}
      </p>
      <ConfirmDialog
        open={checkConfirm}
        onOpenChange={(open) => {
          if (!open) setCheckConfirm(false);
        }}
        title={s["check.confirmTitle"]}
        body={
          step
            ? s["check.confirmBody"].replace(
                "{step}",
                step.title || "this step",
              )
            : ""
        }
        cancelLabel={s["check.cancel"]}
        confirmLabel={s["check.confirmAction"]}
        onConfirm={() => {
          setCheckConfirm(false);
          void checkPhoto();
        }}
      />
      {!completed && screen !== "overview" && progress && current && (
        <div className={stickyBar + " lg:hidden"}>
          {step.photo_assessable === false ? (
            <button
              disabled={busy}
              className={primary + " w-full"}
              onClick={() => void acknowledge()}
            >
              I’ve practiced this step · self-review
            </button>
          ) : (
            <button
              className={primary + " w-full"}
              disabled={!photo || busy || !aiReady}
              onClick={() => setCheckConfirm(true)}
            >
              {busy ? "Working…" : "Check my work"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Source({ lesson, step }: { lesson: Lesson; step?: Step }) {
  const url = step?.source_reference?.url || lesson.source_url;
  return (
    <div className="mt-5 space-y-3 text-small text-site-muted">
      {url && /^https:\/\//.test(url) ? (
        <a
          className="underline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the source ↗
        </a>
      ) : (
        <p>Source: supplied instructions</p>
      )}
      {lesson.source_attribution && <p>{lesson.source_attribution}</p>}
      {step?.source_reference?.quote && (
        <details>
          <summary>Read the source passage</summary>
          <blockquote className="mt-3 border-l-2 border-accent pl-3">
            {step.source_reference.quote}
          </blockquote>
        </details>
      )}
      {lesson.practice_restrictions?.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}
function Feedback({ value }: { value: Assessment }) {
  return (
    <div
      role="status"
      className="mt-8 rounded-2xl border border-site-border bg-site-page p-4 lg:p-6"
    >
      <h3 className="font-semibold">
        {
          {
            pass: "The visible details match.",
            retry: "One small adjustment.",
            uncertain: "Let’s get a clearer look.",
          }[value.result]
        }
      </h3>
      <p className="mt-3">{value.feedback}</p>
      <ul className="mt-3 list-inside list-disc">
        {[...value.corrections, ...value.requested_evidence].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <details className="mt-4 text-small">
        <summary>Evidence and limits</summary>
        {value.criteria.map((item) => (
          <p className="mt-3" key={item.criterion}>
            <strong>
              {item.criterion} · {item.status}
            </strong>
            <br />
            {item.evidence}
          </p>
        ))}
        <p className="mt-3">
          {value.provider} · {value.model}
        </p>
      </details>
    </div>
  );
}
