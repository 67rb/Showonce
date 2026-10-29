import type { LibraryLesson } from "@/design/fixtures";
import { sampleLesson } from "@/design/fixtures";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import Link from "next/link";

type Props = {
  lesson: LibraryLesson;
  href?: string;
};

/** Large list row: hairline-separated by its list container, hover lifts to
    the soft ground. KeyframeVisual thumbnail, Inter Tight title, muted meta,
    and an ink arrow. */
export function LessonCard({ lesson, href = `/lesson/${lesson.id}` }: Props) {
  return (
    <Link
      href={href}
      className="group flex w-full items-center gap-4 py-5 transition-colors duration-[150ms] hover:bg-site-page/70"
    >
      <div className="w-[96px] shrink-0 md:w-[112px]">
        <KeyframeVisual
          spec={sampleLesson.steps[0].keyframe}
          label={lesson.title}
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display-ui truncate text-[1.25rem] font-semibold leading-tight text-site-ink">
          {lesson.title}
        </h3>
        <p className="mt-1 text-small text-site-muted">
          {lesson.stepCount} steps · {lesson.meta.split(" · ")[1] ?? lesson.meta}
        </p>
        {lesson.date ? (
          <p className="mt-1 text-caption text-site-muted/70">{lesson.date}</p>
        ) : null}
      </div>
      <span
        aria-hidden
        className="text-2xl leading-none text-site-ink transition-colors duration-[150ms] group-hover:text-accent"
      >
        →
      </span>
    </Link>
  );
}