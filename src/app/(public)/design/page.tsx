import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { VerdictChip } from "@/components/VerdictChip";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { StepCard } from "@/components/StepCard";
import { LessonCard } from "@/components/LessonCard";
import { KeyframeVisual } from "@/components/KeyframeVisual";

const routes: { path: string; label: string }[] = [
  { path: "/", label: "Landing" },
  { path: "/create", label: "Create — import" },
  { path: "/create/processing", label: "Create — processing" },
  { path: "/create/review", label: "Create — review" },
  { path: "/lessons", label: "Your lessons" },
  { path: "/lesson/sample", label: "Lesson overview" },
  { path: "/lesson/sample/play", label: "Player" },
  { path: "/lesson/sample/play/camera", label: "Camera" },
  { path: "/lesson/sample/live", label: "Live mode" },
  { path: "/lesson/sample/complete", label: "Completion" },
  { path: "/privacy", label: "Privacy" },
  { path: "/design", label: "Design index" },
];

const variants: { path: string; label: string }[] = [
  { path: "/?state=empty", label: "Landing · your lessons empty" },
  { path: "/create?state=invalid", label: "Import · invalid link" },
  { path: "/create?state=failed", label: "Import · fetch failed" },
  { path: "/create?state=not-configured", label: "Import · not configured" },
  { path: "/lessons?state=empty", label: "Lessons · empty" },
  { path: "/lesson/sample/play?state=checking", label: "Player · checking" },
  { path: "/lesson/sample/play?state=right", label: "Player · right" },
  { path: "/lesson/sample/play?state=wrong", label: "Player · wrong" },
  { path: "/lesson/sample/play?state=canttell", label: "Player · can't tell" },
  { path: "/lesson/sample/live?state=check", label: "Live · check" },
  { path: "/lesson/sample/live?state=wrong", label: "Live · wrong" },
];

const tokens: { name: string; var: string; hex: string }[] = [
  { name: "bg", var: "--bg", hex: "#16161A" },
  { name: "surface", var: "--surface", hex: "#1B1B1F" },
  { name: "fg", var: "--fg", hex: "#FFFFFF" },
  { name: "muted", var: "--muted", hex: "#A1A1AA" },
  { name: "accent", var: "--accent", hex: "#F59E0B" },
  { name: "accent-strong", var: "--accent-strong", hex: "#D97706" },
  { name: "wrong", var: "--wrong", hex: "#E5484D" },
  { name: "line", var: "--line", hex: "#2E2E33" },
];

const typeScale: { name: string; cls: string }[] = [
  { name: "display", cls: "text-display" },
  { name: "h1", cls: "text-h1" },
  { name: "h2", cls: "text-h2" },
  { name: "body", cls: "text-body" },
  { name: "small", cls: "text-small" },
  { name: "caption", cls: "text-caption" },
];

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 rounded-[24px] border border-site-border bg-white p-6 shadow-[0_12px_36px_-30px_rgba(22,22,26,0.6)]">
      <h2 className="font-display-ui text-[1.25rem] font-bold leading-heading text-site-ink">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-site-page">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[560px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(245,158,11,0.2), transparent)",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10">
        <header>
          <h1 className="section-title text-site-ink">Design index</h1>
          <div
            aria-hidden
            className="mt-2 h-1 w-14 rounded-full bg-accent"
          />
          <p className="mt-3 max-w-2xl text-body text-muted">
            Internal review scaffold. Nothing here is a working tool — routes
            render fixture states only. Compare the inventory below against
            DESIGN.md.
          </p>
        </header>

        <SectionCard title="Routes">
          <ul className="grid gap-2 sm:grid-cols-2">
            {routes.map((r) => (
              <li key={r.path}>
                <a
                  href={r.path}
                  className="inline-flex items-center gap-2 rounded-full border border-site-border bg-site-page px-3 py-1.5 text-small text-site-ink transition-colors duration-[150ms] hover:border-accent hover:text-accent"
                >
                  <span className="font-semibold text-site-muted">{r.path}</span>
                  — {r.label}
                </a>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="State variants">
          <ul className="grid gap-2 sm:grid-cols-2">
            {variants.map((v) => (
              <li key={v.path}>
                <a
                  href={v.path}
                  className="inline-flex items-center gap-2 rounded-full border border-site-border bg-site-page px-3 py-1.5 text-small text-site-ink transition-colors duration-[150ms] hover:border-accent hover:text-accent"
                >
                  <span className="font-semibold text-site-muted">{v.path}</span>
                  — {v.label}
                </a>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Components">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-small text-muted">Button</p>
              <div className="flex flex-wrap gap-2">
                <Button>{s.createGetSteps}</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Input — with error</p>
              <div className="max-w-[430px]">
                <Input
                  label={s.importFieldLabel}
                  placeholder={s.importLinkPlaceholder}
                  error={s.importErrorInvalid}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Verdict chips</p>
              <div className="flex flex-wrap gap-2">
                <VerdictChip variant="right" label={s.verdictRightLabel} />
                <VerdictChip variant="wrong" label={s.verdictWrongLabel} />
                <VerdictChip variant="canttell" label={s.verdictCantTellLabel} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Progress steps</p>
              <div className="max-w-[430px]">
                <ProgressSteps current={2} total={sampleLesson.stepCount} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Banners</p>
              <div className="max-w-[430px] space-y-2">
                <Banner tone="saved">{s.savedBanner}</Banner>
                <Banner tone="error">{s.importErrorInvalid}</Banner>
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Empty state</p>
              <EmptyState line={s.lessonsEmptyLine}>
                <Button href="/create" variant="secondary">
                  {s.lessonsEmptyButton}
                </Button>
              </EmptyState>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Skeleton card</p>
              <div className="max-w-[430px]">
                <SkeletonCard />
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Step card</p>
              <div className="max-w-[430px]">
                <StepCard step={sampleLesson.steps[0]} index={0} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Lesson card</p>
              <div className="max-w-[430px]">
                <LessonCard
                  lesson={{
                    id: "tower",
                    title: "Build the block tower",
                    stepCount: 4,
                    meta: "4 steps · source: YouTube link",
                    date: "Today",
                  }}
                  href="/lesson/sample"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-small text-muted">Keyframe visual</p>
              <div className="max-w-[430px]">
                <KeyframeVisual
                  spec={sampleLesson.steps[2].photo}
                  label="Two keyframes compared"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tokens.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-site-border p-3"
              >
                <div
                  className="h-10 w-full rounded-lg"
                  style={{ backgroundColor: t.hex, border: "1px solid var(--line)" }}
                />
                <p className="mt-2 text-small font-semibold text-ink">
                  {t.name}
                </p>
                <p className="text-caption text-muted">{t.var}</p>
                <p className="text-caption text-muted">{t.hex}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Type scale">
          <div className="space-y-2">
            {typeScale.map((t) => (
              <div key={t.name} className="flex items-baseline gap-4">
                <span className="w-20 shrink-0 text-caption text-muted">
                  {t.name}
                </span>
                <span className={`${t.cls} text-ink`}>Show Once</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}