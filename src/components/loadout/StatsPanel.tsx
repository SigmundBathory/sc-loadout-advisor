"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap } from "lucide-react";

interface StatsPanelProps {
  stats: {
    totalDps: number;
    shieldHp: number;
    shieldRegen: number;
    powerOutput: number;
    coolingRate: number;
    quantumSpeed: number;
    totalCost: number;
    emissionEm: number;
  };
  assignedCount: number;
  totalSlots: number;
  baseline?: {
    totalDps: number;
    shieldHp: number;
    shieldRegen: number;
    powerOutput: number;
    coolingRate: number;
    quantumSpeed: number;
    totalCost: number;
    emissionEm: number;
  };
}

export default function StatsPanel({ stats, assignedCount, totalSlots, baseline }: StatsPanelProps) {
  return (
    <Card className="glass-panel border-border/40">
      <CardHeader className="p-4 border-b border-border/30 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Métricas del Loadout
        </CardTitle>
        <Badge variant="secondary" className="font-mono text-xs">
          {assignedCount}/{totalSlots} Slots
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <StatBar label="DPS Potencial Armas" value={stats.totalDps} max={25000} unit="DPS" color="from-red-500 to-amber-500" baseline={baseline?.totalDps} />
        <StatBar label="HP Total Escudos" value={stats.shieldHp} max={120000} unit="HP" color="from-emerald-500 to-teal-400" baseline={baseline?.shieldHp} />
        <StatBar label="Regen Escudos" value={stats.shieldRegen} max={25000} unit="/s" color="from-cyan-500 to-blue-400" baseline={baseline?.shieldRegen} />
        <StatBar label="Salida Energía" value={stats.powerOutput} max={30} unit="W" color="from-amber-500 to-yellow-400" baseline={baseline?.powerOutput} />
        <StatBar label="Enfriamiento" value={stats.coolingRate} max={150} unit="c/s" color="from-sky-500 to-cyan-400" baseline={baseline?.coolingRate} />
        {stats.quantumSpeed > 0 && (
          <StatBar label="Velocidad Quantum" value={stats.quantumSpeed / 1000000} max={300} unit="G km/s" color="from-violet-500 to-purple-400" baseline={baseline ? baseline.quantumSpeed / 1000000 : undefined} />
        )}
        <Separator className="my-2 bg-border/40" />
        <div className="flex justify-between items-center text-sm font-semibold pt-1">
          <span>Coste Estimado</span>
          <span className="flex items-center gap-2">
            <DeltaBadge current={stats.totalCost} baseline={baseline?.totalCost} invert />
            <span className="font-mono text-amber-400 text-base">{stats.totalCost.toLocaleString()} aUEC</span>
          </span>
        </div>
        {stats.emissionEm > 0 && (
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Firma EM</span>
            <span className="flex items-center gap-2">
              <DeltaBadge current={stats.emissionEm} baseline={baseline?.emissionEm} invert />
              <span className="font-mono text-orange-400">{stats.emissionEm.toLocaleString()}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBar({ label, value, max, unit, color, baseline }: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  baseline?: number;
}) {
  const textColors: Record<string, string> = {
    "from-red-500 to-amber-500": "text-red-400",
    "from-emerald-500 to-teal-400": "text-emerald-400",
    "from-cyan-500 to-blue-400": "text-cyan-400",
    "from-amber-500 to-yellow-400": "text-amber-400",
    "from-sky-500 to-cyan-400": "text-sky-400",
    "from-violet-500 to-purple-400": "text-violet-400",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium items-center">
        <span className="text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          <DeltaBadge current={value} baseline={baseline} />
          <span className={`font-mono font-bold ${textColors[color] || "text-primary"}`}>
            {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value.toLocaleString()} {unit}
          </span>
        </span>
      </div>
      <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function DeltaBadge({ current, baseline, invert }: { current?: number; baseline?: number; invert?: boolean }) {
  if (baseline === undefined || current === undefined) return null;
  const diff = Math.round(current - baseline);
  if (diff === 0) return null;
  const isPositive = diff > 0;
  // For cost/emissions, a lower value is better, so invert the color meaning
  const good = invert ? !isPositive : isPositive;
  return (
    <span
      className={`font-mono text-[10px] px-1 py-0.5 rounded ${
        good ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {diff.toLocaleString()}
    </span>
  );
}
