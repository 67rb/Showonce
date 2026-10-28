import s from "@/lib/strings";

/** Real text stays sharp and keeps the same layout before and after hydration. */
export function HeroParticleHeadline() {
  return <h1 className="font-display uppercase leading-none tracking-tight text-[#27272A] text-[clamp(3.5rem,12vw,7rem)]">{s.landingHeadline}</h1>;
}
