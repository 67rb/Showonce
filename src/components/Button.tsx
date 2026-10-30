/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "default" | "large";

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[color,background-color,border-color,box-shadow,transform] duration-[150ms] ease-out " +
  "select-none disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

const variants: Record<Variant, string> = {
  primary:
    "bg-site-ink text-white shadow-[0_8px_24px_-8px_rgba(22,22,26,0.5)] " +
    "hover:bg-site-ink-2 motion-safe:hover:-translate-y-px " +
    "motion-safe:hover:shadow-[0_12px_28px_-8px_rgba(22,22,26,0.55)]",
  secondary:
    "border border-site-border bg-white text-site-ink " +
    "hover:border-site-border-2 hover:bg-site-page",
  ghost: "text-site-muted hover:text-site-ink hover:bg-site-page",
  destructive: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  default: "h-11 px-5 text-body",
  large: "h-13 px-7 text-h2",
};

export function Button({
  children,
  variant = "primary",
  size = "default",
  href,
  onClick,
  disabled = false,
  loading = false,
  className = "",
}: Props) {
  const isDisabled = disabled || loading;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        aria-disabled={isDisabled}
        className={cls}
        onClick={isDisabled ? (e) => e.preventDefault() : onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-black/30 border-t-black"
        />
      )}
      {children}
    </button>
  );
}