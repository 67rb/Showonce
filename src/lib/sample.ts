/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
/**
 * 5.1.4/5.1.5 — the free Origami example ("Fold a paper cup", 7 steps) ships a
 * saved reference visual for EVERY step as a committed static asset. These are
 * never generated at view time and are not AI-allowance gated. The visuals live
 * under public/samples/origami/ and render in the learner's target area.
 */
export type SampleStep = {
  id: string;
  title: string;
  instructions: string;
  target: string;
  criterion: string;
  visual: string; // resolved /samples/origami/step-N.svg
  photoAssessable: boolean;
};

export const origamiSample: {
  id: string;
  title: string;
  category: string;
  materials: string[];
  steps: SampleStep[];
} = {
  id: "origami-cup",
  title: "Fold a paper cup",
  category: "Origami · Free example",
  materials: ["One square sheet of paper", "A flat work surface"],
  steps: [
    {
      id: "oc-1",
      title: "Square, corner up",
      instructions:
        "Start with the square paper diamond-style: one corner pointing toward you, one corner pointing away.",
      target:
        "A square sheet angled like a diamond, one corner facing down toward you.",
      criterion: "The paper sits as a diamond, not a square on a flat edge.",
      visual: "/samples/origami/step-1.svg",
      photoAssessable: true,
    },
    {
      id: "oc-2",
      title: "Fold in half into a triangle",
      instructions:
        "Bring the bottom corner up to the top corner and crease the fold hard.",
      target:
        "A triangle with a crisp horizontal crease on its base.",
      criterion: "The two matching corners meet exactly and the crease is firm.",
      visual: "/samples/origami/step-2.svg",
      photoAssessable: true,
    },
    {
      id: "oc-3",
      title: "Crease the centre line",
      instructions:
        "Fold the triangle in half and unfold it, leaving a crease down the middle.",
      target:
        "A triangle marked with a vertical crease down its centre.",
      criterion: "The crease runs corner to base, splitting the triangle evenly.",
      visual: "/samples/origami/step-3.svg",
      photoAssessable: true,
    },
    {
      id: "oc-4",
      title: "Fold the top flap down",
      instructions:
        "Fold the top-left flap down so its tip rests on the centre fold line, then crease.",
      target:
        "One small triangular flap folded down toward the centre crease.",
      criterion: "The flap's tip touches the centre line symmetrically.",
      visual: "/samples/origami/step-4.svg",
      photoAssessable: true,
    },
    {
      id: "oc-5",
      title: "Mirror the right flap",
      instructions:
        "Fold the top-right flap down to meet the left one, and crease.",
      target:
        "Both top flaps folded down, their tips meeting on the centre line.",
      criterion: "The two flaps meet evenly; the form stays symmetric.",
      visual: "/samples/origami/step-5.svg",
      photoAssessable: true,
    },
    {
      id: "oc-6",
      title: "Fold the top point down",
      instructions:
        "Fold the remaining top point down over the flaps and crease it flat.",
      target:
        "The top point folded down, tucking over the two flaps.",
      criterion: "The point creases cleanly and stays folded flat.",
      visual: "/samples/origami/step-6.svg",
      photoAssessable: true,
    },
    {
      id: "oc-7",
      title: "Open the pocket",
      instructions:
        "Gently lift the inner layers apart and open the small pocket. Stand the cup base-flat.",
      target:
        "A standing paper cup with an open pocket and a flat base.",
      criterion: "The cup opens evenly and stands on its own.",
      visual: "/samples/origami/step-7.svg",
      photoAssessable: true,
    },
  ],
};

export function sampleStep(stepId: string) {
  return origamiSample.steps.find((s) => s.id === stepId) || null;
}