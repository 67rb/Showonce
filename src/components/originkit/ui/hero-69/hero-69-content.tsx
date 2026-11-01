// Delivered by Originkit · stack: nextjs · styling: tailwind
/* eslint-disable */
// @ts-nocheck
"use client";
// Branded content slots for SHOW ONCE /professional (colours as installed):
// the ember husk + pro* headline/CTA slots. The demo header (wordmark +
// ModeToggle) is removed so the shared, face-aware PublicNavbar is the page's
// only header (task 4.2.A).
import EmberHusk from "@/components/originkit/ui/hero-69/ember-husk";
import s from "@/lib/strings";

const GRID_X = [19.4, 50.8, 82.4];
const GRID_Y = [33.6, 67.4];
const PLUSES: [number, number][] = [
  [19.4, 67.4],
  [82.4, 67.4],
  [50.8, 33.6],
];

export default function App() {
  return (
    <main className="hero">
      <svg className="lines grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {GRID_X.map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={100} />
        ))}
        {GRID_Y.map((y) => (
          <line key={y} x1={0} y1={y} x2={100} y2={y} />
        ))}
      </svg>

      <div className="husk">
        <EmberHusk
          size={1.1}
          background={{ color: "#FFFFFF", glowColor: "#000000", glow: 0 }}
          structure={{ shards: 14, irregularity: 8, thickness: 7 }}
          rock={{ color: "#1B1A17", weathering: 3, seam: 2 }}
          core={{ color: "#04E762", hotColor: "#8BFFC0", intensity: 4, flow: 4 }}
          crosses={{ count: 0 }}
          debris={{ count: 54, size: 5, spread: 5 }}
          beads={5}
          drift={{ spin: 2, bob: 4, sway: 3 }}
          glow={{ strength: 3, radius: 4, threshold: 6 }}
        />
      </div>

      {PLUSES.map(([x, y]) => (
        <span key={`${x}${y}`} className="plus" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}

      <section className="intro">
        <h1>
          {s.proHeroHeadline}
          <br />{" "}
          {s.proHeroHeadlineAccent}
        </h1>
        <p className="desc">{s.proHeroSub}</p>
      </section>

      <section className="cta">
        <p className="desc">{s.proStubLine}</p>
        <div className="cta-actions mono">
          <a className="primary" href="/professional/create">
            <span className="play" aria-hidden />
            {s.proHeroPrimaryCta.toUpperCase()}
          </a>
          <a href="/professional/lessons">{s.proHeroSecondaryCta.toUpperCase()} →</a>
        </div>
      </section>
    </main>
  );
}
