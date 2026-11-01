/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@testing-library/react";
import { SkyGate } from "@/components/SkyGate";
import { HeroParticleHeadline } from "@/components/HeroParticleHeadline";
import LandingPage from "@/app/(public)/page";
import { IdentityProvider } from "@/components/learning/Identity";
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
  renderToStaticMarkup(<IdentityProvider>{await LandingPage({ searchParams: Promise.resolve({}) })}</IdentityProvider>);

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
    const heroStart = html.indexOf("overflow-hidden py-16 text-center");
    expect(heroStart).toBeGreaterThan(-1);
    const heroEnd = html.indexOf("</section>", heroStart);
    expect(first).toBeGreaterThan(heroStart);
    expect(first).toBeLessThan(heroEnd);
  });

  it("SkyGate renders the sky under prefers-reduced-motion with speed 0 (a frozen still)", () => {
    expect(gateSource).toMatch(/motion === "reduced" \? 0 :/);
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
    expect(hero).toContain("pt-26");
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
    expect(hero).toContain("min(92vw, 520px)");
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
      "relative z-10 mx-auto flex w-full max-w-[680px] flex-col items-center pt-26",
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
    expect(hero).toContain("min(92vw, 520px)");
    expect(hero).not.toContain("bg-[#F59E0B]");
    expect(hero).toContain("text-caption text-[#27272A]");
  });

  it("the CTA carries no panel leftovers (no nowrap flex row, no buttons row)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).not.toContain("mt-4 flex flex-col gap-2 sm:flex-row");
    expect(hero).not.toContain("sm:flex-row");
  });
});

describe("v1.9 — hero particle headline + looping tagline (Tasks A & B)", () => {
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("strings.ts stores the single brand headline line, the tagline prefix and the five loop words in order (Task A)", () => {
    expect(s.landingHeadlineLines).toEqual(["SHOW ONCE"]);
    expect(s.landingTaglinePrefix).toBe(
      "Paste a video link. Learn it step by step, checked as you",
    );
    expect(s.landingTaglineLoopWords).toEqual([
      "build.",
      "fold.",
      "stack.",
      "pack.",
      "solve.",
    ]);
  });

  it("the page renders the particle wrapper in the headline slot and the tagline prefix + LoopingWords (page source)", async () => {
    const hero = heroSlice(await landing());
    expect(pageSource).toContain("HeroParticleHeadline");
    expect(pageSource).toContain("LoopingWords");
    expect(pageSource).toContain("words={[...s.landingTaglineLoopWords]}");
    expect(pageSource).toContain("{s.landingTaglinePrefix}");
    // The old single-string tagline entry is gone from the page.
    expect(pageSource).not.toContain("landingSubline");
    // The static render carries the prefix and the loop's first word.
    expect(hero).toContain(s.landingTaglinePrefix);
    expect(hero).toContain("build.");
  });

  it("HeroParticleHeadline keeps a real h1 with the full headline text and the static Anton classes as the fallback (rendered)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain(
      "font-display text-display uppercase leading-display text-[#52525B]",
    );
    const h1 = hero.match(/<h1[^>]*>([^<]+)<\/h1>/);
    expect(h1?.[1]).toBe(s.landingHeadline);
    // The static headline is visible (not sr-only) on SSR.
    expect(hero).toContain(
      'class="relative font-display text-display uppercase leading-display text-[#52525B]"',
    );
  });

  it("the wrapper gates particle mounting on document.fonts.load + document.fonts.ready with a reduced-motion early return (source; runtime font simulation UNVERIFIED in jsdom)", () => {
    expect(heroParticleSource).toContain("use client");
    expect(heroParticleSource).toContain("document.fonts.load");
    expect(heroParticleSource).toContain("document.fonts.ready");
    expect(heroParticleSource).toContain("(prefers-reduced-motion: reduce)");
  });

  it("the single particle instance renders the brand line with the mandated TextParticleAnimation props (source; canvas behaviour UNVERIFIED in jsdom)", () => {
    expect(heroParticleSource).toContain("text={s.landingHeadlineLines[0]}");
    expect(heroParticleSource).toContain('fontFamily="Anton, sans-serif"');
    expect(heroParticleSource).toContain("fontWeight={400}");
    expect(heroParticleSource).toContain('theme="light"');
    expect(heroParticleSource).toContain("resolution={2}");
    expect(heroParticleSource).toContain("pixelSize={3}");
    expect(heroParticleSource).toContain("hoverRadius={90}");
    expect(heroParticleSource).toContain("repelForce={14}");
    expect(heroParticleSource).toContain("clickRadius={240}");
    expect(heroParticleSource).toContain("clickForce={50}");
    expect(heroParticleSource).toContain("springForce={0.085}");
    expect(heroParticleSource).toContain("friction={0.86}");
    expect(heroParticleSource).toContain("padding={24}");
    expect(heroParticleSource).toContain("fontSize={fontSize}");
  });

  it("no particle canvas renders when prefers-reduced-motion matches — the static headline stays (runtime render)", () => {
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
    const { container } = render(<HeroParticleHeadline />);
    expect(container.querySelectorAll("canvas").length).toBe(0);
    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toBe(s.landingHeadline);
    expect(h1?.className).toContain("font-display");
  });
});

describe("v2.1 — brand particle line + demo-style Looping Words (Tasks A & B)", () => {
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("LoopingWords is integrated demo-style: only its words prop and a font-styling className, no sizing/clamp/inline-flex wrapper of ours (source)", () => {
    expect(pageSource).toContain("words={[...s.landingTaglineLoopWords]}");
    expect(pageSource).toContain(
      'className="tagline-loop font-sans font-medium text-white/85"',
    );
    // No height, min-width, overflow, clamp or inline-flex sizing from our
    // markup — the component's own internal sizing decides (read-only).
    expect(pageSource).not.toContain("h-[1.4em]");
    expect(pageSource).not.toContain("min-w-[6.5ch]");
    expect(pageSource).not.toContain("h-[1.5em] overflow-hidden");
    expect(pageSource).not.toContain("inline-flex");
    expect(pageSource).not.toContain("[&>div]:h-full");
    expect(pageSource).not.toContain("[&>div]:leading-[inherit]");
    // LoopingWords sits under the tagline sentence as a centred block.
    expect(pageSource).toContain('className="mx-auto max-w-[430px] text-body font-medium text-[#121212]"');
    expect(pageSource).toContain("landingTaglinePrefix");
  });

  it("the tagline wraps the sentence as plain text on its own line (render stays front of the loop block)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain(s.landingTaglinePrefix);
    expect(hero).toContain("build.");
  });
});

describe("v2.3 — Aceternity Resizable Navbar as the public header (Tasks A & B)", () => {
  const navSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/PublicNavbar.tsx"),
    "utf8",
  );
  const layoutSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/(public)/layout.tsx"),
    "utf8",
  );
  const regSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/ui/resizable-navbar.tsx"),
    "utf8",
  );

  it("PublicNavbar imports the installed resizable-navbar parts (Navbar, NavBody, NavItems, MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle, NavbarButton)", () => {
    expect(navSource).toContain(
      'from "@/components/ui/resizable-navbar"',
    );
    for (const part of [
      "Navbar",
      "NavBody",
      "NavItems",
      "MobileNav",
      "MobileNavHeader",
      "MobileNavMenu",
      "MobileNavToggle",
      "NavbarButton",
    ]) {
      expect(new RegExp(`\\b${part}\\b`).test(navSource)).toBe(true);
    }
  });

  it("NavItems equals the three page links in order with no #fragment hrefs; wordmark anchors to /; CTA points to /create with the amber className overrides", () => {
    expect(navSource).toContain('{ name: s.navCreate, link: "/create" }');
    expect(navSource).toContain(
      '{ name: s.yourLessonsLink, link: "/lessons" }',
    );
    expect(navSource).toContain('{ name: s.navPrivacy, link: "/privacy" }');
    // page links in order
    const create = navSource.indexOf("/create");
    const lessons = navSource.indexOf("/lessons");
    const privacy = navSource.indexOf("/privacy");
    expect(create).toBeGreaterThan(-1);
    expect(lessons).toBeGreaterThan(create);
    expect(privacy).toBeGreaterThan(lessons);
    // no fragment anchors, links go to real pages
    expect(navSource).not.toMatch(/href="#/);
    // wordmark anchors to the face home (Task F: "/" on Hobby, /professional on
    // the Professional face — the ModeToggle is the only way between faces)
    expect(navSource).toMatch(/href=\{professional \? "\/professional" : "\/"\}/);
    // CTA is face-aware (4.2.A): Professional -> green pill to
    // /professional/create, Hobby -> the amber pill to /create.
    expect(navSource).toMatch(
      /ctaHref = isProfessional \? "\/professional\/create" : "\/create"/,
    );
    expect(navSource).toContain("bg-[#F59E0B]");
    expect(navSource).toContain("text-black");
    expect(navSource).toContain("rounded-full");
    expect(navSource).toContain("hover:brightness-110");
    expect(navSource).toContain(
      "bg-[#16A34A] text-white hover:bg-[#15803D] rounded-full",
    );
    // variant is left at its default (no variant= prop passed — the
    // pill comes purely from the className overrides)
    expect(navSource).not.toMatch(/<NavbarButton[\s\S]*?variant=/);
  });

  it("the mobile menu carries the same three page links and the amber Start button (MobileNav, MobileNavMenu state in PublicNavbar)", () => {
    expect(navSource).toContain("<MobileNav");
    expect(navSource).toContain("<MobileNavHeader>");
    expect(navSource).toContain("<MobileNavToggle");
    expect(navSource).toContain("<MobileNavMenu");
    expect(navSource).toContain("<NavItems");
    expect(navSource).toContain("items={navItems}");
    expect(navSource).toContain("onItemClick={close}");
    // same face-aware CTA in mobile menu (Hobby: Start; Professional: New training brief)
    expect(navSource).toContain("{isProfessional ? s.proNavBrief : s.importStart}");
    expect(navSource).toContain("useState(false)");
  });

  it("the installed component keeps the owner animation values (threshold, width, y, blur) unchanged", () => {
    expect(regSource).toContain("if (latest > 100)");
    expect(regSource).toContain('width: visible ? "40%" : "100%"');
    expect(regSource).toContain("y: visible ? 20 : 0");
    expect(regSource).toContain('backdropFilter: visible ? "blur(10px)" : "none"');
    // v2.4 Task E: spring softened — stiffness/damping/mass updated, so the
    // old 200/50 values are gone from the installed file.
    expect(regSource).not.toContain("stiffness: 200");
    expect(regSource).not.toContain("damping: 50");
    expect(regSource).toContain("stiffness: 120");
    expect(regSource).toContain("damping: 26");
    expect(regSource).toContain("mass: 0.9");
    // v2.14: motion elements render at their at-top values on first paint
    // (initial={false}) so first paint equals the settled state, not the mount.
    expect((regSource.match(/initial=\{false\}/g) || []).length).toBe(2);
  });

  it("the layout uses PublicNavbar, no longer references the removed PublicHeader, and sets the fixed-overlay compensation (pt-24) + dark activation", () => {
    expect(layoutSource).toContain("PublicNavbar");
    expect(layoutSource).not.toContain("PublicHeader");
    expect(layoutSource).toContain("pt-24");
    expect(layoutSource).toContain("flex min-h-dvh flex-col");
    expect(layoutSource).toMatch(/\bdark\b/);
  });

  it("no navbar href in PublicNavbar or the layout contains a #fragment", () => {
    expect(navSource).not.toMatch(/href="#/);
    expect(layoutSource).not.toMatch(/href="#/);
  });
});

describe("v2.4 — glass navbar, wordmark link, hero CTA, tagline loop (Tasks A–E)", () => {
  const navSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/PublicNavbar.tsx"),
    "utf8",
  );
  const regSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/ui/resizable-navbar.tsx"),
    "utf8",
  );
  const loopSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/lightswind/looping-words.tsx"),
    "utf8",
  );
  const globalsSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("the Navbar is an overlay via className (fixed top-0) and NavBody/MobileNav carry always-on light glass (v3)", () => {
    expect(navSource).toContain('<Navbar className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">');
    expect(navSource).toContain("LIGHT_BODY");
    expect(navSource).toContain("!bg-white/65");
    expect(navSource).toContain("backdrop-blur-xl");
    expect(navSource).toContain("backdrop-saturate-150");
    expect(navSource).toContain("!border-white/60");
  });

  it("the navbar light treatment is unconditional on every route (no pathname condition), keeping the amber CTA and NO dark-glass branch (v3)", () => {
    expect(navSource).toContain('const LIGHT_BODY =');
    expect(navSource).toContain('"!bg-white/65 border !border-white/60 backdrop-blur-xl backdrop-saturate-150"');
    // no dark-glass branch remains
    expect(navSource).not.toContain("bg-neutral-950/45");
    // the light glass is applied on every route — the pathname face only swaps
    // the links, CTA and wordmark colour (4.2.A), never the glass.
    expect(navSource).toContain('<NavBody className={LIGHT_BODY}>');
    expect(navSource).toContain('<MobileNav className={LIGHT_BODY}>');
    // amber Start CTA and wordmark ONCE kept
    expect(navSource).toContain("bg-[#F59E0B]");
    expect(navSource).toContain("text-[#D97706]");
  });

  it("the wordmark is a Next Link to / with pointer-events-auto in both desktop and mobile (Task B)", () => {
    expect(navSource.replace(/\r\n/g, "\n")).toContain('<Link\n      href={professional ? "/professional" : "/"}');
    expect(navSource).toContain('aria-label="Show Once — home"');
    expect(navSource).toContain("pointer-events-auto");
    expect(navSource).toContain("cursor-pointer");
    // mobile wordmark closes the menu and carries the unconditional light flag
    // and the face-aware professional prop (4.2.A)
    expect(navSource).toContain(
      '<WordmarkAnchor className="text-xl leading-none" onClick={close} light professional={isProfessional} />',
    );
  });

  it("the hero CTA is the Venom stage with a native cursor and no input/panel (v2.6)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("min(92vw, 520px)");
    expect(hero).not.toContain("bg-[#F59E0B]");
    expect(hero).not.toContain("hero-link-input");
    expect(hero).not.toContain("<input");
    expect(hero).not.toContain("panel w-full p-5");
  });

  it("the tagline loop is constrained via the .tagline-loop class and rule (Task D size, v2.6)", () => {
    expect(pageSource).toContain('className="tagline-loop font-sans font-medium text-white/85"');
    expect(globalsSource).toMatch(/\.tagline-loop\s*\{[^}]*font-size:\s*1\.625rem/);
    expect(globalsSource).toMatch(/\.tagline-loop\s*\{[^}]*height:\s*1\.3em/);
  });

  it("the empty-loop defect is fixed by wrapping the index advance modulo (Task D)", () => {
    // the old advance-and-snap is gone
    expect(loopSource).not.toContain('if (index === totalOriginal)');
    expect(loopSource).not.toContain("controls.set({ y: \"0%\" })");
    // the wrap is present and measures li[index]
    expect(loopSource).toContain("index = (index + 1) % duplicatedWords.length");
    expect(loopSource).toContain("updateWidth(index)");
  });

  it("the installed navbar spring is softened only (Task E); threshold/width/y unchanged", () => {
    expect(regSource).toContain("if (latest > 100)");
    expect(regSource).toContain('width: visible ? "40%" : "100%"');
    expect(regSource).toContain('width: visible ? "90%" : "100%"');
    expect(regSource).toContain("y: visible ? 20 : 0");
    expect(regSource).toContain("stiffness: 120");
    expect(regSource).toContain("damping: 26");
    expect(regSource).toContain("mass: 0.9");
  });
});

describe("v2.5 — hero stack budget + loop size from globals.css (Tasks A & B)", () => {
  const globalsSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const heroParticleSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/HeroParticleHeadline.tsx"),
    "utf8",
  );
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("the hero content is one centred column with max-w-[680px], mx-auto, and 104px (pt-26) top padding (Task A)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("mx-auto flex w-full max-w-[680px] flex-col items-center pt-26 text-center");
    expect(hero).toContain("pt-26");
    // not the old, larger 112px top padding
    expect(hero).not.toContain("pt-28");
  });

  it("the four fixed vertical margins are present on the stack children (20 / 10 / 28 / 14) (Task A)", () => {
    expect(pageSource).toContain('className="mt-5 w-full"');
    expect(pageSource).toContain('className="mt-2.5 w-full"');
    expect(pageSource).toContain('className="entrance entrance-3 mt-7"');
    expect(pageSource).toContain('className="mt-3.5 text-caption text-[#27272A]"');
  });

  it("HeroParticleHeadline uses the v2.5 fontSize stages 56 / 96 / 132 (Task A)", () => {
    expect(heroParticleSource).toContain("56 | 96 | 132");
    expect(heroParticleSource).toContain("if (width < 640) return 56;");
    expect(heroParticleSource).toContain("if (width < 1024) return 96;");
    expect(heroParticleSource).toContain("return 132;");
    expect(heroParticleSource).toContain("useState<56 | 96 | 132>(132)");
  });

  it("the .tagline-loop rules are unlayered with the size, inherit, window-height and ink colour (v2.13)", () => {
    // unlayered (no @layer wrapping them) + required values
    expect(globalsSource).toMatch(/\.tagline-loop\s*\{[^}]*font-size:\s*1\.625rem;[^}]*font-weight:\s*600;[^}]*line-height:\s*1\.15;[^}]*height:\s*1\.3em;[^}]*color:\s*#121212/);
    // the descendant rule directly sets ink colour (beats the word's own
    // layered `text-foreground` utility — no !important needed on colour)
    expect(globalsSource).toMatch(/\.tagline-loop\s*\*\s*\{[^}]*font-size:\s*inherit\s*!important;[^}]*line-height:\s*inherit\s*!important;[^}]*font-weight:\s*inherit;[^}]*color:\s*#121212/);
    // the window element (root's first child div) is pinned to one line
    expect(globalsSource).toMatch(/\.tagline-loop\s*>\s*div\s*\{[^}]*height:\s*1\.3em;[^}]*overflow:\s*hidden/);
  });

  it("the first loop word is still rendered in the hero DOM (Task B render)", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("build.");
  });
});

describe("v2.12 — cloud sky hero, venom CTA, finer particles, ink foreground (Tasks A–C)", () => {
  const venSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/HeroVenomCta.tsx"),
    "utf8",
  );
  const venInnerSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/venom-button/venom-button.tsx"),
    "utf8",
  );
  const skySource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/originkit/cloud-sky.tsx"),
    "utf8",
  );
  const navSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/PublicNavbar.tsx"),
    "utf8",
  );
  const heroSlice = (html: string) =>
    html.slice(0, html.indexOf("</section>") + 10);

  it("the hero mounts SkyGate and no satin reference remains in src/ or globals.css", () => {
    expect(pageSource).toContain("<SkyGate />");
    expect(pageSource).not.toContain("SatinGate");
    expect(pageSource).not.toContain("GrainGate");
    expect(pageSource).not.toContain("satin");
    expect(globalsSource).not.toContain("satin-drift");
    expect(globalsSource).not.toContain("@keyframes satin-drift");
    // The retired SatinGate file is deleted.
    const g = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/SkyGate.tsx"),
      "utf8",
    );
    expect(g).toContain('background="#0075FF"');
    expect(g).toContain('baseColor="#B4D2F0"');
    expect(g).toContain('accentColor="#FFFFFF"');
    expect(g).toContain("density={100}");
    expect(g).toContain("size={130}");
    expect(g).toContain("<CloudSky");
    // Cloud Sky is a WebGL gradient sky with drifting cloud layers.
    expect(skySource).toContain("getContext(\"webgl\"");
    expect(skySource).toContain("fbm");
  });

  it("HeroVenomCta renders the Venom Button with the specified props and a Link to /create via useRouter", () => {
    expect(venSource).toContain('label={s.finalCtaButton}');
    expect(venSource).toContain('router.push("/create")');
    expect(venSource).toContain("strands={7}");
    expect(venSource).toContain("sense={290}");
    expect(venSource).toContain("reach={140}");
    expect(venSource).toContain("release={215}");
    expect(venSource).toContain('cursor="native"');
    expect(venSource).toContain("autoplay={false}");
    expect(venSource).toContain("height={170}");
    expect(venSource).toContain("min(92vw, 520px)");
    // v2.7 Task B: the wrapper carries the venom-cta class and passes bg-transparent
    expect(venSource).toContain('className="venom-cta mx-auto');
    expect(venSource).toContain('className="bg-transparent"');
    // the installed component's documented defaults match our overrides
    expect(venInnerSource).toContain('strands = 7');
    expect(venInnerSource).toContain('sense = 290');
    expect(venInnerSource).toContain('reach = 140');
    expect(venInnerSource).toContain('release = 215');
  });

  it("the scoped .venom-cta rule forces the stage transparent (v2.7 Task B)", () => {
    expect(globalsSource).toMatch(/\.venom-cta\s*>\s*div\s*\{[^}]*background:\s*transparent\s*!important/);
  });

  it("the hero render includes the Venom stage and the privacy line under it, with only one CTA", async () => {
    const hero = heroSlice(await landing());
    expect(hero).toContain("min(92vw, 520px)");
    expect(hero).toContain("text-caption text-[#27272A]");
  });

  it("particles are light theme and the static fallback is grey (v2.13 Task A)", () => {
    expect(heroParticleSource).toContain('theme="light"');
    expect(heroParticleSource).toContain("text-[#52525B]");
    expect(heroParticleSource).toContain("resolution={2}");
    expect(heroParticleSource).toContain("pixelSize={3}");
    // Task A: the installed component's light-theme fill literal is grey
    const tpaSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/components/lightswind/text-particle-animation.tsx"),
      "utf8",
    );
    expect(tpaSource).toContain(
      'ctx.fillStyle = theme === "dark" ? "#ffffff" : "#52525B";',
    );
  });

  it("the navbar light treatment is unconditional on every route (v3 supersedes the v2.12 pathname scoping)", () => {
    expect(navSource).not.toContain('const light = pathname === "/"');
    expect(navSource).not.toContain(": \"bg-neutral-950/45");
    // light glass + ink link/wordmark classes are unconditional
    expect(navSource).toContain("!bg-white/65");
    expect(navSource).toContain("text-[#121212]");
    expect(navSource).toContain("text-[#D97706]");
    // WordmarkAnchor is passed light unconditionally, the face only changes
    // the ONCE colour (green on Professional, amber on Hobby — 4.2.A)
    expect(navSource).toContain(
      '<WordmarkAnchor className="text-xl leading-none" light professional={isProfessional} />',
    );
  });
});
