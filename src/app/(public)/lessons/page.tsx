import s from "@/lib/strings";
import { libraryLessons } from "@/design/fixtures";

import { Reveal, RevealGroup, SerifAccent } from "@/components/Reveal";
import { LessonCard } from "@/components/LessonCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const empty = state === "empty";

  return (
    <div className="relative isolate">
      <div className="relative mx-auto w-full max-w-3xl px-4 py-10">
        <RevealGroup>
          <Reveal>
            <div className="flex items-center justify-between">
              <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight text-site-ink">
                <SerifAccent text={s.lessonsHeading} />
              </h1>
              <Button href="/create">{s.newLesson}</Button>
            </div>
          </Reveal>
        </RevealGroup>

        {empty ? (
          <div className="mt-8">
            <EmptyState line={s.lessonsEmptyLine}>
              <Button href="/create" variant="secondary">
                {s.lessonsEmptyButton}
              </Button>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8 flex flex-col divide-y divide-site-border border-y border-site-border">
            {libraryLessons.map((l) => (
              <LessonCard key={l.id} lesson={l} href="/lesson/sample" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}