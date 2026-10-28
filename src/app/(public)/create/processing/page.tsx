import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";
import Link from "next/link";

type StageStatus = "done" | "active" | "pending";

export default function ProcessingPage() {
  const stages: { label: string; status: StageStatus }[] = [
    { label: s.procStageFetch, status: "done" },
    { label: s.procStageSample, status: "active" },
    { label: s.procStageDerive, status: "pending" },
  ];
  const total = stages.length;
  const currentIdx = stages.findIndex((st) => st.status === "active");

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      <h1 className="font-display-ui text-[2.25rem] font-extrabold leading-tight tracking-tight text-site-ink">
        {s.processingHeading}
      </h1>

      {/* source summary card */}
      <div className="mt-6 rounded-[20px] border border-site-border bg-white p-4">
        <p className="truncate font-mono text-small text-site-muted">
          {sampleLesson.meta}
        </p>
        <div className="mt-3 space-y-2">
          <span aria-hidden className="create-skeleton block h-3 w-3/4 rounded" />
          <span aria-hidden className="create-skeleton block h-3 w-1/2 rounded" />
        </div>
      </div>

      {/* THE STAGES — path language: nodes + connecting line */}
      <ol className="mt-6 flex flex-col">
        {stages.map((stage, i) => {
          const segmentInk =
            i < total - 1 && stages[i + 1].status !== "pending";
          return (
            <li key={stage.label} className="flex gap-4">
              <div className="flex w-8 shrink-0 flex-col items-center">
                <span
                  className={
                    stage.status === "done"
                      ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-site-ink text-white"
                      : stage.status === "active"
                        ? "h-6 w-6 shrink-0 rounded-full border-2 border-accent bg-site-ink"
                        : "h-6 w-6 shrink-0 rounded-full border-2 border-site-border-2 bg-transparent"
                  }
                >
                  {stage.status === "done" && (
                    <svg
                      aria-hidden
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                {i < total - 1 && (
                  <span
                    className={
                      "w-px flex-1 " +
                      (segmentInk ? "bg-site-ink/70" : "bg-site-border")
                    }
                  />
                )}
              </div>
              <div
                className={
                  "mb-5 min-w-0 flex-1 rounded-2xl p-4 " +
                  (stage.status === "active"
                    ? "border border-site-border bg-white shadow-sm"
                    : "")
                }
              >
                <p
                  className={
                    "font-display-ui text-[1.125rem] font-bold leading-tight " +
                    (stage.status === "pending"
                      ? "text-site-muted"
                      : "text-site-ink")
                  }
                >
                  {stage.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* slim progress bar — amber fill on a hairline track */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-site-border">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
        />
      </div>

      <p className="mt-5 font-body-ui text-small text-site-muted">
        {s.processingNote}
      </p>

      <div className="mt-5 flex flex-col items-center gap-2">
        <Link
          href="/create"
          className="font-body-ui text-small font-medium text-site-muted underline-offset-4 transition-colors duration-[150ms] hover:text-site-ink hover:underline"
        >
          {s.backToImport}
        </Link>
        <Link
          href="/create/review"
          className="font-body-ui text-small font-medium text-site-muted underline-offset-4 transition-colors duration-[150ms] hover:text-site-ink hover:underline"
        >
          {s.seeReviewScreen}
        </Link>
      </div>
    </div>
  );
}