/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
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
    const html = markup(await LandingPage());
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
    const html = markup(await LandingPage());
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
    const html = markup(await LandingPage());
    expect((html.match(/ghost-number/g) || []).length).toBe(0);
    expect(html).toContain("font-display-ui");
    expect(html).toContain(s.howStep1Title);
    expect(html).toContain(s.howStep2Title);
    expect(html).toContain(s.howStep3Title);
    expect(html).not.toContain("scope-can");
    expect(html).not.toContain("scope-cant");
  });

  it("the capability section is light ground with colour washes and the four cards", async () => {
    const html = markup(await LandingPage());
    expect(html).toContain("bg-site-page");
    expect(html).toContain("capability-wash");
    expect(text(html)).toContain(s.eyebrowCapabilities);
    expect(text(html)).toContain(s.galleryMoreTitle);
    expect(text(html)).toContain(s.galleryLineTower);
  });

  it("the capability heading is composed on two lines with the serif accent over the final two words", async () => {
    const html = markup(await LandingPage());
    expect(html).toContain(">What SHOW ONCE<br");
    expect(html).toContain('<span class="font-serif-accent">can check.</span>');
  });

  it("renders the scope three-card hover row (It can teach / Hobby / Professional)", async () => {
    const html = markup(await LandingPage());
    expect(text(html)).toContain(s.canHeading);
    expect(text(html)).toContain(s.canItems[0]);
    expect(text(html)).toContain(s.audienceHobbyTitle);
    expect(text(html)).toContain(s.audienceProfessionalTitle);
    expect(html).toContain("h-2.5 w-2.5"); // amber square marker
    expect(html).toContain(s.canCantClosing);
    expect(text(html)).not.toContain(s.cantHeading); // can't panel is retired from the landing
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
