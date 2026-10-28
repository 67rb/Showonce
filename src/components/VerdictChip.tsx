type Variant = "right" | "wrong" | "canttell";

type Props = {
  variant: Variant;
  label: string;
  size?: "default" | "large";
};

const styles: Record<Variant, string> = {
  right: "bg-success/15 text-success border-success/40",
  wrong: "bg-danger/15 text-danger border-danger/40",
  canttell: "bg-site-muted/10 text-site-muted border-site-muted/40",
};

const sizes = {
  default: "text-small px-2.5 py-1",
  large: "text-h2 px-4 py-1.5",
};

export function VerdictChip({ variant, label, size = "default" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase leading-none tracking-wide ${styles[variant]} ${sizes[size]}`}
    >
      {label}
    </span>
  );
}