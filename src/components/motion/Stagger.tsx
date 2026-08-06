"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { Variants } from "motion/react";

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child's reveal, in seconds. */
  stagger?: number;
}

export function Stagger({ children, className, stagger = 0.06 }: StaggerProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "show"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: false, amount: 0, margin: "0px 0px 200px 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const itemVariants: Variants | undefined = reduce
    ? undefined
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        },
      };

  return (
    <motion.div
      className={className}
      variants={itemVariants}
    >
      {children}
    </motion.div>
  );
}
