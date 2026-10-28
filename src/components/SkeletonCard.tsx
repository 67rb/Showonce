export function SkeletonCard() {
  return (
    <div
      aria-hidden
      className="panel animate-progress flex flex-col gap-2 p-4"
    >
      <div className="h-3 w-1/3 rounded bg-line" />
      <div className="h-4 w-full rounded bg-line" />
      <div className="mt-2 aspect-video w-full rounded bg-line" />
    </div>
  );
}