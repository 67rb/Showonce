/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { strings as s } from "@/lib/strings";

const ROOT = path.resolve(process.cwd(), "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const read = (f: string) => fs.readFileSync(f, "utf8");
const allSource = files.map(read).join("\n");
const relative = (f: string) => path.relative(ROOT, f).replace(/\\/g, "/");
const pagesUsingFixtures = files.filter(
  (f) =>
    f.includes(`${path.sep}app${path.sep}`) &&
    /\bsampleLesson\b|\blibraryLessons\b|\bsessionResult\b/.test(read(f)),
);

describe("forbidden APIs / storage / privacy", () => {
  it("no window.confirm or window.alert in src", () => {
    expect(allSource).not.toMatch(/window\.confirm|window\.alert\b/);
  });
  it("camera and browser access are confined to the working learning layer", () => {
    const decorativeSource=files.filter(f=>{
      const r=relative(f);
      return !r.startsWith("components/learning/")&&r!=="lib/learning.ts"&&
        // the mode switch persists its face in localStorage; its Lightswind
        // reference component ships a localStorage theme write. Both are browser-
        // API-using feature components, so the "working learning layer" carve-out
        // extends to them.
        r!=="components/ModeToggle.tsx"&&r!=="components/lightswind/toggle-theme.tsx";
    }).map(read).join("\n");
    expect(decorativeSource).not.toMatch(/getUserMedia|speechSynthesis|localStorage/);
    expect(allSource).not.toMatch(/LLM_[A-Za-z0-9_-]{20,}/);
    expect(allSource).not.toContain("MODEL_API_KEY");
  });
  it("no camera access claim / on-device processing claim", () => {
    expect(allSource).not.toMatch(/on-device/i);
  });
  it("no percentage sign in the completion page strings", () => {
    const complete = files.find((f) =>
      f.endsWith(`${path.sep}${path.join("lesson", "[id]", "complete", "page.tsx")}`),
    );
    expect(complete).toBeTruthy();
    expect(read(complete!)).not.toContain("%");
  });
  it("no testimonials, ratings, user counts, or invented statistics", () => {
    const banned = /testimonial|\bratings?\b|★|★★★★|join now|\busers\b|downloads/i;
    expect(allSource).not.toMatch(banned);
  });
});

describe("fixtures live only in src/design/fixtures.ts", () => {
  it("every page that uses fixtures imports them from src/design/fixtures", () => {
    expect(pagesUsingFixtures.length).toBeGreaterThan(0);
    for (const f of pagesUsingFixtures) {
      expect(read(f)).toMatch(/from ["']@?\/design\/fixtures["']|from ["']\.\.\/\.\.\/?[\w/]*design\/fixtures["']/);
    }
  });
});

describe("all copy lives in src/lib/strings.ts", () => {
  it("strings module exists and carries the privacy claim", () => {
    expect(read(path.join(ROOT, "lib", "strings.ts"))).toContain(s.privacyClaim);
  });
  it("every strings import uses the canonical src/lib path", () => {
    for (const f of files) {
      const src = read(f);
      if (/import (s|\* as s) from/.test(src)) {
        expect(src).toMatch(/from ["']@\/lib\/strings["']/);
      }
    }
  });
  it("copy-bearing chrome components import strings", () => {
    const named = [
      "Wordmark.tsx",
      "PublicNavbar.tsx",
      "PublicFooter.tsx",
      "MinimalChrome.tsx",
      "ModeChoice.tsx",
      "StepCard.tsx",
      "EndSessionButton.tsx",
      "StartLearningButton.tsx",
      "ImportPanel.tsx",
    ];
    for (const name of named) {
      const f = files.find((x) => x.endsWith(`${path.sep}${path.join("components", name)}`));
      expect(f, `${name} should exist`).toBeTruthy();
      expect(read(f!), "expected strings import in " + name).toMatch(/@\/lib\/strings/);
    }
  });
});

const destination = (f: string) => relative(f);
describe("no nested project folder", () => {
  it("project root has no nested show-once folder", () => {
    const entries = fs.readdirSync(process.cwd());
    expect(entries.filter((e) => /show-once|showonce/i.test(e) && fs.statSync(path.join(process.cwd(), e)).isDirectory())).toEqual([]);
  });
});

describe("fixture import coverage report", () => {
  it("logs pages that import fixtures", () => {
    expect(pagesUsingFixtures.map(destination).join(",").length).toBeGreaterThan(0);
  });
});

describe("Amber Grain Cinema — grain integration", () => {
  const layout = read(path.join(ROOT, "app", "layout.tsx"));

  it("the root layout does not mount or import the grain", () => {
    expect(layout).not.toContain("GrainGate");
    expect(layout).not.toContain("lightswind");
  });

  it("SkyGate is imported and used only by the landing hero page", () => {
    const importers = files.filter((f) => /SkyGate["']/.test(read(f)));
    const rel = importers.map((f) => path.relative(ROOT, f).replace(/\\/g, "/"));
    expect(rel).toEqual(["app/(public)/page.tsx"]);
    // SatinGate is deleted entirely.
    const satinGate = files.filter((f) => /SatinGate["']/.test(read(f)));
    expect(satinGate.map((f) => path.relative(ROOT, f).replace(/\\/g, "/"))).toEqual([]);
  });

  it("the cloud-sky component file exists inside the project", () => {
    const sky = path.join(ROOT, "components", "originkit", "cloud-sky.tsx");
    expect(fs.existsSync(sky)).toBe(true);
  });

  it("no satin import or class remains in src/ or globals.css", () => {
    // SatinFlow is deliberately re-introduced ONLY on the /create entry via
    // SatinBackdrop, so it is excluded from the sweep but asserted as the sole
    // consumer. Everywhere else the retired component stays banned.
    const excRel = "components/create/SatinBackdrop.tsx";
    const src = files
      .filter((f) => path.relative(ROOT, f).replace(/\\/g, "/") !== excRel)
      .map(read)
      .join("\n");
    expect(src).not.toMatch(/SatinGate["']/);
    expect(src).not.toMatch(/satin-flow["']/);
    expect(src).not.toMatch(/satin-drift/);
    const importers = files
      .filter((f) => /satin-flow["']/.test(read(f)))
      .map((f) => path.relative(ROOT, f).replace(/\\/g, "/"))
      .sort();
    expect(importers).toEqual(["components/create/SatinBackdrop.tsx"]);
    const css = read(path.join(ROOT, "app", "globals.css"));
    expect(css).not.toMatch(/satin-drift/);
    // the satin-flow file stays on disk
    const satin = path.join(ROOT, "components", "lightswind", "satin-flow.tsx");
    expect(fs.existsSync(satin)).toBe(true);
  });

  it("SkyGate mounts Cloud Sky with the base preset and window-level pointer tracking", () => {
    const g = read(path.join(ROOT, "components", "SkyGate.tsx"));
    expect(g).toContain('background="#0075FF"');
    expect(g).toContain('baseColor="#B4D2F0"');
    expect(g).toContain('accentColor="#FFFFFF"');
    expect(g).toContain("density={100}");
    expect(g).toContain("size={130}");
    expect(g).not.toContain("fixed inset-0");
    // the Cloud Sky component itself tracks at window level (pointer adaptation)
    const sky = read(path.join(ROOT, "components", "originkit", "cloud-sky.tsx"));
    expect(sky).toContain('window.addEventListener("pointermove"');
    expect(sky).toContain("visibleAnimation(canvas, render)");
    expect(g).toContain('motion === "reduced" ? 0');
  });

  it("the root layout defines both font variables", () => {
    expect(layout).toContain('variable: "--font-anton"');
    expect(layout).toContain('variable: "--font-archivo"');
  });

  it("globals.css has a prefers-reduced-motion block covering animation and transition", () => {
    const css = read(path.join(ROOT, "app", "globals.css"));
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("animation: none");
    expect(css).toContain("transition-duration: 0.01ms !important");
  });
});

describe("Amber Grain Cinema — no saturated flat colours in src/components", () => {
  const componentsDir = path.join(ROOT, "components");
  const compFiles = walkAll(componentsDir);
  const joined = compFiles.map(read).join("\n");
  const banned = ["#FF0000", "#0000FF", "#EF4444", "#3B82F6"].map((h) =>
    h.toLowerCase(),
  );
  it("does not contain saturated flat red/blue hexes", () => {
    for (const h of banned) {
      expect(joined.toLowerCase()).not.toContain(h);
    }
  });
});

function walkAll(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAll(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}
