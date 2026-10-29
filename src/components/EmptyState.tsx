import type { ReactNode } from "react";

type Props = {
  line: string;
  children?: ReactNode;
};

/** Visual area built from CSS block shapes — no photos or imagery. */
export function EmptyState({ line, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="h-3 w-3 rounded-sm bg-accent/70" />
        <span className="h-3 w-3 rounded-sm bg-muted/50" />
        <span className="h-3 w-3 rounded-sm bg-accent-strong" />
      </div>
      <p className="max-w-[300px] text-body text-muted">{line}</p>
      {children}
    </div>
  );
}