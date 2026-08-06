"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, Loader2, RotateCcw } from "lucide-react";
import type { Ship, Component, Hardpoint, Loadout } from "@/lib/types";
import { calculateLoadoutStats } from "@/lib/optimizer/loadoutStats";
import { optimizeAssignments } from "@/lib/optimizer/optimizeLive";
import { sortComponentsForSlot, componentStatSummary } from "@/lib/optimizer/componentSort";
import { useShipComponents } from "@/lib/api/client";

interface CompareEditorProps {
  ship: Ship;
  initialLoadout: Loadout | null;
  onChange: (assignments: Record<string, string>, loadoutStats: ReturnType<typeof calculateLoadoutStats>) => void;
}

const PRESETS = [
  { name: "fastest", label: "Más Rápida" },
  { name: "max_range", label: "Mayor Alcance" },
  { name: "best_weapons", label: "Mejor Armamento" },
  { name: "best_defense", label: "Mejor Defensa" },
  { name: "cheapest", label: "Más Barata" },
  { name: "stealth", label: "Sigilo" },
  { name: "balanced", label: "Equilibrado" },
];

const SLOT_LABELS: Record<string, string> = {
  weapon: "Armas",
  turret: "Torretas",
  shield: "Escudos",
  power_plant: "Planta de Energía",
  powerplant: "Planta de Energía",
  cooler: "Enfriadores",
  quantum_drive: "Salto Quantum",
  quantumdrive: "Salto Quantum",
  radar: "Radar",
  thruster: "Control de Vuelo",
  flight_controller: "Control de Vuelo",
  life_support: "Soporte Vital",
  lifesupport: "Soporte Vital",
};

export default function CompareEditor({ ship, initialLoadout, onChange }: CompareEditorProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [optimizing, setOptimizing] = useState(false);
  const [preset, setPreset] = useState("balanced");

  const { data: components = [], isLoading: loading } = useShipComponents(ship);
  const componentMap = useMemo(() => new Map(components.map((c) => [c.id, c])), [components]);

  // Apply initial loadout components
  useEffect(() => {
    if (initialLoadout?.components) {
      setAssignments({ ...initialLoadout.components });
    } else {
      setAssignments({});
    }
  }, [initialLoadout]);

  // Notify parent whenever assignments change
  const fullStats = useMemo(
    () => calculateLoadoutStats(ship, assignments, componentMap),
    [ship, assignments, componentMap]
  );

  useEffect(() => {
    onChange(assignments, fullStats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, fullStats]);

  const setSlot = useCallback((slotId: string, compId: string) => {
    setAssignments((prev) => ({ ...prev, [slotId]: compId }));
  }, []);

  const runOptimize = useCallback(() => {
    setOptimizing(true);
    setTimeout(() => {
      const best = optimizeAssignments(ship, components, preset);
      const next: Record<string, string> = {};
      best.forEach((compId, slotId) => { next[slotId] = compId; });
      setAssignments(next);
      setOptimizing(false);
    }, 800);
  }, [ship, components, preset]);

  const reset = useCallback(() => {
    setAssignments({});
  }, []);

  function compsForSlot(hp: Hardpoint): Component[] {
    const slotKey = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
    const validTypes: Record<string, string[]> = {
      weapon: ["Weapon"],
      turret: ["Weapon"],
      shield: ["Shield"],
      power_plant: ["PowerPlant"],
      powerplant: ["PowerPlant"],
      cooler: ["Cooler"],
      quantum_drive: ["QuantumDrive"],
      quantumdrive: ["QuantumDrive"],
      radar: ["Radar"],
      thruster: ["FlightController"],
      flight_controller: ["FlightController"],
      life_support: ["LifeSupport"],
      lifesupport: ["LifeSupport"],
    };
    const types = validTypes[slotKey] || [hp.slot_type];
    const filtered = components.filter((c) => types.some((t) => t.toLowerCase() === c.type.toLowerCase()));
    return sortComponentsForSlot(filtered, filtered[0]?.type || "", assignments[hp.id]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="px-2 py-1 rounded-lg border border-border/40 bg-muted/40 text-foreground text-xs focus:outline-none"
        >
          {PRESETS.map((p) => (
            <option key={p.name} value={p.name} className="bg-card">
              {p.label}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg gap-1.5 text-xs h-8"
          onClick={runOptimize}
          disabled={optimizing || loading}
        >
          {optimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {optimizing ? "Optimizando..." : "Optimizar"}
        </Button>
        <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 text-xs h-8 text-muted-foreground" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Estándar
        </Button>
        {Object.values(assignments).some(Boolean) && (
          <Badge variant="secondary" className="text-[10px]">
            {Object.values(assignments).filter(Boolean).length}/{ship.hardpoints.length} slots
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Cargando componentes...
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {ship.hardpoints.map((hp) => {
            const options = compsForSlot(hp);
            const currentId = assignments[hp.id];
            const current = currentId ? componentMap.get(currentId) : null;
            const label = SLOT_LABELS[hp.slot_type.toLowerCase().replace(/[-\s]/g, "_")] || hp.name || hp.slot_type;
            return (
              <div key={hp.id} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0 truncate text-muted-foreground" title={label}>
                  {label}
                </span>
                <select
                  value={currentId || ""}
                  onChange={(e) => setSlot(hp.id, e.target.value)}
                  disabled={options.length === 0}
                  className="flex-1 min-w-0 px-2 py-1 rounded-md border border-border/40 bg-muted/40 text-foreground text-xs focus:outline-none"
                >
                  <option value="">Sin asignar</option>
                  {options.map((c) => {
                    const summary = componentStatSummary(c);
                    return (
                      <option key={c.id} value={c.id} className="bg-card">
                        {c.name} — {summary.primaryLabel}: {summary.primaryFormatted}
                        {summary.tradeoffs.length > 0
                          ? ` (${summary.tradeoffs.map((t) => `${t.label} ${t.format}`).join(", ")})`
                          : ""}
                      </option>
                    );
                  })}
                </select>
                <span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  {current ? `${(current.price_auec || 0).toLocaleString()} aUEC` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
