import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";
import Link from "next/link";
import { SatinBackdrop } from "@/components/create/SatinBackdrop";

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
    <div className="-mt-24 relative min-h-[100svh] overflow-hidden">
      <SatinBackdrop />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(18,10,2,0.28),rgba(8,4,1,0.62)_78%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-32 pb-16">
        <h1 className="font-display-ui text-[2.25rem] font-extrabold leading-tight tracking-tight text-white">
          {s.processingHeading}
        </h1>

        {/* source summary card — glass */}
        <div className="mt-6 rounded-[20px] border border-white/15 bg-white/[0.07] p-4 backdrop-blur-xl">
          <p className="truncate font-mono text-small text-white/50">
            {sampleLesson.meta}
          </p>
          <div className="mt-3 space-y-2">
            <span
              aria-hidden
              className="create-skeleton block h-3 w-3/4 rounded opacity-90"
            />
            <span
              aria-hidden
              className="create-skeleton block h-3 w-1/2 rounded opacity-90"
            />
          </div>
        </div>

        {/* THE STAGES — path language on dark */}
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
                        ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[#16161A]"
                        : stage.status === "active"
                          ? "h-6 w-6 shrink-0 rounded-full border-2 border-accent bg-white/90"
                          : "h-6 w-6 shrink-0 rounded-full border-2 border-white/25 bg-transparent"
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
                        (segmentInk ? "bg-accent/70" : "bg-white/15")
                      }
                    />
                  )}
                </div>
                <div
                  className={
                    "mb-5 min-w-0 flex-1 rounded-2xl p-4 " +
                    (stage.status === "active"
                      ? "border border-white/15 bg-white/[0.06] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]"
                      : "")
                  }
                >
                  <p
                    className={
                      "font-display-ui text-[1.125rem] font-bold leading-tight " +
                      (stage.status === "pending"
                        ? "text-white/40"
                        : "text-white")
                    }
                  >
                    {stage.label}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* slim progress bar — amber on a dark hairline track */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-accent shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>

        <p className="mt-5 font-body-ui text-small text-white/65">
          {s.processingNote}
        </p>

        <div className="mt-5 flex flex-col items-center gap-2">
          <Link
            href="/create"
            className="font-body-ui text-small font-medium text-white/60 underline-offset-4 transition-colors duration-[150ms] hover:text-white hover:underline"
          >
            {s.backToImport}
          </Link>
          <Link
            href="/create/review"
            className="font-body-ui text-small font-semibold text-amber-300 underline-offset-4 transition-colors duration-[150ms] hover:text-white hover:underline"
          >
            {s.seeReviewScreen}
          </Link>
        </div>
      </div>
    </div>
  );
}