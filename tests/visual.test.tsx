import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import s from "@/lib/strings";
import { libraryLessons, sampleLesson } from "@/design/fixtures";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { PublicFooter } from "@/components/PublicFooter";
import LandingPage from "@/app/(public)/page";
import CreatePage from "@/app/(public)/create/page";
import LessonsPage from "@/app/(public)/lessons/page";
import PrivacyPage from "@/app/(public)/privacy/page";
import DesignPage from "@/app/(public)/design/page";
import PlayPage from "@/app/(minimal)/lesson/[id]/play/page";
import CameraPage from "@/app/(minimal)/lesson/[id]/play/camera/page";

const markup = (node: React.ReactElement) => renderToStaticMarkup(node);

const decode = (h: string) =>
  h.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

// Task D wraps a heading's final word in a .font-serif-accent span, so heading
// assertions run against tag-stripped text to compare the visible string.
const text = (h: string) =>
  decode(h).replace(/<[^>]*>/g, "").replace(/\s+/g, " ");

describe("Amber Grain Cinema — 1.2 typography", () => {
  it("hero headline uses the display family at display size", async () => {
    const html = markup(await LandingPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("font-display text-display uppercase leading-display");
  });
});

describe("Amber Grain Cinema — 1.3 KeyframeVisual bricks", () => {
  it("renders matte flat brick fills with circle studs and no radial gloss", () => {
    const html = markup(
      <KeyframeVisual spec={sampleLesson.steps[2].keyframe} label="scene" />,
    );
    expect(html).toContain("#B44336"); // brick (red) flat fill
    expect(html).toContain("#46617E"); // steel (blue) flat fill
    // studs render through a perfect circle shape
    expect(html).toContain("9999px");
    // no radial-gradient or gloss construct in the output
    expect(html).not.toContain("radial-gradient");
  });
});

describe("Amber Grain Cinema — 1.4 landing rhythm (v1.2)", () => {
  it("renders the eyebrow labels", async () => {
    const html = markup(await LandingPage({ searchParams: Promise.resolve({}) }));
    // v1.3.2 (Task C): the hero no longer renders an eyebrow above the
    // wordmark (it duplicated the wordmark); s.eyebrowHero stays in
    // strings.ts but is intentionally not rendered.
    // Site language v3: the privacy band is the amber block and shows its
    // heading (s.privacyHeading), so s.eyebrowPrivacy is no longer rendered.
    for (const eyebrow of [
      s.eyebrowHowItWorks,
      s.eyebrowCapabilities,
      s.eyebrowScope,
    ]) {
      expect(html).toContain(eyebrow);
    }
  });

  it("how-it-works renders three numbered Inter Tight cards (no Anton ghost numbers)", async () => {
    const html = markup(await LandingPage({ searchParams: Promise.resolve({}) }));
    expect((html.match(/ghost-number/g) || []).length).toBe(0);
    expect(html).toContain("font-display-ui");
    expect(html).toContain(s.howStep1Title);
    expect(html).toContain(s.howStep2Title);
    expect(html).toContain(s.howStep3Title);
    expect(html).not.toContain("scope-can");
    expect(html).not.toContain("scope-cant");
  });

  it("the capability section is light ground with colour washes and the four cards", async () => {
    const html = markup(await LandingPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("bg-site-page");
    expect(html).toContain("capability-wash");
    expect(text(html)).toContain(s.eyebrowCapabilities);
    expect(text(html)).toContain(s.galleryMoreTitle);
    expect(text(html)).toContain(s.galleryLineTower);
  });

  it("the capability heading is composed on two lines with the serif accent over the final two words", async () => {
    const html = markup(await LandingPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain(">What SHOW ONCE<br");
    expect(html).toContain('<span class="font-serif-accent">can check.</span>');
  });

  it("renders the scope three-card hover row (It can teach / Hobby / Professional)", async () => {
    const html = markup(await LandingPage({ searchParams: Promise.resolve({}) }));
    expect(text(html)).toContain(s.canHeading);
    expect(text(html)).toContain(s.canItems[0]);
    expect(text(html)).toContain(s.audienceHobbyTitle);
    expect(text(html)).toContain(s.audienceProfessionalTitle);
    expect(html).toContain("h-2.5 w-2.5"); // amber square marker
    expect(html).toContain(s.canCantClosing);
    expect(text(html)).not.toContain(s.cantHeading); // can't panel is retired from the landing
  });

  it("lessons rows render a KeyframeVisual thumbnail per fixture lesson", async () => {
    const html = markup(await LessonsPage({ searchParams: Promise.resolve({}) }));
    expect((html.match(/role="img"/g) || []).length).toBe(3);
    for (const lesson of libraryLessons) expect(html).toContain(lesson.title);
  });
});

describe("Amber Grain Cinema — footer wordmark", () => {
  it("renders the ink footer with the solid Anton wordmark (white + accent-deep)", () => {
    const html = markup(<PublicFooter />);
    expect(html).toContain("bg-site-ink");
    expect(html).toContain("font-display");
    expect(html).toContain("text-white");
    expect(html).toContain("text-[#D97706]");
    expect(html).toContain(`${s.wordmarkShow}`);
    expect(html).toContain(`${s.wordmarkOnce}`);
    // the old outline treatment (footer-outline) is gone in v3
    expect(html).not.toContain("footer-outline");
  });
});

describe("Amber Grain Cinema — 1.3 app screens", () => {
  it("site-language routes use the Inter Tight display font; /design keeps its section-title", async () => {
    const create = markup(await CreatePage({ searchParams: Promise.resolve({}) }));
    const lessons = markup(await LessonsPage({ searchParams: Promise.resolve({}) }));
    const privacy = markup(PrivacyPage());
    const design = markup(DesignPage());
    for (const html of [create, lessons, privacy]) {
      expect(html).toContain("font-display-ui");
    }
    // /design is not part of the re-skin allowlist; keeps its existing heading
    expect(design).toContain("section-title");
  });

  it("verdict state wrappers use the light screen ground with semantic verdict headings", async () => {
    const right = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "right" }) }));
    const wrong = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "wrong" }) }));
    const canttell = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "canttell" }) }));
    const step = markup(await PlayPage({ params: Promise.resolve({ id: "sample" }), searchParams: Promise.resolve({ state: "step" }) }));
    // semantic verdict headline colours
    expect(right).toContain("text-success");
    expect(wrong).toContain("text-danger");
    expect(canttell).toContain("text-site-muted");
    // the dark play-verdict full-page tints are gone
    expect(right).not.toContain("play-verdict-right");
    expect(step).not.toContain("play-verdict-right");
  });

  it("camera page renders four corner brackets and a ring capture button", () => {
    const html = markup(<CameraPage />);
    expect(html).toContain("border-l-2 border-t-2 border-accent/70");
    expect(html).toContain("border-r-2 border-t-2 border-accent/70");
    expect(html).toContain("border-b-2 border-l-2 border-accent/70");
    expect(html).toContain("border-b-2 border-r-2 border-accent/70");
    expect(html).toContain("h-[72px] w-[72px]");
    expect(html).toContain("border-[3px]");
    expect(html).toContain("h-[70%] w-[70%]");
  });
});