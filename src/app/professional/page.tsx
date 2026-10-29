import type { Metadata } from "next";
import s from "@/lib/strings";
import Link from "next/link";

import { Reveal, RevealGroup, SerifAccent } from "@/components/Reveal";
import { BorderBeam } from "@/components/lightswind/border-beam";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import { SeasonalHoverCards } from "@/components/lightswind/seasonal-hover-cards";
import { Button } from "@/components/Button";
import Hero69 from "@/components/originkit/hero-69";

export const metadata: Metadata = {
  title: "SHOW ONCE for professionals",
  description: s.proHeroSub,
};

export default function ProfessionalPage() {
  // Two-line capabilities heading: accent covers the final word ("checks.").
  const headingWords = s.proCapabilitiesHeading.split(/\s+/);
  const headingLead = headingWords.slice(0, -1).join(" ");
  const headingAccent = headingWords.slice(-1).join(" ");

  const howItWorks = [
    { t: s.proHowStep1Title, d: s.proHowStep1Line },
    { t: s.proHowStep2Title, d: s.proHowStep2Line },
    { t: s.proHowStep3Title, d: s.proHowStep3Line },
  ];

  const scopeCards = [
    { title: s.canHeading, line: s.proCanLine, items: s.proCanItems },
    {
      title: s.audienceProfessionalTitle,
      line: s.audienceProfessionalLine,
      items: s.audienceProfessionalItems,
    },
    {
      title: s.proPracticeTitle,
      line: s.proPracticeLine,
      items: s.proPracticeItems,
    },
  ];

  return (
    <div className="min-h-dvh bg-site-page -mt-24">
      {/* HERO — hero-69 (owner-picked; colours as installed, content slots branded) */}
      <Hero69 />

      <div className="mx-auto w-full max-w-6xl px-4">
        {/* HOW IT WORKS — numbered rows, green eyebrow */}
        <section className="bg-site-page pt-20 pb-0 md:pt-28 md:pb-0">
          <RevealGroup>
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow !text-[#16A34A]">{s.eyebrowHowItWorks}</p>
                <h2 className="section-title mt-4">
                  <SerifAccent text={s.sectionHowItWorks} />
                </h2>
              </div>
            </Reveal>
            <Reveal>
              <div className="mx-auto mt-14 max-w-4xl divide-y divide-site-border border-y border-site-border">
                {howItWorks.map((item, i) => (
                  <div
                    key={item.t}
                    className="grid gap-3 py-8 md:grid-cols-12 md:items-baseline"
                  >
                    <span className="font-display-ui text-[3rem] font-extrabold leading-none text-site-ink md:col-span-2">
                      {i + 1}
                    </span>
                    <div className="md:col-span-10">
                      <h3 className="font-display-ui text-[1.375rem] font-bold leading-tight text-site-ink">
                        {item.t}
                      </h3>
                      <p className="mt-2 text-body font-body-ui text-site-muted">
                        {item.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </RevealGroup>
        </section>

        {/* CAPABILITIES — green BorderBeam + washes, three-… gallery mirror */}
        <section className="relative overflow-hidden bg-site-page pt-14 pb-0 lg:pt-[72px] md:pb-0">
          <BorderBeam
            aria-hidden
            size={80}
            duration={7}
            colorFrom="#16A34A"
            colorTo="#15803D"
            opacity={0.55}
            beamBorderRadius={28}
          />
          <div
            aria-hidden
            className="absolute left-[8%] top-10 h-[420px] w-[600px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(22,163,74,0.22), transparent)",
            }}
          />
          <div
            aria-hidden
            className="absolute bottom-10 right-[6%] h-[480px] w-[680px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(21,128,61,0.18), transparent)",
            }}
          />
          <RevealGroup>
            <Reveal>
              <div className="relative z-10 mx-auto max-w-4xl">
                <p className="eyebrow !text-[#16A34A]">{s.eyebrowCapabilities}</p>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="section-title max-w-[17ch]">
                    {headingLead}
                    <br />
                    <span className="font-serif-accent">{headingAccent}</span>
                  </h2>
                  <Link
                    href="/professional/lessons"
                    className="btn-shine shrink-0 whitespace-nowrap rounded-full bg-[#16161A] px-5 py-2.5 text-small font-semibold text-white transition-colors duration-[150ms] hover:bg-[#16A34A]"
                  >
                    {s.seeAll}
                  </Link>
                </div>
              </div>
            </Reveal>
            <HorizontalGallery />
          </RevealGroup>
        </section>

        {/* SCOPE — three hover cards */}
        <section className="bg-site-page pt-14 pb-20 lg:pt-[72px] md:pb-28">
          <RevealGroup>
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow !text-[#16A34A]">{s.eyebrowScope}</p>
              </div>
            </Reveal>
            <Reveal>
              <div className="mx-auto mt-14 max-w-4xl">
                <SeasonalHoverCards cards={scopeCards} />
              </div>
              <p className="relative mx-auto mt-14 max-w-3xl px-4 text-center text-[1.25rem] font-semibold leading-snug text-site-ink">
                <span className="relative">{s.canCantClosing}</span>
              </p>
            </Reveal>
          </RevealGroup>
        </section>

        {/* PRIVACY — green block (black-on-green) */}
        <section className="bg-[#16A34A] py-20 text-[#16161A] md:py-28">
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
                    href="/professional/privacy"
                    className="btn-shine mt-5 inline-block rounded-full bg-[#16161A] px-6 py-2.5 text-small font-semibold text-[#16A34A] transition-colors duration-[150ms] hover:bg-white/20"
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
              <h2 className="relative mx-auto max-w-[680px] font-display-ui text-[3rem] font-extrabold leading-tight text-site-ink">
                <SerifAccent text={s.proFinalCtaHeadline} />
              </h2>
            </Reveal>
            <Reveal>
              <div className="relative mt-8">
                <Button size="large" href="/professional/create">
                  {s.proFinalCtaButton}
                </Button>
              </div>
            </Reveal>
          </RevealGroup>
        </section>
      </div>

      {/* FOOTER — mirrors the Hobby footer, ONCE in Professional green */}
      <footer className="w-full overflow-hidden bg-site-ink">
        <div aria-hidden="true" className="mx-auto w-full max-w-6xl px-4 pt-14">
          <span className="font-display block text-center whitespace-nowrap text-[clamp(4rem,17vw,11rem)] leading-none tracking-tight uppercase">
            <span className="text-white">{s.wordmarkShow}</span>{" "}
            <span className="text-[#16A34A]">{s.wordmarkOnce}</span>
          </span>
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8">
          <p className="font-body-ui text-small text-white/70">{s.proFooterLine}</p>
          <div className="flex items-center gap-5">
            <Link
              href="/professional/privacy"
              className="font-body-ui text-small text-white/70 hover:text-white"
            >
              {s.navPrivacy}
            </Link>
            <Link
              href="/design"
              className="font-body-ui text-small font-medium text-white/70 transition-colors duration-[150ms] hover:text-white"
            >
              {s.designLink}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}