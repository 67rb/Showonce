import s from "@/lib/strings";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <p
        aria-hidden
        className="font-display-ui text-[5rem] font-extrabold leading-none text-site-muted/40"
      >
        404
      </p>
      <h1 className="max-w-[430px] font-display-ui text-3xl font-extrabold leading-[1.05] text-site-ink">
        {s.notFoundHeading}
      </h1>
      <p className="max-w-[430px] font-body-ui text-body text-site-muted">
        {s.notFoundBody}
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-[#16161A] px-6 py-3 font-body-ui text-body font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
      >
        {s.backHome}
      </Link>
    </main>
  );
}