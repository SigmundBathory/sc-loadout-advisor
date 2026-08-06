"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion/CountUp";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export default function StatCard({ icon, label, value, subtitle, color = "text-primary" }: StatCardProps) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={cn("p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform")}>
          {icon}
        </div>
        {subtitle && (
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {subtitle}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={cn("text-3xl font-bold tracking-tight", color)}>
          {typeof value === "number" ? <CountUp value={value} /> : value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
