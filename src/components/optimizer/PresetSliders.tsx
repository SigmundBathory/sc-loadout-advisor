"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crosshair, Shield, Target, Zap, DollarSign, SlidersHorizontal } from "lucide-react";

export const PRESETS = [
  { name: "balanced", label: "Equilibrado", weights: { dps: 20, defense: 20, speed: 20, range: 20, cost: 20 } },
  { name: "best_weapons", label: "Máximo DPS", weights: { dps: 60, defense: 15, speed: 10, range: 5, cost: 10 } },
  { name: "best_defense", label: "Máxima Defensa", weights: { dps: 15, defense: 60, speed: 10, range: 5, cost: 10 } },
  { name: "max_range", label: "Viajes Quantum", weights: { dps: 5, defense: 10, speed: 45, range: 30, cost: 10 } },
  { name: "fastest", label: "Máxima Velocidad", weights: { dps: 10, defense: 10, speed: 65, range: 5, cost: 10 } },
  { name: "cheapest", label: "Más Económica", weights: { dps: 10, defense: 10, speed: 10, range: 10, cost: 60 } },
];

interface PresetSlidersProps {
  weights: { dps: number; defense: number; speed: number; range: number; cost: number };
  activePreset: string;
  onPresetChange: (preset: string) => void;
  onWeightsChange: (weights: { dps: number; defense: number; speed: number; range: number; cost: number }) => void;
}

export default function PresetSliders({ weights, activePreset, onPresetChange, onWeightsChange }: PresetSlidersProps) {
  return (
    <Card className="glass-panel border-border/40">
      <CardHeader className="p-4 border-b border-border/30 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-purple-400" />
          2. Prioridades de Optimización
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/30">
          {PRESETS.map((p) => (
            <Button
              key={p.name}
              variant={activePreset === p.name ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onPresetChange(p.name);
                onWeightsChange(p.weights);
              }}
              className="text-[11px] h-7 px-2.5 rounded-lg gap-1.5"
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3 pt-1">
          <SliderRow icon={<Crosshair className="h-3.5 w-3.5" />} label="Armamento & DPS" color="text-red-400" accent="accent-red-500" value={weights.dps} onChange={(v) => onWeightsChange({ ...weights, dps: v })} />
          <SliderRow icon={<Shield className="h-3.5 w-3.5" />} label="Escudos & Defensa" color="text-emerald-400" accent="accent-emerald-500" value={weights.defense} onChange={(v) => onWeightsChange({ ...weights, defense: v })} />
          <SliderRow icon={<Target className="h-3.5 w-3.5" />} label="Viajes Quantum" color="text-cyan-400" accent="accent-cyan-500" value={weights.speed} onChange={(v) => onWeightsChange({ ...weights, speed: v })} />
          <SliderRow icon={<Zap className="h-3.5 w-3.5" />} label="Energía & Enfriamiento" color="text-amber-400" accent="accent-amber-500" value={weights.range} onChange={(v) => onWeightsChange({ ...weights, range: v })} />
          <SliderRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Bajo Coste" color="text-amber-300" accent="accent-amber-400" value={weights.cost} onChange={(v) => onWeightsChange({ ...weights, cost: v })} />
        </div>
      </CardContent>
    </Card>
  );
}

function SliderRow({ icon, label, color, accent, value, onChange }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  accent: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className={color} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {icon} {label}
        </span>
        <span className="font-mono text-muted-foreground">{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer ${accent}`}
      />
    </div>
  );
}
