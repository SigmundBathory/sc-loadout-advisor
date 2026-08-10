"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutList, LayoutGrid, Orbit, Crosshair, Zap, Shield, Gauge, Radar, Fuel, Activity, Trash2, Crown, DollarSign, Rocket } from "lucide-react";
import { translateSlotTypeEs } from "@/lib/utils";
import { sortComponentsForSlot } from "@/lib/optimizer/componentSort";
import { CONFIGURABLE_SLOT_TYPES } from "@/lib/types";
import type { Ship, Component, Hardpoint } from "@/lib/types";

interface HardpointSchematicProps {
  ship: Ship;
  slotAssignments: Record<string, string>;
  componentMap: Map<string, Component>;
  allComponents?: Component[];
  onSlotClick: (hardpoint: Hardpoint) => void;
  onClearSlot: (slotId: string) => void;
  onMoveComponent?: (fromSlotId: string, toSlotId: string) => void;
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

const SIZE_LABELS: Record<number, string> = { 1: "S1", 2: "S2", 3: "S3", 4: "S4", 5: "S5" };

type ViewMode = "orbit" | "list" | "grid";

export default function HardpointSchematic({
  ship,
  slotAssignments,
  componentMap,
  allComponents = [],
  onSlotClick,
  onClearSlot,
  onMoveComponent,
}: HardpointSchematicProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("orbit");
  const [dragSourceSlotId, setDragSourceSlotId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Briefly highlight a slot right after it receives a new component so the
  // action of equipping something reads as a clear, satisfying event instead
  // of a silent state update.
  const prevAssignmentsRef = useRef<Record<string, string>>(slotAssignments);
  const [flashSlots, setFlashSlots] = useState<Set<string>>(new Set());
  useEffect(() => {
    const prev = prevAssignmentsRef.current;
    const changed = Object.keys(slotAssignments).filter(
      (key) => slotAssignments[key] && slotAssignments[key] !== prev[key]
    );
    prevAssignmentsRef.current = slotAssignments;
    if (changed.length === 0) return;
    setFlashSlots(new Set(changed));
    const timer = setTimeout(() => setFlashSlots(new Set()), 900);
    return () => clearTimeout(timer);
  }, [slotAssignments]);

  const assignedCount = Object.keys(slotAssignments).filter((k) => slotAssignments[k]).length;

  // Compute best-in-slot for list view
  const bestPerSlot = useMemo(() => {
    const map = new Map<string, string>();
    for (const hp of ship.hardpoints) {
      const slotType = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
      const compType =
        slotType === "weapon" || slotType === "turret" ? "Weapon"
        : slotType === "shield" ? "Shield"
        : slotType === "power_plant" || slotType === "powerplant" ? "PowerPlant"
        : slotType === "cooler" ? "Cooler"
        : slotType === "quantum_drive" || slotType === "quantumdrive" ? "QuantumDrive"
        : "";
      const compatible = allComponents.filter((c) => {
        const validTypes: Record<string, string[]> = {
          weapon: ["Weapon"], turret: ["Weapon"], shield: ["Shield"],
          power_plant: ["PowerPlant"], powerplant: ["PowerPlant"],
          cooler: ["Cooler"], quantum_drive: ["QuantumDrive"], quantumdrive: ["QuantumDrive"],
        };
        const types = validTypes[slotType] || [];
        return types.some(t => t.toLowerCase() === c.type.toLowerCase()) && c.size <= hp.max_size;
      });
      if (compatible.length > 0) {
        const sorted = sortComponentsForSlot(compatible, compType);
        map.set(hp.id, sorted[0].id);
      }
    }
    return map;
  }, [ship.hardpoints, allComponents]);

  // Grid grouping
  const grouped = useMemo(() => {
    const groups: Record<string, Hardpoint[]> = {};
    ship.hardpoints.forEach((hp) => {
      const key = hp.slot_type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(hp);
    });
    return groups;
  }, [ship.hardpoints]);

  // Radial layout for the orbital view: one node per category, evenly spaced
  // around the hub regardless of how many individual hardpoints it contains
  // (a capital ship with 40 weapon hardpoints still renders a single node).
  const categories = useMemo(() => {
    const keys = Object.keys(grouped);
    const radius = 36;
    return keys.map((key, idx) => {
      const angle = (idx / keys.length) * 2 * Math.PI - Math.PI / 2;
      const hardpoints = grouped[key];
      const assigned = hardpoints.filter((h) => slotAssignments[h.id]).length;
      return {
        key,
        icon: SLOT_ICONS[key] || Crosshair,
        color: SLOT_COLORS[key] || "#64748b",
        total: hardpoints.length,
        assigned,
        isConfigurable: CONFIGURABLE_SLOT_TYPES.has(key.toLowerCase().replace(/[-\s]/g, "_")),
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      };
    });
  }, [grouped, slotAssignments]);

  const handleDragStart = (slotId: string) => {
    setDragSourceSlotId(slotId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (targetSlotId: string) => {
    if (!dragSourceSlotId || dragSourceSlotId === targetSlotId) {
      setDragSourceSlotId(null);
      return;
    }
    onMoveComponent?.(dragSourceSlotId, targetSlotId);
    setDragSourceSlotId(null);
  };

  const handleDragEnd = () => {
    setDragSourceSlotId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header con toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {assignedCount} de {ship.hardpoints.length} slots equipados
          </span>
        </div>
        <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-lg border border-border/30">
          <button
            onClick={() => setViewMode("orbit")}
            title="Vista orbital"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "orbit"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="Vista lista"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Vista tarjetas"
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Vista Orbital */}
      {viewMode === "orbit" && (
        <div className="space-y-3">
          <div className="relative mx-auto aspect-square w-full max-w-[380px]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full pointer-events-none">
              {categories.map((cat) => (
                <line
                  key={`line-${cat.key}`}
                  x1={50}
                  y1={50}
                  x2={cat.x}
                  y2={cat.y}
                  stroke={cat.color}
                  strokeWidth={expandedCategory === cat.key ? 0.7 : 0.3}
                  strokeOpacity={expandedCategory === cat.key ? 0.85 : 0.25}
                  strokeDasharray="1.6 1.6"
                />
              ))}
            </svg>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center h-24 w-24 rounded-full glass-panel border-2 border-primary/40 text-center z-10">
              <Rocket className="h-5 w-5 text-primary mb-0.5" />
              <span className="text-[9px] font-mono text-muted-foreground">
                {assignedCount}/{ship.hardpoints.length}
              </span>
            </div>

            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              const isExpanded = expandedCategory === cat.key;
              const completion = cat.total > 0 ? cat.assigned / cat.total : 0;
              const ringLength = 2 * Math.PI * 17;
              return (
                <motion.button
                  key={cat.key}
                  type="button"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                  className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 group/node"
                  style={{ left: `${cat.x}%`, top: `${cat.y}%` }}
                >
                  <div
                    className="relative flex items-center justify-center h-14 w-14 rounded-full transition-transform group-hover/node:scale-110"
                    style={{
                      background: `color-mix(in oklch, ${cat.color} ${isExpanded ? 22 : 14}%, var(--card))`,
                      border: `2px solid ${isExpanded ? cat.color : `${cat.color}55`}`,
                      boxShadow: isExpanded ? `0 0 22px -4px ${cat.color}` : "none",
                    }}
                  >
                    <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90">
                      <circle cx="20" cy="20" r="17" fill="none" stroke={`${cat.color}25`} strokeWidth="2.5" />
                      <circle
                        cx="20"
                        cy="20"
                        r="17"
                        fill="none"
                        stroke={cat.color}
                        strokeWidth="2.5"
                        strokeDasharray={ringLength}
                        strokeDashoffset={ringLength * (1 - completion)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <Icon className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                  <span className="text-[9px] font-mono font-semibold text-muted-foreground bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-border/30 whitespace-nowrap">
                    {cat.assigned}/{cat.total}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            {expandedCategory
              ? translateSlotTypeEs(expandedCategory)
              : "Selecciona una categor\u00eda para ver y configurar sus slots"}
          </p>

          <AnimatePresence>
            {expandedCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-1 max-h-[320px] overflow-y-auto pr-1">
                  {(grouped[expandedCategory] || []).map((hp) => {
                    const assignedId = slotAssignments[hp.id];
                    const comp = assignedId ? componentMap.get(assignedId) : null;
                    const cat = categories.find((c) => c.key === expandedCategory);
                    const isSlotConfigurable = cat ? cat.isConfigurable : false;
                    const justAssigned = flashSlots.has(hp.id);
                    const color = cat ? cat.color : "#64748b";
                    return (
                      <div
                        key={hp.id}
                        onClick={() => isSlotConfigurable && onSlotClick(hp)}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                          isSlotConfigurable ? "cursor-pointer hover:border-primary/50 glass-panel-hover" : "opacity-70"
                        } ${comp ? "border-primary/25 bg-primary/5" : "border-border/30 bg-muted/20"} ${
                          justAssigned ? "slot-assign-flash" : ""
                        }`}
                        style={justAssigned ? ({ ["--assign-glow"]: color } as React.CSSProperties) : undefined}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 shrink-0" style={{ borderColor: `${color}60`, color }}>
                              {SIZE_LABELS[hp.size] || `T${hp.size}`}
                            </Badge>
                            <span className="text-xs font-semibold text-foreground truncate">{hp.name}</span>
                          </div>
                          <p className="text-[10.5px] text-muted-foreground truncate">
                            {comp
                              ? comp.name
                              : isSlotConfigurable
                                ? "Vac\u00edo \u2014 clic para equipar"
                                : "Componente de serie"}
                          </p>
                        </div>
                        {comp && isSlotConfigurable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClearSlot(hp.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === "list" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {ship.hardpoints.map((hp) => {
            const assignedId = slotAssignments[hp.id];
            const comp = assignedId ? componentMap.get(assignedId) : null;
            const bestId = bestPerSlot.get(hp.id);
            const isBest = assignedId && bestId && assignedId === bestId;
            const color = SLOT_COLORS[hp.slot_type] || "#64748b";
            const slotKey = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
            const isConfigurable = CONFIGURABLE_SLOT_TYPES.has(slotKey);

            const justAssigned = flashSlots.has(hp.id);

            return (
              <div
                key={hp.id}
                className={`glass-panel p-3 rounded-xl border transition-all flex items-center justify-between group ${
                  isConfigurable ? "glass-panel-hover cursor-pointer hover:border-primary/50" : "opacity-70"
                } ${isBest ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/40"} ${
                  justAssigned ? "slot-assign-flash" : ""
                }`}
                style={justAssigned ? ({ ["--assign-glow" as string]: color } as React.CSSProperties) : undefined}
                onClick={() => isConfigurable && onSlotClick(hp)}
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0" style={{ borderColor: `${color}60`, color }}>
                      {SIZE_LABELS[hp.size] || `T${hp.size}`}
                      {hp.max_size && hp.max_size > hp.size && (
                        <span className="ml-1 text-[9px] text-primary/80 font-normal">→{SIZE_LABELS[hp.max_size] || `T${hp.max_size}`}</span>
                      )}
                    </Badge>
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {hp.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold shrink-0">
                      {translateSlotTypeEs(hp.slot_type)}
                    </Badge>
                    {!isConfigurable && (
                      <Badge className="bg-muted/40 text-muted-foreground border-border/30 text-[9px] px-1.5 py-0 shrink-0">
                        De serie
                      </Badge>
                    )}
                    {isBest && (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] gap-0.5 px-1 py-0 shrink-0">
                        <Crown className="h-2.5 w-2.5" /> Mejor
                      </Badge>
                    )}
                  </div>

                  {comp ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5 flex-wrap">
                      <span className="text-primary font-semibold">{comp.name}</span>
                      {comp.stats.dps ? (
                        <span className="text-red-400 font-mono">{comp.stats.dps.toFixed(0)} DPS</span>
                      ) : null}
                      {comp.stats.hp ? (
                        <span className="text-emerald-400 font-mono">{comp.stats.hp.toLocaleString()} HP</span>
                      ) : null}
                      {comp.stats.regen_rate ? (
                        <span className="text-cyan-400 font-mono">+{comp.stats.regen_rate}/s</span>
                      ) : null}
                      {comp.stats.travel_speed ? (
                        <span className="text-violet-400 font-mono">{(comp.stats.travel_speed / 1000000).toFixed(1)}G</span>
                      ) : null}
                      {comp.stats.cooling_rate ? (
                        <span className="text-sky-400 font-mono">{comp.stats.cooling_rate} c/s</span>
                      ) : null}
                      {comp.price_auec ? (
                        <span className="text-amber-400 font-mono flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3" />
                          {comp.price_auec.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/70 italic pt-0.5">
                      {isConfigurable ? "Slot vacío — Click para equipar" : "Componente de serie"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {comp && isConfigurable ? (
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
                  ) : (
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted/20 border border-border/30">
                      {(() => {
                        const SlotIcon = SLOT_ICONS[hp.slot_type] || Crosshair;
                        return <SlotIcon className="h-3.5 w-3.5" style={{ color: "#64748b" }} />;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(grouped).map(([slotType, hardpoints]) => {
            const Icon = SLOT_ICONS[slotType] || Crosshair;
            const color = SLOT_COLORS[slotType] || "#64748b";

            return (
              <motion.div
                key={slotType}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/40 p-3 space-y-2"
                style={{ borderColor: `${color}30` }}
              >
                {/* Header del grupo */}
                <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {translateSlotTypeEs(slotType)}
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
                <div className="space-y-1.5">
                  {hardpoints.map((hp, idx) => {
                    const assignedId = slotAssignments[hp.id];
                    const comp = assignedId ? componentMap.get(assignedId) : null;
                    const isEquipped = !!comp;
                    const hpSlotKey = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
                    const isSlotConfigurable = CONFIGURABLE_SLOT_TYPES.has(hpSlotKey);
                    const justAssigned = flashSlots.has(hp.id);

                    return (
                      <motion.div
                        key={hp.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`
                          relative rounded-lg border p-2.5 transition-all duration-200
                          ${isSlotConfigurable ? "cursor-pointer" : "opacity-70"}
                          ${isEquipped
                            ? "bg-primary/5 border-primary/30 hover:border-primary/50"
                            : "bg-muted/20 border-border/30 hover:border-primary/30 hover:bg-muted/30"
                          }
                          ${dragSourceSlotId === hp.id ? "opacity-60 border-dashed" : ""}
                          ${justAssigned ? "slot-assign-flash" : ""}
                        `}
                        style={justAssigned ? ({ ["--assign-glow" as string]: color } as React.CSSProperties) : undefined}
                        onClick={() => isSlotConfigurable && onSlotClick(hp)}
                        draggable={isEquipped && isSlotConfigurable}
                        onDragStart={() => handleDragStart(hp.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(hp.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-foreground truncate">
                                {hp.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono px-1 py-0 shrink-0"
                                style={{
                                  borderColor: isEquipped ? `${color}60` : undefined,
                                  color: isEquipped ? color : undefined,
                                }}
                              >
                                {SIZE_LABELS[hp.size] || `T${hp.size}`}
                                {hp.max_size && hp.max_size > hp.size && (
                                  <span className="ml-1 text-[8px] text-primary/80 font-normal">→{SIZE_LABELS[hp.max_size] || `T${hp.max_size}`}</span>
                                )}
                              </Badge>
                              {!isSlotConfigurable && (
                                <Badge className="bg-muted/40 text-muted-foreground border-border/30 text-[8px] px-1 py-0 shrink-0">
                                  Serie
                                </Badge>
                              )}
                            </div>

                            {comp ? (
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-medium text-primary truncate">
                                  {comp.name}
                                </p>
                                <div className="flex flex-wrap gap-1 text-[9px] text-muted-foreground">
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

                          <div className="flex items-center gap-1 shrink-0">
                            {isEquipped && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: isEquipped ? `${color}20` : "rgba(100,116,139,0.1)",
                                border: `1px solid ${isEquipped ? `${color}40` : "rgba(100,116,139,0.2)"}`,
                              }}
                            >
                              <Icon
                                className="h-3.5 w-3.5"
                                style={{ color: isEquipped ? color : "#64748b" }}
                              />
                            </div>
                          </div>
                        </div>

                        {isEquipped && (
                          <motion.div
                            layoutId={`status-${hp.id}`}
                            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
                            style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
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
      )}
    </div>
  );
}
