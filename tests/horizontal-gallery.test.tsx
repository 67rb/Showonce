import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { HorizontalGallery } from "@/components/HorizontalGallery";
import s from "@/lib/strings";

/**
 * v2.24 — the capability cards are TEXT-ONLY liquid glass.
 * renderToStaticMarkup SSR: the 3D row renders; effects don't run, so the
 * reduced-motion fallback is asserted from source. Tasks A & C verified here.
 */
describe("Task A — card text is ink; Task C — cards are text only", () => {
  it("renders the four capability cards with their titles and lines", () => {
    const html = renderToStaticMarkup(<HorizontalGallery />);
    // & is HTML-escaped (&amp;) in markup; normalise before matching text.
    const text = html.replace(/&amp;/g, "&");
    for (const t of [
      s.galleryTitleTower,
      s.galleryTitleMosaic,
      s.galleryTitleWall,
      s.galleryMoreTitle,
    ]) {
      expect(text).toContain(t);
    }
    expect(text).toContain(s.galleryLineTower);
    expect(text).toContain(s.galleryLineMosaic);
    expect(text).toContain(s.galleryLineWall);
    expect(text).toContain(s.galleryMoreLine);
  });

  it("cards carry no stage visual, chip, or meta", () => {
    const html = renderToStaticMarkup(<HorizontalGallery />);
    expect(html).not.toContain("stage-16-10");
    expect(html).not.toContain("family-pill");
    expect(html).not.toContain('data-parallax="0.06"');
    expect(html).not.toContain("role=");
  });

  it("card text uses ink colours (title #16161A, line #52525B)", () => {
    const html = renderToStaticMarkup(<HorizontalGallery />);
    expect(html).toContain("!text-[#16161A]");
    expect(html).toContain("!text-[#52525B]");
  });

  it("still rides the 3D scroll-trigger row with no pinned markers or cursor badge", () => {
    const html = renderToStaticMarkup(<HorizontalGallery />);
    expect(html).toContain("perspective:1200px");
    expect(html).toContain("transform-gpu");
    expect(html).not.toContain("data-gallery-stage");
    expect(html).not.toContain("data-cursor-badge");
  });
});

describe("Task A/B/C — source assertions", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/HorizontalGallery.tsx"),
    "utf8",
  );
  const stringsSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/strings.ts"),
    "utf8",
  );

  it("adds the three capability-title strings verbatim", () => {
    expect(stringsSrc).toContain('galleryTitleTower: "Block builds"');
    expect(stringsSrc).toContain('galleryTitleMosaic: "Bead & tile patterns"');
    expect(stringsSrc).toContain('galleryTitleWall: "Brickwork"');
  });

  it("applies ink colour utilities to the title and the description", () => {
    expect(source).toContain("!text-[#16161A]");
    expect(source).toContain("!text-[#52525B]");
  });

  it("removes the KeyframeVisual stage and ceases reading fixtures", () => {
    expect(source).not.toContain('from "./KeyframeVisual"');
    expect(source).not.toContain("<KeyframeVisual");
    expect(source).not.toContain("@/design/fixtures");
    expect(source).not.toContain("stage-16-10");
    expect(source).not.toContain("family-pill");
    expect(source).not.toContain("stepsSuffix");
  });

  it("Task B — no leftover tall-wrapper, minimal marquee padding", () => {
    expect(source).not.toContain("100vh");
    expect(source).not.toContain("min-h-screen");
    expect(source).not.toContain("gallery-stage");
    expect(source).not.toContain('className="py-10"');
  });

  it("keeps the 3D row + LiquidGlassCard props and the new card width", () => {
    expect(source).toContain('from "@/components/lightswind/3d-scroll-trigger"');
    expect(source).toContain('from "@/components/lightswind/liquid-glass-card"');
    expect(source).toContain("baseVelocity={4}");
    expect(source).toContain("direction={-1}");
    expect(source).toContain('variant="glass"');
    expect(source).toContain("w-[min(80vw,480px)]");
  });

  it("Task A — cards are 320px tall (min 260) with 32px title padding", () => {
    expect(source).toContain("min-h-[260px] md:h-[320px]");
    expect(source).toContain("p-8");
  });

  it("Task B — header-to-row 40px, marquee padding ~24px", () => {
    expect(source).toContain('className="py-3"');
    expect(source).toContain("mt-10");
  });

  it("Task C — opaque backing behind the glass card and 16px child padding", () => {
    expect(source).toContain("absolute inset-0 rounded-3xl bg-white");
    expect(source).toContain("px-4");
  });
});

describe("Task B — landing composition gap (source)", () => {
  const page = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/(public)/page.tsx"),
    "utf8",
  );

  it("the capabilities section carries no min-height or viewport sizing", () => {
    const cap = page.slice(page.indexOf("CAPABILITIES"), page.indexOf("CAN / CAN'T"));
    expect(cap).not.toMatch(/min-h|h-screen|100vh/);
  });

  it("the capabilities section stays immediately after how-it-works (no empty shell between)", () => {
    const capAt = page.indexOf("CAPABILITIES");
    // the region from the how-it-works section close up to the CAPABILITIES
    // comment must be empty of any section/div shell.
    const leading = page.slice(
      page.lastIndexOf("</section>", capAt),
      page.indexOf("{/* CAPABILITIES"),
    );
    expect(leading).not.toMatch(/<section|<div/);
  });
});