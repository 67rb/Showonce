import s from "@/lib/strings";
import type { FixtureStep } from "@/design/fixtures";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import type { ReactNode } from "react";

type Props = {
  step: FixtureStep;
  index: number;
  children?: ReactNode;
  editableCaption?: boolean;
};

export function StepCard({ step, index, children, editableCaption = false }: Props) {
  return (
    <div className="site-card p-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-body-ui text-caption font-semibold uppercase tracking-wide text-site-muted">
          Step {index + 1}
        </p>
        {step.visibleState ? (
          <span className="shrink-0 text-small text-site-muted">{step.visibleState}</span>
        ) : null}
      </div>
      {editableCaption ? (
        <input
          key={step.caption}
          type="text"
          defaultValue={step.caption}
          aria-label={s.reviewCaptionPlaceholder}
          placeholder={s.reviewCaptionPlaceholder}
          className="mb-3 w-full rounded-lg border border-site-border bg-white px-2 py-1 text-body font-semibold text-site-ink focus:outline focus:outline-2 focus:outline-accent"
        />
      ) : (
        <p className="font-body-ui mb-3 text-body font-semibold text-site-ink">{step.caption}</p>
      )}
      <KeyframeVisual spec={step.keyframe} label={step.caption} />
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}