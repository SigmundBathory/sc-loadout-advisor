"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  className?: string;
  /** Animation duration in seconds. */
  duration?: number;
  /** Delay before starting. */
  delay?: number;
  /** Formatter applied to the animated value. */
  format?: (v: number) => string;
}

/**
 * Animates a number from 0 to `value` when it becomes visible.
 * Honors prefers-reduced-motion (renders final value instantly).
 */
export function CountUp({
  value,
  className,
  duration = 0.9,
  delay = 0,
  format,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, delay, reduce]);

  const shown = reduce || !inView ? value : display;
  return (
    <span ref={ref} className={className}>
      {format ? format(shown) : Math.round(shown).toLocaleString("es-ES")}
    </span>
  );
}
