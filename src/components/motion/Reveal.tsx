"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds before the reveal starts (for stagger). */
  delay?: number;
  /** Offset direction. */
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "li";
}

/**
 * Fades + slides content in when it enters the viewport (or on mount).
 * Honors prefers-reduced-motion and only runs once by default.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  once = true,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.1 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </Tag>
  );
}
