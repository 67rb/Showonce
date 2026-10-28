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

export default function DesignPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="section-title">Design index</h1>
      <p className="mt-2 max-w-2xl text-body text-muted">
        Internal review scaffold. Nothing here is a working tool — routes
        render fixture states only. Compare the inventory below against
        DESIGN.md.
      </p>

      {/* Routes */}
      <section className="mt-10">
        <h2 className="text-h2 font-semibold uppercase leading-heading">Routes</h2>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {routes.map((r) => (
            <li key={r.path}>
              <a
                href={r.path}
                className="inline-block text-small text-accent underline-offset-4 hover:underline"
              >
                {r.path} — {r.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* State variants */}
      <section className="mt-10">
        <h2 className="text-h2 font-semibold uppercase leading-heading">State variants</h2>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {variants.map((v) => (
            <li key={v.path}>
              <a
                href={v.path}
                className="inline-block text-small text-accent underline-offset-4 hover:underline"
              >
                {v.path} — {v.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Component showcase */}
      <section className="mt-10">
        <h2 className="text-h2 font-semibold uppercase leading-heading">Components</h2>
        <div className="mt-4 space-y-6">
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
      </section>

      {/* Token swatches */}
      <section className="mt-10">
        <h2 className="text-h2 font-semibold uppercase leading-heading">Tokens</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tokens.map((t) => (
            <div
              key={t.name}
              className="panel p-3"
            >
              <div
                className="h-10 w-full rounded"
                style={{ backgroundColor: t.hex, border: "1px solid var(--line)" }}
              />
              <p className="mt-2 text-small font-semibold text-ink">{t.name}</p>
              <p className="text-caption text-muted">{t.var}</p>
              <p className="text-caption text-muted">{t.hex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Type scale */}
      <section className="mt-10">
        <h2 className="text-h2 font-semibold uppercase leading-heading">Type scale</h2>
        <div className="mt-4 space-y-2">
          {typeScale.map((t) => (
            <div key={t.name} className="flex items-baseline gap-4">
              <span className="w-20 shrink-0 text-caption text-muted">
                {t.name}
              </span>
              <span className={`${t.cls} text-ink`}>Show Once</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}