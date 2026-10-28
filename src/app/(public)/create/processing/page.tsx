import s from "@/lib/strings";
import { Button } from "@/components/Button";
import { SkeletonCard } from "@/components/SkeletonCard";

export default function ProcessingPage() {
  const stages = [
    { label: s.procStageFetch, status: "done" as const },
    { label: s.procStageSample, status: "active" as const },
    { label: s.procStageDerive, status: "pending" as const },
  ];

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      <h1 className="font-display-ui text-[2.25rem] font-extrabold leading-tight text-site-ink">
        {s.processingHeading}
      </h1>

      <ol className="mt-8 space-y-4">
        {stages.map((stage, i) => (
          <li key={stage.label} className="flex items-center gap-3">
            <span
              className={
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-caption font-semibold " +
                (stage.status === "done"
                  ? "border-accent bg-accent text-white"
                  : stage.status === "active"
                    ? "border-accent bg-transparent text-accent animate-progress"
                    : "border-site-border bg-transparent text-site-muted")
              }
            >
              {stage.status === "done" ? "✓" : i + 1}
            </span>
            <span
              className={
                "font-body-ui text-[1.125rem] font-semibold " +
                (stage.status === "pending" ? "text-site-muted" : "text-site-ink")
              }
            >
              {stage.label}
            </span>
            {stage.status === "active" ? (
              <span className="ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-site-page">
                <span className="block h-full w-1/2 rounded-full bg-accent animate-indeterminate" />
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <p className="font-body-ui mt-6 text-small text-site-muted">{s.processingNote}</p>

      <div className="mt-8">
        <Button href="/create/review" variant="secondary" className="w-full">
          {s.seeReviewScreen}
        </Button>
      </div>
    </div>
  );
}