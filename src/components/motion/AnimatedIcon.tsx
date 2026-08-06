"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface AnimatedIconProps {
  children: ReactNode;
  className?: string;
  /** Delay before the float starts. */
  delay?: number;
}

/**
 * Wraps an icon in a gentle floating (levitate) animation with a soft glow.
 * Used in empty/hero states to add subtle life. Honors prefers-reduced-motion.
 */
export function AnimatedIcon({ children, className, delay = 0 }: AnimatedIconProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      whileHover={reduce ? undefined : { scale: 1.08, rotate: 4 }}
    >
      {children}
    </motion.div>
  );
}
