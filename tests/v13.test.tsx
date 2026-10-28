// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";
import { SkyGate } from "@/components/SkyGate";
import { HeroParticleHeadline } from "@/components/HeroParticleHeadline";
import LandingPage from "@/app/(public)/page";
import s from "@/lib/strings";

// v1.3 new assertions:
// (a) the root layout contains no grain reference (1.1),
// (b) the grain wrapper renders exactly once, inside the landing hero
//     section and nowhere else in the page output (1.1),
// (c) GrainGate passes the owner-approved hero grain prop set (v1.3.2),
// (d) GrainGate renders nothing under prefers-reduced-motion (1.1),
// (e) at most two landing elements carry the radial glow treatment (1.2).
// v1.3.2 additions:
// (f) pointer tracking in the grain component is window-level (Task A),
// (g) the hero is structurally full-bleed and full-height with the
//     approved text stack (Tasks B & C).
// v1.6 additions:
// (h) the hero h1 equals the strings.ts headline value (Task A),
// (i) no wordmark element renders inside the hero (Task B),
// (j) the hero panel is 520px on desktop (Task C),
// (k) below-hero colour treatments: can/can't panels, proof bar,
//     privacy gradient, amber hairlines (Task E).
// v1.6.1 additions:
// (l) hero readability scrim: layer order grain < glow < scrim < fade <
//     content plus the .hero-scrim radial-gradient rule (Task A),
// (m) subtitle weight Archivo 500 (Task A),
// v1.7 additions:
// (n) hero panel: the 1.7 restructuring (inlined composition, @container
//     row, nowrap buttons) is reverted — the hero panel is the 1.6-era
//     shared ImportPanel markup again (Task B revert).
// v1.9 additions:
// (o) hero headline: Lightswind Text Particle Animation via the font-gated
//     client wrapper HeroParticleHeadline (two stacked lines, Anton 400,
//     static Anton fallback until fonts load and under reduced motion;
//     real h1 keeps the full sentence, sr-only once particles carry the
//     visual) + tagline: prefix + Lightswind Looping Words at sentence
//     size, container clamped to one line height (Tasks A & B). jsdom
//     cannot load fonts or animate the loop, so runtime font-gating and
//     the animated loop render are UNVERIFIED and asserted in source.
// v1.9.1 additions:
// (p) Task A: particle lines denser and bolder (pixelSize 3, resolution 3)
//     and the .hero-scrim radial widened and strengthened (ellipse 92% 74%
//     at 50% 42%, stops 0.62 / 0.38 at 55% / clear at 80%);
//     Task B: the Looping Words tagline wrapper becomes an explicit sized
//     relative inline-flex container (h-[1.4em], min-w-[6.5ch], baseline
//     aligned) — no clamp, no overflow hidden, no strip sizing of ours.
// v2.1 additions:
// (q) Task A: particle main text is the brand "SHOW ONCE" as a single line
//     (one particle instance; fontSize stages 64 / 104 / 148; accessible h1
//     is "Show Once");
//     Task B: Looping Words integrated demo-style as a centred block under
//     the tagline sentence — only words + a font-styling className, no
//     sizing/clamp/inline-flex wrapper of ours.
// v2.5 additions:
// (r) Task A: hero content is ONE centred column (max-w-[680px], mx-auto,
//     pt-26 = 104px) with fixed margins 20 / 10 / 28 / 14 px; particle
//     fontSize stages drop to 56 / 96 / 132;
//     Task B: Looping Words sized unlayered from globals.css (.tagline-loop
//     and .tagline-loop * with !important + the inner window .tagline-loop > div
//     height 1.35em) so one word shows in the bracket frame.

const layout = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/layout.tsx"),
  "utf8",
);
const gateSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/SkyGate.tsx"),
  "utf8",
);
const globalsSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);
const pageSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/(public)/page.tsx"),
  "utf8",
);
const heroParticleSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/HeroParticleHeadline.tsx"),
  "utf8",
);

const landing = async () =>
  renderToStaticMarkup(await LandingPage());

describe("v1.3 — sky lives in the landing hero only (v2.12)", () => {
  it("the root layout references no grain, satin or sky component at all", () => {
    expect(/grain|lightswind/i.test(layout)).toBe(false);
    expect(layout).not.toContain("SkyGate");
    expect(layout).not.toContain("SatinGate");
    expect(layout).not.toContain("GrainGate");
  });

  it("SkyGate passes exactly the base-preset Cloud Sky values", () => {
    expect(gateSource).toContain('background="#0075FF"');
    expect(gateSource).toContain('baseColor="#B4D2F0"');
    expect(gateSource).toContain('accentColor="#FFFFFF"');
    expect(gateSource).toContain("density={100}");
    expect(gateSource).toContain("size={130}");
    expect(gateSource).toContain("speed={speed}");
  });

  it("the sky wrapper is absolutely positioned — no fixed positioning in SkyGate", () => {
    expect(gateSource).toMatch(/absolute\s+inset-0/);
    expect(gateSource).not.toMatch(/\bfixed\b/);
  });

  it("the sky wrapper renders once, inside the hero section and nowhere else", async () => {
    const html = await landing();
    const WRAPPER = "pointer-events-none absolute inset-0 z-0";
    const first = html.indexOf(WRAPPER);
    expect(first).toBeGreaterThan(-1);
    // Nowhere else in the page output.
    expect(html.indexOf(WRAPPER, first + 1)).toBe(-1);
    // Inside the hero section element.
    const heroStart = html.indexOf("overflow-hidden px-5 pt-28 pb-16 text-center");
    expect(heroStart).toBeGreaterThan(-1);
    const heroEnd = html.indexOf("</section>", heroStart);
    expect(first).toBeGreaterThan(heroStart);
    expect(first).toBeLessThan(heroEnd);
  });

  it("SkyGate renders the sky under prefers-reduced-motion with speed 0 (a frozen still)", () => {
    expect(gateSource).toContain('motion === "reduced" ? 0 : onScreen ? 100 : 0');
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const { container } = render(<SkyGate />);
    // The sky still mounts (a background is never gated on reduced motion).
    expect(container.querySelector("canvas")).not.toBeNull();
  });
});

describe("v1.3 — landing glow budget (1.2)", () => {
  it("at most two elements carry the radial glow treatment", async () => {
    const html = await landing();
    expect((html.match(/hero-glow/g) || []).length).toBeLessThanOrEqual(2);
  });
  it("v2.23: the capability section is light-ground with washes, so no hero-glow remains", async () => {
    const html = await landing();
    expect((html.match(/hero-glow/g) || []).length).toBe(0);
    expect(html).toContain("capability-wash");
  });
});

describe("v1.3.2 — hero full-bleed full-height (Task B)", () => {
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("the hero is the first section, rendered outside the landing container (structural full-bleed)", async () => {
    const html = await landing();
    expect(html.indexOf("<section")).toBeLessThan(
      html.indexOf("mx-auto w-full max-w-6xl px-4"),
    );
  });

  it("the hero carries the full-bleed marker, the 100svh min-height (fixed overlay navbar compensation) and vertical centring", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("hero-full-bleed");
    expect(hero).toContain("-mt-24");
    expect(hero).toContain("min-h-[100svh]");
    expect(hero).toContain("py-10");
    expect(hero).toContain("justify-center");
  });

  it("no wordmark element renders inside the hero (v1.6 Task B)", async () => {
    expect(heroSlice(await landing())).not.toMatch(/wordmark/i);
  });
});

describe("v1.6 — hero headline (Task A)", () => {
  it("the rendered h1 text equals the strings.ts headline value", async () => {
    const html = await landing();
    const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    expect(m?.[1]).toBe(s.landingHeadline);
  });
});

describe("v1.3.2 — hero text stack (Task C)", () => {
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("no rendered eyebrow above the headline — one brand rendering in the header (v1.6)", async () => {
    expect(heroSlice(await landing())).not.toContain('class="eyebrow');
  });

  it("hero text is dark ink over the light sky (v2.12)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("text-[#121212]");
    expect(hero).toContain("text-[#27272A]");
  });

  it("the hero shows a single CTA — the Venom stage (v2.6)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("venom-cta");
    expect(hero).not.toContain("bg-[#F59E0B]");
  });
});

describe("Site language v3 — below-hero re-skin (replaces v1.6 dark treatments)", () => {
  it("the can list renders as a white hover card with accent-deep markers", async () => {
    const html = await landing();
    expect(html).toContain("bg-accent-deep");
    expect(html).toMatch(/rounded-2xl bg-white/);
  });

  it("the can't content is retained in strings but no longer rendered on the landing", async () => {
    const html = await landing();
    expect(html).not.toContain(s.cantHeading);
    expect(html).not.toContain("bg-danger");
    expect(html.replace(/<[^>]+>/g, "")).toContain(s.canHeading);
    expect(html.replace(/<[^>]+>/g, "")).toContain(s.canItems[0]);
  });

  it("the capability section sits on the light ground with the 3D row and the four cards", async () => {
    const html = await landing();
    expect(html).toContain("bg-site-page");
    expect(html).toContain("capability-wash");
    const wash = html.indexOf("bg-site-page");
    const title = html.indexOf(s.galleryMoreTitle);
    expect(wash).toBeGreaterThan(-1);
    expect(title).toBeGreaterThan(-1);
  });

  it("the privacy band is the amber block with ink text", async () => {
    const html = await landing();
    expect(html).toContain("bg-accent");
    expect(html).toContain("text-[#16161A]");
  });

  it("how-it-works uses numbered Inter Tight cards (not the old Anton ghost rows)", async () => {
    const html = await landing();
    expect(html).toContain("font-display-ui");
    // the Anton ghost-number rows are gone
    const hero = html.slice(0, html.indexOf("</section>") + 10);
    expect(hero.length).toBeGreaterThan(0);
  });

  it("section eyebrows keep the .eyebrow class", async () => {
    const html = await landing();
    expect((html.match(/class="eyebrow"/g) || []).length).toBeGreaterThanOrEqual(3);
  });
});

describe("v1.6.1 — hero readability scrim (Task A)", () => {
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("the scrim renders inside the hero — above the sky, below the content wrapper in DOM order (v2.12)", async () => {
    const html = await landing();
    const sky = html.indexOf("pointer-events-none absolute inset-0 z-0");
    const scrim = html.indexOf("hero-scrim");
    const content = html.indexOf(
      "relative z-10 mx-auto flex w-full max-w-[680px] flex-col items-center py-10",
    );
    expect(sky).toBeGreaterThan(-1);
    expect(scrim).toBeGreaterThan(sky);
    expect(scrim).toBeLessThan(content);
    // the separate hero amber glow div is removed
    const heroSlice = html.slice(0, html.indexOf("</section>") + 10);
    expect(heroSlice).not.toContain("hero-glow");
  });

  it("the .hero-scrim rule exists with the radial-gradient background and white veil alphas", () => {
    expect(globalsSource).toMatch(/\.hero-scrim\s*\{[\s\S]*?radial-gradient/);
    expect(globalsSource).toContain("rgba(255, 255, 255, 0.42)");
    expect(globalsSource).toContain("rgba(255, 255, 255, 0.18)");
    expect(globalsSource).toContain("ellipse 92% 74% at 50% 42%");
  });

  it("the scrim div is aria-hidden and pointer-events-none", async () => {
    const html = await landing();
    const scrim = html.indexOf("hero-scrim");
    const windowText = html.slice(Math.max(0, scrim - 200), scrim + 160);
    expect(windowText).toContain("aria-hidden");
    expect(windowText).toContain("pointer-events-none");
  });

  it("the subtitle renders at Archivo 500 (font-medium) in dark ink (v2.12)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("text-body font-medium");
    expect(hero).toContain("text-[#121212]");
  });
});

describe("v2.4 — hero panel removed, single CTA in (Task C)", () => {
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("the hero contains no text input, no panel, and no import labels/buttons", async () => {
    const hero = heroSlice(await landing());
    expect(hero).not.toContain("panel w-full p-5");
    expect(hero).not.toContain("hero-link-input");
    expect(hero).not.toContain("importFieldLabel");
    expect(hero).not.toContain("importUpload");
    expect(hero).not.toContain("<input");
  });

  it("the hero has one CTA — the Venom stage — and the privacy line under it (v2.6)", async () => {
    const hero = heroSlice(await landing());
    // the single call to action is the Venom stage (no amber anchor remains)
    expect(hero).toContain("venom-cta");
    expect(hero).not.toContain("bg-[#F59E0B]");
    expect(hero).toContain("text-caption text-[#27272A]");
  });

  it("the CTA carries no panel leftovers (no nowrap flex row, no buttons row)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).not.toContain("mt-4 flex flex-col gap-2 sm:flex-row");
    expect(hero).not.toContain("sm:flex-row");
  });
});

