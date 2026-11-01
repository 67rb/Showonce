/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
/**
 * 5.1c (C3) — the playable Professional sample lesson: "Identify plumbing
 * components" (Plumbing foundations, lesson 1, 3 steps). Each step carries a
 * committed reference visual (public/samples/plumbing/step-N.svg) drawn as a
 * simple line diagram. Content is disconnected/paper training only — identify
 * the components on paper, no live-work instructions.
 */
export type ProSampleStep = {
  id: string;
  position: number;
  title: string;
  instructions: string;
  target: string;
  criterion: string;
  visual: string;
};

export const proSampleLesson: {
  id: string;
  trade: string;
  courseTitle: string;
  lessonTitle: string;
  category: string;
  steps: ProSampleStep[];
} = {
  id: "plumbing-components",
  trade: "Plumbing",
  courseTitle: "Plumbing foundations",
  lessonTitle: "Identify plumbing components",
  category: "Plumbing · Professional example",
  steps: [
    {
      id: "pc-1",
      position: 1,
      title: "Name the drain pipe",
      instructions:
        "Look at the study sheet and point to the vertical drain pipe. Say its name out loud.",
      target:
        "A labelled line diagram showing the vertical drain pipe running from the fixture downward.",
      criterion: "You can name the drain pipe and say what it carries.",
      visual: "/samples/plumbing/step-1.svg",
    },
    {
      id: "pc-2",
      position: 2,
      title: "Name the shut-off valve",
      instructions:
        "Find the shut-off valve on the supply line in the diagram and name it.",
      target:
        "A line diagram showing the supply line with a shut-off valve marked along it.",
      criterion: "You can point to the shut-off valve and say its job.",
      visual: "/samples/plumbing/step-2.svg",
    },
    {
      id: "pc-3",
      position: 3,
      title: "Name the trap",
      instructions:
        "Find the curved trap under the fixture in the diagram and name it.",
      target:
        "A line diagram showing the curved P-trap under the fixture drain.",
      criterion: "You can name the trap and say why it is there.",
      visual: "/samples/plumbing/step-3.svg",
    },
  ],
};

export function proSampleStep(stepId: string) {
  return proSampleLesson.steps.find((s) => s.id === stepId) || null;
}