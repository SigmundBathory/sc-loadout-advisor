import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

type StatTone = "red" | "emerald" | "amber" | "cyan" | "blue";

const TONE_CLASSES: Record<StatTone, string> = {
  red: "bg-red-500/20 text-red-300 border-red-500/30",
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

interface StatBadgeProps {
  tone: StatTone;
  children: ReactNode;
}

/** Colored badge for stat chips (DPS, HP, output, etc.) with a shared palette. */
export function StatBadge({ tone, children }: StatBadgeProps) {
  return (
    <Badge className={`${TONE_CLASSES[tone]} text-[11px] font-mono`}>
      {children}
    </Badge>
  );
}
