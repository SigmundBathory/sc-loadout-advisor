"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OptimizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimize: (preset: string) => void;
  optimizing: boolean;
}

export default function OptimizerDialog({ open, onOpenChange, onOptimize, optimizing }: OptimizerDialogProps) {
  const presets = [
    { preset: "fastest", label: "Más Rápida", icon: "⚡" },
    { preset: "max_range", label: "Mayor Alcance Quantum", icon: "🌌" },
    { preset: "best_weapons", label: "Mejor Armamento", icon: "🔫" },
    { preset: "best_defense", label: "Mejor Defensa", icon: "🛡️" },
    { preset: "cheapest", label: "Más Económica", icon: "💰" },
    { preset: "balanced", label: "Equilibrado", icon: "⚖️" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-md border-border/40">
        <DialogHeader>
          <DialogTitle>Optimizar Loadout Automáticamente</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {presets.map(({ preset, label, icon }) => (
            <Button
              key={preset}
              variant="outline"
              className="w-full justify-start rounded-xl gap-3 text-xs font-medium"
              onClick={() => {
                onOptimize(preset);
                onOpenChange(false);
              }}
              disabled={optimizing}
            >
              <span>{icon}</span>
              {label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
