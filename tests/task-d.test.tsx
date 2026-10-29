import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";

import { KeyframeVisual } from "@/components/KeyframeVisual";
import {
  sampleLesson,
  mosaicLesson,
  wallLesson,
  libraryLessons,
} from "@/design/fixtures";

const markup = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("Task D — fixture inventory (Adorn)", () => {
  it("provides three fixture lessons, all inside the product's locked scope", () => {
    const lessons = [sampleLesson, mosaicLesson, wallLesson];
    expect(lessons.length).toBe(3);
    for (const lesson of lessons) {
      expect(lesson.title.length).toBeGreaterThan(0);
      expect(lesson.steps.length).toBeGreaterThan(0);
    }
  });

  it("the stepped tower progresses base → offset row → contrast → silhouette", () => {
    expect(sampleLesson.stepCount).toBe(4);
    // base row of 3
    expect(sampleLesson.steps[0].keyframe.blocks.length).toBe(3);
    expect(sampleLesson.steps[0].keyframe.blocks.every((b) => b.y === 2)).toBe(true);
    // second row of 2, offset over the base
    expect(sampleLesson.steps[1].keyframe.blocks.length).toBe(2);
    // step 2 introduces a contrasting (blue) brick
    expect(sampleLesson.steps[2].keyframe.blocks.some((b) => b.color === "#3B82F6")).toBe(true);
    // the final step completes a stepped silhouette — a brick in each row —
    // and the contrast resolves into the silhouette (no blue remains)
    const rows = [...new Set(sampleLesson.steps[3].keyframe.blocks.map((b) => b.y))].sort();
    expect(rows).toEqual([0, 1, 2]);
    // v2.20 (Task B) recolour: base bone/steel/bone, middle sage/(gap)/steel,
    // top steel/RED — red is the single accent brick in the silhouette.
    const k = [...sampleLesson.steps[3].keyframe.blocks];
    const base = k.filter((b) => b.y === 2);
    const mid = k.filter((b) => b.y === 1).sort((a, b) => a.x - b.x);
    const top = k.filter((b) => b.y === 0).sort((a, b) => a.x - b.x);
    expect(base.map((b) => b.color)).toEqual(["#B8B8B8", "#3B82F6", "#B8B8B8"]);
    expect(mid.map((b) => b.color)).toEqual(["#2F8F4E", "#3B82F6"]);
    expect(top.map((b) => b.color)).toEqual(["#3B82F6", "#EF4444"]);
    expect(k.filter((b) => b.color === "#EF4444").length).toBe(1);
  });

  it("the mosaic strip uses flat tiles (no studs) and progresses colours per step", () => {
    // flat tiles, no studs
    expect(
      mosaicLesson.steps.every((step) =>
        step.keyframe.blocks.every((block) => block.tile === true),
      ),
    ).toBe(true);
    // colours progress per step (blocks grow monotonically)
    const counts = mosaicLesson.steps.map((step) => step.keyframe.blocks.length);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThan(counts[i - 1]);
    }
  });

  it("the brick wall adds bricks per step across two staggered rows", () => {
    expect(wallLesson.stepCount).toBe(3);
    for (let i = 1; i < wallLesson.steps.length; i++) {
      expect(wallLesson.steps[i].keyframe.blocks.length).toBeGreaterThan(
        wallLesson.steps[i - 1].keyframe.blocks.length,
      );
    }
  });

  it("the WRONG state differs by exactly one brick's colour", () => {
    const key = sampleLesson.steps[2].keyframe.blocks;
    const photo = sampleLesson.steps[2].photo.blocks;
    expect(key.length).toBe(photo.length);
    const differing = key.filter(
      (brick, i) => brick.color !== photo[i].color,
    ).length;
    expect(differing).toBe(1);
  });

  it("the WRONG photo flips exactly the accent brick (top-right) red → steel", () => {
    const key = sampleLesson.steps[2].keyframe.blocks;
    const photo = sampleLesson.steps[2].photo.blocks;
    const ki = key.findIndex((b) => b.id === "accent");
    const pi = photo.findIndex((b) => b.id === "accent");
    expect(ki).toBeGreaterThan(-1);
    expect(pi).toBeGreaterThan(-1);
    expect(key[ki].color).toBe("#EF4444");
    expect(photo[pi].color).toBe("#3B82F6");
    // every other brick is identical between step and photo
    const others = key.filter((_, i) => i !== ki);
    const pothers = photo.filter((_, i) => i !== pi);
    expect(others.every((b, i) => b.color === pothers[i].color)).toBe(true);
  });

  it("the CAN'T TELL state offsets exactly one brick beyond the mat edge", () => {
    const key = sampleLesson.steps[0].keyframe.blocks;
    const photo = sampleLesson.steps[0].photo.blocks;
    expect(key.length).toBe(photo.length);
    const outOfFrame = photo.filter(
      (brick) => brick.x > 2.6 || brick.x < -0.5 || brick.y > 2.6,
    );
    expect(outOfFrame.length).toBe(1);
  });

  it("the three lessons appear in the library list", () => {
    expect(libraryLessons.length).toBe(3);
  });
});

describe("Task D — KeyframeVisual variants share geometry", () => {
  const spec = sampleLesson.steps[3].keyframe;

  it("renders step and photo variants with identical brick geometry", () => {
    const step = markup(<KeyframeVisual spec={spec} variant="step" />);
    const photo = markup(<KeyframeVisual spec={spec} variant="photo" />);
    const stepLeft = (step.match(/left:([\d.]+%)/g) || []).sort();
    const photoLeft = (photo.match(/left:([\d.]+%)/g) || []).sort();
    expect(stepLeft.length).toBeGreaterThan(0);
    expect(stepLeft).toEqual(photoLeft);
  });

  it("the photo variant adds brightness, a vignette and white corner brackets; the step variant does not", () => {
    const step = markup(<KeyframeVisual spec={spec} variant="step" />);
    const photo = markup(<KeyframeVisual spec={spec} variant="photo" />);
    expect(photo).toContain("brightness(0.94)");
    expect(photo).toContain("inset 0 0 48px 20px");
    expect((photo.match(/border-white\/90/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(step).not.toContain("brightness");
    expect(step).not.toContain("border-white");
  });
});

describe("Task D — KeyframeVisual renderer source", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/KeyframeVisual.tsx"),
    "utf8",
  );

  it("contains no radial-gradient or gloss construct", () => {
    expect(source).not.toMatch(/radial-gradient/i);
    expect(source).not.toMatch(/gloss/i);
  });

  it("draws studs through a circle shape", () => {
    const html = markup(<KeyframeVisual spec={sampleLesson.steps[0].keyframe} />);
    expect(html).toContain("9999px");
  });
});

describe("Task B — KeyframeVisual renderer (studs, bevel, fit, highlight)", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/KeyframeVisual.tsx"),
    "utf8",
  );

  it("studs are ~17% of the brick width (not oversized)", () => {
    expect(source).toContain('width: "17%"');
    expect(source).toContain('height: "17%"');
  });

  it("bricks gain a 1px flat top-edge bevel in their fill lightened 10%", () => {
    expect(source).toContain("lighten(");
    expect(source).toContain("height: 1");
    expect(source).toMatch(/background: bevel/i);
  });

  it("exposes a fit mode with 8% default padding and the highlight identity prop", () => {
    expect(source).toContain("fit = false");
    expect(source).toContain("fitPadding = 0.08");
    expect(source).toContain("highlightId");
    expect(source).toContain('fit ? "h-full" : "aspect-square"');
  });

  it("the photo variant rings the highlighted brick (dashed amber)", () => {
    const html = markup(
      <KeyframeVisual
        spec={sampleLesson.steps[2].photo}
        variant="photo"
        highlightId="accent"
      />,
    );
    expect(html).toContain("brick-ring");
    expect(html).toContain("2px dashed #F59E0B");
  });
});