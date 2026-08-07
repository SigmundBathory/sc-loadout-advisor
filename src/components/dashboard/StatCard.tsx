"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion/CountUp";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  /** Tailwind text color class for the value + icon tint, e.g. "text-primary". */
  color?: string;
  /** Optional raw CSS color (design-system token) used for the glow halo. */
  glow?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
  color = "text-primary",
  glow = "var(--sc-brand-primary)",
}: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
      style={{ ["--stat-glow" as string]: glow }}
    >
      {/* soft glow that intensifies on hover */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-300"
        style={{ background: glow }}
      />
      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "p-2.5 rounded-lg bg-muted/40 group-hover:scale-110 transition-transform"
          )}
          style={{ color: glow }}
        >
          {icon}
        </div>
        {subtitle && (
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {subtitle}
          </span>
        )}
      </div>
      <div className="relative mt-4">
        <p className={cn("text-3xl font-bold tracking-tight font-heading", color)}>
          {typeof value === "number" ? <CountUp value={value} /> : value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
