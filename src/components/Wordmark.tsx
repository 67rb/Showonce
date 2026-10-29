import Link from "next/link";
import s from "@/lib/strings";

type Props = {
  href?: string;
  size?: "sm" | "md";
  className?: string;
};

export function Wordmark({ href = "/", size = "md", className = "" }: Props) {
  const textSize =
    size === "md" ? "text-xl" : "text-base";
  const cls = `wordmark inline-flex select-none ${textSize} ${className}`;

  return (
    <Link
      href={href}
      className={cls}
      aria-label={`${s.wordmarkShow} ${s.wordmarkOnce} home`}
    >
      <span>{s.wordmarkShow}</span>
      <span className="text-accent">{s.wordmarkOnce}</span>
    </Link>
  );
}