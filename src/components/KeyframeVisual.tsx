/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { BlockSpec, KeyframeSpec } from "@/design/fixtures";

/**
 * Pure-CSS top-down schematic of bricks on a dark mat (Site language v3, Adorn).
 *
 * Flat matte fills, 10px rounded corners, perfect-circle studs flat-shaded 12%
 * darker than the brick fill, and one soft shadow per brick. A brick flagged
 * `tile` renders thinner with no studs (mosaic scenes). Two render variants
 * share identical geometry: "step" (clean schematic) and "photo" (identical
 * geometry plus a 0.94 brightness, a soft vignette and white viewfinder corner
 * brackets).
 *
 * Task B (v2.20): studs are ~17% of the brick width (not oversized) and each
 * brick gains a 1px flat top-edge bevel line in its fill lightened 10% (a flat
 * line, not a gradient). A new `fit` mode scales the whole scene to fit inside
 * the stage with ~padding on all sides (aspect preserved, centred) so no brick
 * is ever clipped by the stage edge, whatever the stage's aspect.
 *
 * Task D (v2.20): the photo variant accepts an optional `highlightId`; the
 * brick carrying that `id` is ringed with a dashed amber ring offset outside it.
 */

type Variant = "step" | "photo";
type Tone = { base: string };

const COLS = 3;
const ROWS = 3;
/** Percentage gap subtracted from each brick's cell so bricks sit apart. */
const GAP = 6;

const BRICK: Tone = { base: "#B44336" };
const STEEL: Tone = { base: "#46617E" };
const AMBER: Tone = { base: "#D99A26" };
const BONE: Tone = { base: "#D8CFB8" };
const SAGE: Tone = { base: "#5F7161" };

function hueSat(hex: string): { h: number; s: number } {
  let c = (hex || "").replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return { h: 0, s: 0 };
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s };
}

function toneFor(input: string): Tone {
  const { h, s } = hueSat(input);
  if (s < 0.18) return BONE;
  if (h < 25 || h >= 335) return BRICK;
  if (h < 72) return AMBER;
  if (h < 168) return SAGE;
  return STEEL;
}

/** Flat-shade a hex colour `amt` (0-1) darker. Used only for studs. */
function darken(hex: string, amt: number): string {
  let c = (hex || "").replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const f = (v: number) =>
    Math.round(v * (1 - amt)).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

/** Lighten a hex colour `amt` (0-1) toward white. Used for the bevel line. */
function lighten(hex: string, amt: number): string {
  let c = (hex || "").replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const f = (v: number) =>
    Math.round(v + (255 - v) * amt).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

export function KeyframeVisual({
  spec,
  label,
  dim = false,
  className = "",
  variant = "step",
  fit = false,
  fitPadding = 0.08,
  highlightId,
}: {
  spec: KeyframeSpec;
  label?: string;
  /** Renders at reduced opacity (used as a stand-in "camera" scene). */
  dim?: boolean;
  className?: string;
  /** "step" (clean schematic) or "photo" (identical geometry + frame). */
  variant?: Variant;
  /** Fit mode: scale the whole scene to fit the stage with padding (Task B). */
  fit?: boolean;
  /** Padding as a fraction of the stage's shorter fit axis (default 8%). */
  fitPadding?: number;
  /** Photo variant: ring the brick carrying this id (Task D). */
  highlightId?: string;
}) {
  const photo = variant === "photo";
  const cellW = `${100 / COLS - GAP}%`;
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const matRef = useRef<HTMLDivElement>(null);

  // Measure the stage box in fit mode so the scene can be scaled to fit it.
  useEffect(() => {
    if (!fit) return;
    const el = matRef.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    return () => ro?.disconnect();
  }, [fit]);

  // Fit geometry: scale = how many px of stage each grid fraction occupies.
  let sceneStyle: CSSProperties | null = null;
  if (fit && box) {
    const cellF = (100 / COLS - GAP) / 100;
    const tileF = ((100 / ROWS - GAP) * 0.6) / 100;
    let minL = Infinity;
    let minT = Infinity;
    let maxR = -Infinity;
    let maxB = -Infinity;
    for (const bd of spec.blocks) {
      const left = bd.x / COLS;
      const top = bd.y / ROWS;
      const w = cellF;
      const h = bd.tile ? tileF : cellF;
      minL = Math.min(minL, left);
      minT = Math.min(minT, top);
      maxR = Math.max(maxR, left + w);
      maxB = Math.max(maxB, top + h);
    }
    const contentW = Math.max(1e-6, maxR - minL);
    const contentH = Math.max(1e-6, maxB - minT);
    const availW = box.w * (1 - 2 * fitPadding);
    const availH = box.h * (1 - 2 * fitPadding);
    const side = Math.min(availW / contentW, availH / contentH);
    sceneStyle = {
      position: "absolute",
      left: (box.w - contentW * side) / 2 - minL * side,
      top: (box.h - contentH * side) / 2 - minT * side,
      width: side,
      height: side,
    };
  }

  const renderBrick = (bd: BlockSpec, i: number, keyPrefix: string) => {
    const tone = toneFor(bd.color);
    const tile = !!bd.tile;
    const stud = darken(tone.base, 0.12);
    const bevel = lighten(tone.base, 0.1);
    const ringed = photo && bd.id != null && bd.id === highlightId;
    return (
      <div
        key={`${keyPrefix}-${bd.color}-${bd.x}-${bd.y}-${bd.tile ? "t" : ""}-${bd.id ?? ""}-${i}`}
        className="absolute"
        data-brick-id={bd.id}
        style={{
          left: `${(bd.x / COLS) * 100}%`,
          top: `${(bd.y / ROWS) * 100}%`,
          width: cellW,
          height: tile ? `${(100 / ROWS - GAP) * 0.6}%` : cellW,
          borderRadius: 10,
          background: tone.base,
          boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
        }}
      >
        {/* 1px flat top-edge bevel, fill lightened 10% (a flat line) */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0"
          style={{
            height: 1,
            background: bevel,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
        />
        {!tile && (
          <>
            {/* two studs ~17% of the brick width, flat-shaded circles */}
            <span
              aria-hidden
              className="absolute"
              style={{
                left: "24%",
                top: "18%",
                width: "17%",
                height: "17%",
                borderRadius: "9999px",
                background: stud,
              }}
            />
            <span
              aria-hidden
              className="absolute"
              style={{
                left: "58%",
                top: "18%",
                width: "17%",
                height: "17%",
                borderRadius: "9999px",
                background: stud,
              }}
            />
          </>
        )}
        {/* Task D: dashed amber ring offset 6px outside the differing brick */}
        {ringed && (
          <span
            aria-hidden
            className="brick-ring pointer-events-none absolute"
            style={{
              left: -6,
              top: -6,
              width: "calc(100% + 12px)",
              height: "calc(100% + 12px)",
              border: "2px dashed #F59E0B",
              borderRadius: 12,
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={matRef}
        role="img"
        aria-label={label}
        className={
          "relative w-full overflow-hidden rounded-[14px] " +
          "transition-opacity duration-[150ms] " +
          (fit ? "h-full" : "aspect-square") +
          " " +
          (dim ? "opacity-40" : "opacity-100")
        }
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "#1D1D21",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: `calc(100% / ${COLS}) calc(100% / ${ROWS}), calc(100% / ${COLS}) calc(100% / ${ROWS})`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ filter: photo ? "brightness(0.94)" : undefined }}
        >
          {sceneStyle ? (
            <div className="absolute" style={sceneStyle}>
              {spec.blocks.map((bd, i) => renderBrick(bd, i, "fit"))}
            </div>
          ) : (
            <div className="absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2">
              {spec.blocks.map((bd, i) => renderBrick(bd, i, "blk"))}
            </div>
          )}
        </div>

        {photo && (
          <>
            {/* soft vignette (inset shadow) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: "inset 0 0 48px 20px rgba(0,0,0,0.32)" }}
            />
            {/* white viewfinder corner brackets, inset 12px inside the stage */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-white/90"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-white/90"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-white/90"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-white/90"
            />
          </>
        )}
      </div>
    </div>
  );
}