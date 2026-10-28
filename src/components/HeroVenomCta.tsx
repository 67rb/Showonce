import Link from "next/link";
import s from "@/lib/strings";

/** A stable, native link: the full visible pill is the click target. */
export function HeroVenomCta() {
  return <Link href="/create/" className="hero-start inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-8 py-4 text-lg font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">{s.finalCtaButton}<span aria-hidden="true">↗</span></Link>;
}
