import s from "@/lib/strings";

import { Reveal, RevealGroup, SerifAccent } from "@/components/Reveal";
import { SkyGate } from "@/components/SkyGate";
import { HeroVenomCta } from "@/components/HeroVenomCta";
import { StartLearningButton } from "@/components/StartLearningButton";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { HeroParticleHeadline } from "@/components/HeroParticleHeadline";
import { BorderBeam } from "@/components/lightswind/border-beam";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SeasonalHoverCards } from "@/components/lightswind/seasonal-hover-cards";
import Link from "next/link";

export default function LandingPage() {

  // Task C: compose the two-line "What SHOW ONCE / can check." heading from the
  // stored string; the serif-accent span covers the final two words here only.
  const headingWords = s.lessonsSectionTitle.split(/\s+/);
  const headingLead = headingWords.slice(0, -2).join(" ");
  const headingAccent = headingWords.slice(-2).join(" ");

  const howItWorks = [
    { t: s.howStep1Title, d: s.howStep1Line },
    { t: s.howStep2Title, d: s.howStep2Line },
    { t: s.howStep3Title, d: s.howStep3Line },
  ];

  return (
    <>
      <ScrollProgress />
      {/* HERO — full-bleed, full-height (structural full-bleed: the hero sits
          outside the landing container, so the section spans edge to edge) */}
      <section className="hero-full-bleed relative -mt-24 flex min-h-[100svh] flex-col items-center justify-center gap-6 overflow-hidden px-5 pt-28 pb-16 text-center">
        <SkyGate />
        {/* light veil — above sky, below content (v2.12 replaces the dark scrim) */}
        <div
          aria-hidden
          className="hero-scrim pointer-events-none absolute inset-0"
        />
        {/* bottom fade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-1 h-28 bg-gradient-to-b from-transparent to-[#FFFFFF]"
        />
        {/* ONE centred content column — strict vertical budget (v2.5 Task A) */}
        <div className="relative z-10 mx-auto flex w-full max-w-[680px] flex-col items-center py-10 text-center">
          <div>
            {/* particle block (fontSize stages 56/96/132) */}
            <div className="flex w-full flex-col items-center">
              <HeroParticleHeadline />
            </div>
          </div>
          <div>
            {/* tagline sentence — dark ink over the light sky */}
            <div className="mt-5 w-full">
              <p className="mx-auto max-w-[430px] text-body font-medium text-[#121212]">
                {s.landingTaglinePrefix}
              </p>
            </div>
          </div>
          <div>
            {/* loop block */}
            <div className="mt-2.5 w-full">
              <p className="text-xl font-semibold text-[#27272A]">Fold. Build. Draw. Make it yours.</p>
            </div>
          </div>
          <div>
            {/* CTA — Nexus Venom stage (v2.6 Task B); one call to action in the hero */}
            <div className="relative mt-8 rounded-full">
              <div className="flex justify-center">
                <HeroVenomCta />
              </div>
            </div>
          </div>
          <div>
            {/* privacy line */}
            <p className="mt-5 text-caption text-[#27272A]">{s.privacyClaim}</p>
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* HOW IT WORKS — numbered list rows on a white ground, hairline dividers */}
        <section className="bg-site-page pt-20 pb-0 md:pt-28 md:pb-0">
          <RevealGroup>
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow">{s.eyebrowHowItWorks}</p>
                <h2 className="section-title mt-4">
                  <SerifAccent text={s.sectionHowItWorks} />
                </h2>
              </div>
            </Reveal>
            <Reveal>
              <div className="mx-auto mt-14 max-w-4xl divide-y divide-site-border border-y border-site-border">
                {howItWorks.map((item, i) => (
                  <div key={item.t} className="grid gap-3 py-8 md:grid-cols-12 md:items-baseline">
                    <span className="font-display-ui text-[3rem] font-extrabold leading-none text-site-ink md:col-span-2">
                      {i + 1}
                    </span>
                    <div className="md:col-span-10">
                      <h3 className="font-display-ui text-[1.375rem] font-bold leading-tight text-site-ink">
                        {item.t}
                      </h3>
                      <p className="mt-2 text-body font-body-ui text-site-muted">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </RevealGroup>
        </section>

        {/* CAPABILITIES — light ground, colour washes; four LiquidGlassCards
            ride in a 3D scroll-trigger row. Sits directly after How it works. */}
        <section className="relative overflow-hidden bg-site-page pt-14 pb-0 lg:pt-[72px] md:pb-0">
          <BorderBeam
            aria-hidden
            size={80}
            duration={7}
            colorFrom="#F59E0B"
            colorTo="#D97706"
            opacity={0.55}
            beamBorderRadius={28}
          />
          <div
            aria-hidden
            className="capability-wash capability-wash-amber left-[8%] top-10 h-[420px] w-[600px]"
          />
          <div
            aria-hidden
            className="capability-wash capability-wash-peach bottom-10 right-[6%] h-[480px] w-[680px]"
          />
          <RevealGroup>
            <Reveal>
              <div className="relative z-10 mx-auto max-w-4xl">
                <p className="eyebrow">{s.eyebrowCapabilities}</p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="section-title max-w-[17ch]">
                    {headingLead}
                    <br />
                    <span className="font-serif-accent">{headingAccent}</span>
                  </h2>
                  <Link
                    href="/lessons"
                    className="btn-shine shrink-0 whitespace-nowrap rounded-full bg-[#16161A] px-5 py-2.5 text-small font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
                  >
                    {s.seeAll}
                  </Link>
                </div>
              </div>
            </Reveal>
            <HorizontalGallery />
          </RevealGroup>
        </section>

        {/* CAN / CAN'T — three-card hover row */}
        <section className="bg-site-page pt-14 pb-20 lg:pt-[72px] md:pb-28">
          <RevealGroup>
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow">{s.eyebrowScope}</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="mx-auto mt-14 max-w-4xl">
                <SeasonalHoverCards
                  cards={[
                    {
                      title: s.canHeading,
                      line: s.audienceCanLine,
                      items: s.canItems,
                    },
                    {
                      title: s.audienceHobbyTitle,
                      line: s.audienceHobbyLine,
                      items: s.audienceHobbyItems,
                    },
                    {
                      title: s.audienceProfessionalTitle,
                      line: s.audienceProfessionalLine,
                      items: s.audienceProfessionalItems,
                    },
                  ]}
                />
              </div>
              <p className="relative mx-auto mt-14 max-w-3xl px-4 text-center text-[1.25rem] font-semibold leading-snug text-site-ink">
                <span className="relative">{s.canCantClosing}</span>
              </p>
            </Reveal>
          </RevealGroup>
        </section>

        {/* PRIVACY — amber block (black-on-amber) */}
        <section className="bg-accent py-20 text-[#16161A] md:py-28">
          <RevealGroup>
            <Reveal>
              <div className="mx-auto grid max-w-4xl gap-8 px-4 lg:grid-cols-2">
                <h2 className="font-display-ui text-[2.5rem] font-extrabold leading-tight">
                  <SerifAccent text={s.privacyHeading} />
                </h2>
                <div>
                  <p className="max-w-3xl text-body font-body-ui font-medium">
                    {s.privacyBody}
                  </p>
                  <Link
                    href="/privacy"
                    className="btn-shine mt-5 inline-block rounded-full bg-[#16161A] px-6 py-2.5 text-small font-semibold text-accent transition-colors duration-[150ms] hover:bg-white/20"
                  >
                    {s.privacyLink}
                  </Link>
                </div>
              </div>
            </Reveal>
          </RevealGroup>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden py-20 text-center md:py-28">
          <RevealGroup>
            <Reveal>
              <div className="relative">
                <h2 className="relative mx-auto max-w-[680px] font-display-ui text-[3rem] font-extrabold leading-tight text-site-ink">
                  <SerifAccent text={s.finalCtaHeadline} />
                </h2>
              </div>
            </Reveal>
            <Reveal>
              <div className="relative mt-8">
                <StartLearningButton />
              </div>
            </Reveal>
          </RevealGroup>
        </section>
        </div>
    </>
  );
}
