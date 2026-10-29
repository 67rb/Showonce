/**
 * DESIGN SCAFFOLD CONTENT ONLY — replaced when the tools are built.
 *
 * This file holds every piece of fixture content the scaffold renders: the
 * three fixture lessons, the library lessons, and the session result for the
 * completion screen. No tool logic exists here and nothing here claims to be
 * real functionality or a real result.
 *
 * Task D (Site language v3, Adorn): the single former filler lesson is
 * replaced by three lessons inside the product's locked scope (flat, visible,
 * object skills). All titles and step captions come from src/lib/strings.ts.
 */

import { strings } from "@/lib/strings";

/** A single flat block on a 3×3 grid. x/y are grid columns/rows (0–2);
    x/y may drift past the grid to represent a brick partly out of frame. */
export type BlockSpec = {
  color: string;
  x: number;
  y: number;
  /** Flat tile: thinner, no studs (mosaic scenes). */
  tile?: boolean;
  /** Brick identity; lets the photo variant ring a specific block (Task D). */
  id?: string;
};

/** A KeyframeVisual scene (blocks laid out on a dark mat). */
export type KeyframeSpec = {
  blocks: BlockSpec[];
};

export type FixtureStep = {
  caption: string;
  /** Status line shown on a StepCard. Design-state only. */
  visibleState: string;
  /** What "done" looks like for this step. */
  keyframe: KeyframeSpec;
  /** The learner's photo. Steps flagged below differ from their keyframe. */
  photo: KeyframeSpec;
};

export type FixtureLesson = {
  id: string;
  title: string;
  steps: FixtureStep[];
  meta: string;
  date: string;
  stepCount: number;
};

export type LibraryLesson = {
  id: string;
  title: string;
  stepCount: number;
  meta: string;
  date: string;
};

export type SessionResult = {
  totalTime: string;
  stepsCompleted: string;
  neededMoreThanOneCheck: string[];
};

const RED = "#EF4444";
const BLUE = "#3B82F6";
/* Task B palette additions: desaturated bone and a green sage, tone-mapped by
   KeyframeVisual (bone → BONE, sage → SAGE). */
const BONE = "#B8B8B8";
const SAGE = "#2F8F4E";

/** Arrangement helper: wrap a block array into a scene. */
const scene = (blocks: BlockSpec[]): KeyframeSpec => ({ blocks });
const b = (
  color: string,
  x: number,
  y: number,
  tile = false,
  id?: string,
): BlockSpec => ({
  color,
  x,
  y,
  ...(tile ? { tile: true } : {}),
  ...(id ? { id } : {}),
});

/* ------------------------------------------------------------------ */
/* Fixture lesson 1 — the stepped tower (two-layer block build).       */
/* Progresses: base row of 3 → second row of 2 offset → a contrasting  */
/* brick placed → top brick completing a stepped silhouette.           */
/* step 2 photo is the WRONG state (exactly one brick colour differs); */
/* step 0 photo is the CAN'T TELL state (one brick partly out of frame).*/
/* ------------------------------------------------------------------ */
export const sampleLesson: FixtureLesson = {
  id: "sample",
  title: strings.fixtureTowerTitle,
  meta: strings.fixtureTowerMeta,
  date: "Today",
  stepCount: 4,
  steps: [
    {
      caption: strings.fixtureTowerStep0,
      visibleState: "Done",
      keyframe: scene([b(BONE, 0, 2), b(BLUE, 1, 2), b(BONE, 2, 2)]),
      // CAN'T TELL: the right brick is offset past the mat edge, so part is
      // out of frame — exactly one brick partly out of frame.
      photo: scene([b(BONE, 0, 2), b(BLUE, 1, 2), b(BONE, 3.2, 2)]),
    },
    {
      caption: strings.fixtureTowerStep1,
      visibleState: "Needed more than one check",
      keyframe: scene([b(SAGE, 0, 1), b(BLUE, 2, 1)]),
      photo: scene([b(SAGE, 0, 1), b(BLUE, 2, 1)]),
    },
    {
      caption: strings.fixtureTowerStep2,
      visibleState: "Needed more than one check",
      // Silhouette: base bone/steel/bone, middle sage/(gap)/steel,
      // top steel/RED — red is the single accent brick.
      keyframe: scene([
        b(BONE, 0, 2),
        b(BLUE, 1, 2),
        b(BONE, 2, 2),
        b(SAGE, 0, 1),
        b(BLUE, 2, 1),
        b(BLUE, 0, 0),
        b(RED, 1, 0, false, "accent"),
      ]),
      // WRONG: exactly one brick's colour differs — the top-right accent brick
      // is steel here, red in the keyframe (flipped RED → BLUE).
      photo: scene([
        b(BONE, 0, 2),
        b(BLUE, 1, 2),
        b(BONE, 2, 2),
        b(SAGE, 0, 1),
        b(BLUE, 2, 1),
        b(BLUE, 0, 0),
        b(BLUE, 1, 0, false, "accent"),
      ]),
    },
    {
      caption: strings.fixtureTowerStep3,
      visibleState: "Not started",
      keyframe: scene([
        b(BONE, 0, 2),
        b(BLUE, 1, 2),
        b(BONE, 2, 2),
        b(SAGE, 0, 1),
        b(BLUE, 2, 1),
        b(BLUE, 0, 0),
        b(RED, 1, 0, false, "accent"),
      ]),
      photo: scene([
        b(BONE, 0, 2),
        b(BLUE, 1, 2),
        b(BONE, 2, 2),
        b(SAGE, 0, 1),
        b(BLUE, 2, 1),
        b(BLUE, 0, 0),
        b(RED, 1, 0, false, "accent"),
      ]),
    },
  ],
};

/* ------------------------------------------------ */
/* Fixture lesson 2 — a mosaic strip (flat tiles,   */
/* no studs), a two-row pattern whose colours       */
/* progress per step.                               */
/* ------------------------------------------------ */
export const mosaicLesson: FixtureLesson = {
  id: "mosaic",
  title: strings.fixtureMosaicTitle,
  meta: strings.fixtureMosaicMeta,
  date: "Yesterday",
  stepCount: 3,
  steps: [
    {
      caption: strings.fixtureMosaicStep0,
      visibleState: "Done",
      keyframe: scene([b(RED, 0, 1, true), b(RED, 1, 1, true), b(RED, 2, 1, true)]),
      photo: scene([b(RED, 0, 1, true), b(RED, 1, 1, true), b(RED, 2, 1, true)]),
    },
    {
      caption: strings.fixtureMosaicStep1,
      visibleState: "Done",
      keyframe: scene([
        b(RED, 0, 1, true),
        b(RED, 1, 1, true),
        b(RED, 2, 1, true),
        b(BLUE, 0, 0, true),
      ]),
      photo: scene([
        b(RED, 0, 1, true),
        b(RED, 1, 1, true),
        b(RED, 2, 1, true),
        b(BLUE, 0, 0, true),
      ]),
    },
    {
      caption: strings.fixtureMosaicStep2,
      visibleState: "Needed more than one check",
      keyframe: scene([
        b(RED, 0, 1, true),
        b(RED, 1, 1, true),
        b(RED, 2, 1, true),
        b(BLUE, 0, 0, true),
        b(BLUE, 1, 0, true),
        b(BLUE, 2, 0, true),
      ]),
      photo: scene([
        b(RED, 0, 1, true),
        b(RED, 1, 1, true),
        b(RED, 2, 1, true),
        b(BLUE, 0, 0, true),
        b(BLUE, 1, 0, true),
        b(BLUE, 2, 0, true),
      ]),
    },
  ],
};

/* --------------------------------------- */
/* Fixture lesson 3 — a brick wall: two     */
/* staggered rows, bricks added per step.  */
/* --------------------------------------- */
export const wallLesson: FixtureLesson = {
  id: "wall",
  title: strings.fixtureWallTitle,
  meta: strings.fixtureWallMeta,
  date: "3 days ago",
  stepCount: 3,
  steps: [
    {
      caption: strings.fixtureWallStep0,
      visibleState: "Done",
      keyframe: scene([b(RED, 0, 2), b(RED, 1, 2), b(RED, 2, 2)]),
      photo: scene([b(RED, 0, 2), b(RED, 1, 2), b(RED, 2, 2)]),
    },
    {
      caption: strings.fixtureWallStep1,
      visibleState: "Done",
      keyframe: scene([
        b(RED, 0, 2),
        b(RED, 1, 2),
        b(RED, 2, 2),
        b(RED, 0, 1),
        b(RED, 2, 1),
      ]),
      photo: scene([
        b(RED, 0, 2),
        b(RED, 1, 2),
        b(RED, 2, 2),
        b(RED, 0, 1),
        b(RED, 2, 1),
      ]),
    },
    {
      caption: strings.fixtureWallStep2,
      visibleState: "Needed more than one check",
      keyframe: scene([
        b(RED, 0, 2),
        b(RED, 1, 2),
        b(RED, 2, 2),
        b(RED, 0, 1),
        b(RED, 2, 1),
        b(RED, 1, 1),
      ]),
      photo: scene([
        b(RED, 0, 2),
        b(RED, 1, 2),
        b(RED, 2, 2),
        b(RED, 0, 1),
        b(RED, 2, 1),
        b(RED, 1, 1),
      ]),
    },
  ],
};

export const libraryLessons: LibraryLesson[] = [
  {
    id: "sample",
    title: strings.fixtureTowerTitle,
    stepCount: 4,
    meta: strings.fixtureTowerMeta,
    date: "Today",
  },
  {
    id: "mosaic",
    title: strings.fixtureMosaicTitle,
    stepCount: 3,
    meta: strings.fixtureMosaicMeta,
    date: "Yesterday",
  },
  {
    id: "wall",
    title: strings.fixtureWallTitle,
    stepCount: 3,
    meta: strings.fixtureWallMeta,
    date: "3 days ago",
  },
];

export const sessionResult: SessionResult = {
  totalTime: "6 minutes",
  stepsCompleted: "4 of 4",
  neededMoreThanOneCheck: [
    sampleLesson.steps[1].caption,
    sampleLesson.steps[2].caption,
  ],
};

/* ------------------------------------------------------------------ */
/* Professional sample lesson (Task B) — a breadboard build, rendered  */
/* in the KeyframeVisual language. A long board, two power rails,      */
/* jumper wires as long thin pieces in red/black/green, a              */
/* microcontroller block, and small components. Step 2 photo is the    */
/* WRONG state: exactly one wire (the green jumper) sits in the wrong  */
/* rail. Only Professional screens read this sample.                   */
/* ------------------------------------------------------------------ */
const GREEN_WIRE = "#22C55E";
const BLACK_WIRE = "#2B2B2B";

export const proBreadboardLesson: FixtureLesson = {
  id: "breadboard",
  title: strings.proFixtureBreadboardTitle,
  meta: strings.proFixtureBreadboardMeta,
  date: "Today",
  stepCount: 4,
  steps: [
    {
      caption: strings.proFixtureBreadboardStep0,
      visibleState: "Done",
      keyframe: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
      ]),
      photo: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
      ]),
    },
    {
      caption: strings.proFixtureBreadboardStep1,
      visibleState: "Done",
      keyframe: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
        b(BLUE, 1.0, 2.0, false, "mcu"),
      ]),
      photo: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
        b(BLUE, 1.0, 2.0, false, "mcu"),
      ]),
    },
    {
      caption: strings.proFixtureBreadboardStep2,
      visibleState: "Needed more than one check",
      // Correct: both jumpers run between the rails — red upper-left, green mid.
      keyframe: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
        b(BLUE, 1.0, 2.0, false, "mcu"),
        b(RED, 0.4, 0.6, true, "wireRed"),
        b(GREEN_WIRE, 1.0, 1.35, true, "wireGreen"),
      ]),
      // WRONG: exactly one wire differs — the green jumper sits in the TOP
      // rail (wrong rail) instead of between the rails.
      photo: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
        b(BLUE, 1.0, 2.0, false, "mcu"),
        b(RED, 0.4, 0.6, true, "wireRed"),
        b(GREEN_WIRE, 1.0, 0.6, true, "wireGreen"),
      ]),
    },
    {
      caption: strings.proFixtureBreadboardStep3,
      visibleState: "Not started",
      keyframe: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
        b(BLUE, 1.0, 2.0, false, "mcu"),
        b(RED, 0.4, 0.6, true, "wireRed"),
        b(GREEN_WIRE, 1.0, 1.35, true, "wireGreen"),
        b(BLACK_WIRE, 1.9, 0.5, true, "wireBlack"),
        b(BLUE, 2.2, 2.3, true, "comp"),
      ]),
      photo: scene([
        b(BONE, 1.0, 1.0, true, "board"),
        b(BONE, 1.0, 0.3, true, "railTop"),
        b(BONE, 1.0, 1.7, true, "railBot"),
        b(BLUE, 1.0, 2.0, false, "mcu"),
        b(RED, 0.4, 0.6, true, "wireRed"),
        b(GREEN_WIRE, 1.0, 1.35, true, "wireGreen"),
        b(BLACK_WIRE, 1.9, 0.5, true, "wireBlack"),
        b(BLUE, 2.2, 2.3, true, "comp"),
      ]),
    },
  ],
};