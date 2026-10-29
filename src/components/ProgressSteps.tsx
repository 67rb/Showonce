type Props = {
  current: number;
  total: number;
};

export function ProgressSteps({ current, total }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < current ? "bg-accent" : "bg-site-page"
            }`}
          />
        ))}
      </div>
      <span className="text-caption font-medium text-site-muted">
        {current} of {total}
      </span>
    </div>
  );
}