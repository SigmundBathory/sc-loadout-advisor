"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Zap } from "lucide-react";

interface StatsPanelProps {
  stats: {
    totalDps: number;
    shieldHp: number;
    powerOutput: number;
    totalCost: number;
  };
  assignedCount: number;
  totalSlots: number;
}

export default function StatsPanel({ stats, assignedCount, totalSlots }: StatsPanelProps) {
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
        <StatBar label="DPS Potencial Armas" value={stats.totalDps} max={4000} unit="DPS" color="from-red-500 to-amber-500" />
        <StatBar label="HP Total Escudos" value={stats.shieldHp} max={30000} unit="HP" color="from-emerald-500 to-teal-400" />
        <StatBar label="Salida Energía" value={stats.powerOutput} max={20000} unit="W" color="from-amber-500 to-yellow-400" />
        <Separator className="my-2 bg-border/40" />
        <div className="flex justify-between items-center text-sm font-semibold pt-1">
          <span>Coste Estimado</span>
          <span className="font-mono text-amber-400 text-base">{stats.totalCost.toLocaleString()} aUEC</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBar({ label, value, max, unit, color }: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const textColors: Record<string, string> = {
    "from-red-500 to-amber-500": "text-red-400",
    "from-emerald-500 to-teal-400": "text-emerald-400",
    "from-amber-500 to-yellow-400": "text-amber-400",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-bold ${textColors[color] || "text-primary"}`}>
          {value.toLocaleString()} {unit}
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
