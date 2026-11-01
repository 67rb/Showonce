/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoopingWordsProps {
  words: string[];
  className?: string;
}

export function LoopingWords({ words, className }: LoopingWordsProps) {
  const controls = useAnimationControls();
  const wordsRef = useRef<(HTMLLIElement | null)[]>([]);
  const [selectorWidth, setSelectorWidth] = useState(0);
  // 5.12.5 — ghost fix. Steps are measured in exact pixels (the same one-line
  // height for every word), so the strip never rests on a fractional-pixel
  // offset — sub-pixel residue of the exiting word (faint ghost traces at
  // narrow widths) cannot occur. Rotation words, timing and design are unchanged.
  const stepPx = useRef<number>(0);

  // Duplicate the words array to create a seamless infinite loop
  const duplicatedWords = [...words, ...words];
  const totalOriginal = words.length;

  useEffect(() => {
    // Initial width setup
    updateWidth(0);

    let index = 0;
    const interval = setInterval(async () => {
      // Advance one visible word per tick, wrapped modulo the duplicated list
      // so the cycle repeats forever without ever advancing past a mounted
      // word or leaving the selector with nothing to measure.
      index = (index + 1) % duplicatedWords.length;
      updateWidth(index);

      await controls.start({
        y: `-${index * stepPx.current}px`,
        transition: { duration: 1.2, ease: [0.175, 0.885, 0.32, 1.15] },
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [controls, totalOriginal, duplicatedWords.length]);

  const updateWidth = (index: number) => {
    const el = wordsRef.current[index];
    if (el) {
      setSelectorWidth(el.offsetWidth);
    }
    const first = wordsRef.current[0];
    const next = wordsRef.current[1];
    if (first && next) {
      stepPx.current = next.offsetTop - first.offsetTop;
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative h-[2.7em] px-[0.2em] text-[11vw] md:text-[6vw] leading-[0.9] font-bold uppercase whitespace-nowrap overflow-hidden">
        
        {/* List of words */}
        <motion.ul
          className="flex flex-col items-center m-0 p-0 list-none will-change-transform"
          animate={controls}
          initial={{ y: "0%" }}
        >
          {duplicatedWords.map((word, i) => (
            <li
              key={i}
              ref={(el) => {
                wordsRef.current[i] = el;
              }}
              className="text-foreground tracking-tight"
            >
              <p className="m-0">{word}</p>
            </li>
          ))}
        </motion.ul>

        {/* Fade gradients */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage:
              "linear-gradient(180deg, hsl(var(--background)) 5%, transparent 40%, transparent 60%, hsl(var(--background)) 95%)",
          }}
        />

        {/* Selector Edge Boxes */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[0.9em] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          animate={{ width: selectorWidth }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-[0.125em] h-[0.125em] border-t-[0.035em] border-l-[0.035em] border-primarylw" />
          {/* Top Right */}
          <div className="absolute top-0 right-0 w-[0.125em] h-[0.125em] border-t-[0.035em] border-r-[0.035em] border-primarylw" />
          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-[0.125em] h-[0.125em] border-b-[0.035em] border-l-[0.035em] border-primarylw" />
          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-[0.125em] h-[0.125em] border-b-[0.035em] border-r-[0.035em] border-primarylw" />
        </motion.div>
      </div>
    </div>
  );
}
