"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings2, Crosshair, Zap, Shield, Gauge, Radar, Fuel, Activity, Trash2 } from "lucide-react";
import { translateSlotTypeEs } from "@/lib/utils";
import type { Ship, Component, Hardpoint } from "@/lib/types";

interface HardpointSchematicProps {
  ship: Ship;
  slotAssignments: Record<string, string>;
  componentMap: Map<string, Component>;
  onSlotClick: (hardpoint: Hardpoint) => void;
  onClearSlot: (slotId: string) => void;
}

const SLOT_ICONS: Record<string, typeof Crosshair> = {
  weapon: Crosshair,
  shield: Shield,
  power_plant: Zap,
  cooler: Activity,
  quantum_drive: Gauge,
  radar: Radar,
  thruster: Gauge,
  flight_controller: Gauge,
  missile: Crosshair,
  life_support: Fuel,
};

const SLOT_COLORS: Record<string, string> = {
  weapon: "#ef4444",
  shield: "#10b981",
  power_plant: "#f59e0b",
  cooler: "#06b6d4",
  quantum_drive: "#8b5cf6",
  radar: "#f97316",
  thruster: "#3b82f6",
  flight_controller: "#3b82f6",
  missile: "#ec4899",
  life_support: "#14b8a6",
};

const SIZE_LABELS: Record<number, string> = { 1: "S", 2: "M", 3: "L", 4: "XL", 5: "XXL" };

export default function HardpointSchematic({
  ship,
  slotAssignments,
  componentMap,
  onSlotClick,
  onClearSlot,
}: HardpointSchematicProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, Hardpoint[]> = {};
    ship.hardpoints.forEach((hp) => {
      const key = hp.slot_type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(hp);
    });
    return groups;
  }, [ship.hardpoints]);

  const assignedCount = Object.keys(slotAssignments).filter((k) => slotAssignments[k]).length;

  return (
    <div className="space-y-6">
      {/* Header con métricas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/30">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Esquema de Hardpoints</h3>
            <p className="text-xs text-muted-foreground">
              {assignedCount} de {ship.hardpoints.length} slots equipados
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          {ship.hardpoints.length} slots
        </Badge>
      </div>

      {/* Nave central con hardpoints alrededor */}
      <div className="relative bg-muted/20 rounded-2xl border border-border/30 p-8 min-h-[500px]">
        {/* Silueta central de la nave */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-32 h-32 rounded-full border-2 border-primary/50 flex items-center justify-center">
            <Settings2 className="h-16 w-16 text-primary/50" />
          </div>
        </div>

        {/* Grid de hardpoints agrupados por tipo */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([slotType, hardpoints]) => {
            const Icon = SLOT_ICONS[slotType] || Crosshair;
            const color = SLOT_COLORS[slotType] || "#64748b";

            return (
              <motion.div
                key={slotType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/40 p-4 space-y-3"
                style={{ borderColor: `${color}30` }}
              >
                {/* Header del grupo */}
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {translateSlotTypeEs(slotType)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {hardpoints.length} slot{hardpoints.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono"
                    style={{ borderColor: `${color}60`, color }}
                  >
                    {hardpoints.filter((h) => slotAssignments[h.id]).length}/{hardpoints.length}
                  </Badge>
                </div>

                {/* Slots individuales */}
                <div className="space-y-2">
                  {hardpoints.map((hp, idx) => {
                    const assignedId = slotAssignments[hp.id];
                    const comp = assignedId ? componentMap.get(assignedId) : null;
                    const isEquipped = !!comp;

                    return (
                      <motion.div
                        key={hp.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`
                          relative rounded-lg border p-3 cursor-pointer transition-all duration-200
                          ${isEquipped
                            ? "bg-primary/5 border-primary/30 hover:border-primary/50"
                            : "bg-muted/20 border-border/30 hover:border-primary/30 hover:bg-muted/30"
                          }
                        `}
                        onClick={() => onSlotClick(hp)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Slot name + size badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {hp.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1 py-0"
                                style={{
                                  borderColor: isEquipped ? `${color}60` : undefined,
                                  color: isEquipped ? color : undefined,
                                }}
                              >
                                {SIZE_LABELS[hp.size] || `T${hp.size}`}
                              </Badge>
                            </div>

                            {/* Componente equipado o placeholder */}
                            {comp ? (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-primary truncate">
                                  {comp.name}
                                </p>
                                <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                                  {comp.stats.dps && (
                                    <span className="font-mono text-red-400">
                                      {comp.stats.dps.toFixed(0)} DPS
                                    </span>
                                  )}
                                  {comp.stats.hp && (
                                    <span className="font-mono text-emerald-400">
                                      {comp.stats.hp.toLocaleString()} HP
                                    </span>
                                  )}
                                  {comp.stats.regen_rate && (
                                    <span className="font-mono text-cyan-400">
                                      +{comp.stats.regen_rate}/s
                                    </span>
                                  )}
                                  {comp.stats.travel_speed && (
                                    <span className="font-mono text-violet-400">
                                      {(comp.stats.travel_speed / 1000000).toFixed(1)}G
                                    </span>
                                  )}
                                  {comp.stats.cooling_rate && (
                                    <span className="font-mono text-sky-400">
                                      {comp.stats.cooling_rate} c/s
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-muted-foreground/70 italic">
                                Click para equipar
                              </p>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex items-center gap-1">
                            {isEquipped && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onClearSlot(hp.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Desequipar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center"
                              style={{
                                background: isEquipped ? `${color}20` : "bg-muted/30",
                                border: `1px solid ${isEquipped ? `${color}40` : "border-border/30"}`,
                              }}
                            >
                              <Icon
                                className="h-4 w-4"
                                style={{ color: isEquipped ? color : "#64748b" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Indicador de estado */}
                        {isEquipped && (
                          <motion.div
                            layoutId={`status-${hp.id}`}
                            className="absolute top-2 right-2 h-2 w-2 rounded-full"
                            style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
