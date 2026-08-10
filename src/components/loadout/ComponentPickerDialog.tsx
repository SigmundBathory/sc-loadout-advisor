"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Info, Check, ArrowUpDown, ChevronDown, Crown, Zap, Shield, Thermometer, Navigation, GitCompare, ShoppingCart, X } from "lucide-react";
import type { Component, Hardpoint } from "@/lib/types";
import { sortComponentsForSlot, componentStatSummary, type BuildProfile, PROFILE_LABELS } from "@/lib/optimizer/componentSort";
import { componentDetailRows } from "@/lib/optimizer/componentDetail";
import { formatPrice } from "@/lib/presentation";
import ComponentDetailPanel from "./ComponentDetailPanel";

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Military: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  Civilian: { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  Stealth: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  Industrial: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  Competition: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
};
const TIER_ORDER = ["Military", "Stealth", "Competition", "Industrial", "Civilian"];

interface ComponentPickerDialogProps {
  slot: Hardpoint | null;
  components: Component[];
  loading: boolean;
  equippedId?: string | null;
  onSelect: (component: Component) => void;
  onClose: () => void;
}

const SLOT_ICONS: Record<string, React.ReactNode> = {
  Weapon: <Zap className="h-3.5 w-3.5" />,
  Shield: <Shield className="h-3.5 w-3.5" />,
  PowerPlant: <Zap className="h-3.5 w-3.5" />,
  Cooler: <Thermometer className="h-3.5 w-3.5" />,
  QuantumDrive: <Navigation className="h-3.5 w-3.5" />,
  Radar: <Navigation className="h-3.5 w-3.5" />,
  FlightController: <Navigation className="h-3.5 w-3.5" />,
  LifeSupport: <Shield className="h-3.5 w-3.5" />,
};

export default function ComponentPickerDialog({ slot, components, loading, equippedId, onSelect, onClose }: ComponentPickerDialogProps) {
  return (
    <Dialog open={!!slot} onOpenChange={() => onClose()}>
      {slot && (
        <DialogContent key={slot.id} className="bg-popover/98 backdrop-blur-2xl max-w-4xl w-[calc(100vw-2rem)] border-primary/20 p-5 flex flex-col h-[90vh] max-h-[90vh] gap-3 overflow-hidden shadow-2xl shadow-black/40">
          <PickerBody
            slot={slot}
            components={components}
            loading={loading}
            equippedId={equippedId}
            onSelect={onSelect}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function PickerBody({
  slot,
  components,
  loading,
  equippedId,
  onSelect,
}: {
  slot: Hardpoint;
  components: Component[];
  loading: boolean;
  equippedId?: string | null;
  onSelect: (component: Component) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<BuildProfile>("balanced");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const slotType = slot.slot_type.toLowerCase().replace(/[-\s]/g, "_");
  const componentType =
    slotType === "weapon" || slotType === "turret"
      ? "Weapon"
      : slotType === "shield"
      ? "Shield"
      : slotType === "power_plant" || slotType === "powerplant"
      ? "PowerPlant"
      : slotType === "cooler"
      ? "Cooler"
      : slotType === "quantum_drive" || slotType === "quantumdrive"
      ? "QuantumDrive"
      : slotType === "radar"
      ? "Radar"
      : slotType === "flight_controller" || slotType === "flightcontroller"
      ? "FlightController"
      : slotType === "life_support" || slotType === "lifesupport"
      ? "LifeSupport"
      : "";

  const sorted = useMemo(() => {
    let filtered = components.filter(
      (c) =>
        !c.name.toLowerCase().includes("mauler") &&
        !c.class_name.toLowerCase().includes("mauler") &&
        (!search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.manufacturer.name.toLowerCase().includes(search.toLowerCase()))
    );
    if (availableOnly) {
      filtered = filtered.filter((c) => c.buy_locations && c.buy_locations.length > 0);
    }
    if (tierFilter.length > 0) {
      filtered = filtered.filter((c) => c.class && tierFilter.includes(c.class));
    }
    return sortComponentsForSlot(filtered, componentType, equippedId, profile);
  }, [components, componentType, equippedId, search, profile, availableOnly, tierFilter]);

  const equippedComponent = useMemo(
    () => components.find((c) => c.id === equippedId) || null,
    [components, equippedId]
  );

  // Find the "best in slot" component (first in sorted = highest primary stat)
  const bestComponent = sorted.length > 0 ? sorted[0] : null;

  const safeIndex = Math.min(activeIndex, Math.max(0, sorted.length - 1));

  const activeRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && safeIndex >= 0) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    },
    [safeIndex]
  );

  const handleSelect = useCallback(
    (comp: Component) => {
      onSelect(comp);
      setExpandedId(null);
    },
    [onSelect]
  );

  useEffect(() => {
    if (sorted.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % sorted.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + sorted.length) % sorted.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const comp = sorted[safeIndex];
        if (comp) handleSelect(comp);
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (expandedId) {
          setExpandedId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sorted, safeIndex, handleSelect, expandedId]);

  const handleRowClick = (comp: Component) => {
    if (compareMode) {
      setCompareIds((prev) =>
        prev.includes(comp.id) ? prev.filter((id) => id !== comp.id) : prev.length < 3 ? [...prev, comp.id] : prev
      );
      return;
    }
    setExpandedId(expandedId === comp.id ? null : comp.id);
    setActiveIndex(Math.max(0, sorted.findIndex((c) => c.id === comp.id)));
  };

  return (
    <>
      <DialogHeader className="shrink-0">
        <DialogTitle className="text-base flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            {SLOT_ICONS[componentType] || <Zap className="h-3.5 w-3.5" />}
            Seleccionar para {slot.name}
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {slot.max_size > slot.size ? `S${slot.size}–S${slot.max_size}` : `S${slot.size}`}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o fabricante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/40 border-border/40"
          autoFocus
        />
      </div>

      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 shrink-0">
        {(Object.keys(PROFILE_LABELS) as BuildProfile[]).map((p) => (
          <button
            key={p}
            onClick={() => { setProfile(p); setActiveIndex(0); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              profile === p
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{PROFILE_LABELS[p].icon}</span>
            {PROFILE_LABELS[p].label}
          </button>
        ))}
      </div>

      {/* QD-specific sort selector: more explicit dropdown for Quantum Drive */}
      {componentType === "QuantumDrive" && (
        <div className="shrink-0">
          <label className="block text-[10px] font-medium text-muted-foreground mb-1">
            Ordenar QD por:
          </label>
          <select
            value={profile}
            onChange={(e) => { setProfile(e.target.value as BuildProfile); setActiveIndex(0); }}
            className="w-full bg-muted/40 border border-border/40 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="speed">🚀 Velocidad (km/s)</option>
            <option value="range">📏 Alcance (Mkm)</option>
            <option value="power">⚡ Vel + Alcance (balanceado)</option>
            <option value="stealth">🔇 Stealth (baja firma EM)</option>
            <option value="balanced">⚖️ Balanceado</option>
          </select>
        </div>
      )}

      {TIER_ORDER.filter((t) => components.some((c) => c.class === t)).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
          <span className="px-1">Tier:</span>
          {TIER_ORDER.filter((t) => components.some((c) => c.class === t)).map((tier) => {
            const colors = TIER_COLORS[tier] || { bg: "bg-muted/60", text: "text-muted-foreground", border: "border-border/30" };
            const isActive = tierFilter.includes(tier);
            return (
              <button
                key={tier}
                onClick={() => {
                  setTierFilter((prev) => prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier]);
                  setActiveIndex(0);
                }}
                className={`flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  isActive
                    ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm`
                    : "bg-muted/40 hover:bg-muted/60"
                }`}
              >
                {tier}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3 w-3" />
          <span className="font-semibold text-foreground">
            {sorted.length > 0 ? componentStatSummary(sorted[0], profile).primaryLabel : "stat"}
          </span>{" "}
          (mejor primero)
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setAvailableOnly((v) => !v); setActiveIndex(0); }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              availableOnly ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingCart className="h-3 w-3" />
            {availableOnly ? "Solo disponibles" : "Disponibles"}
          </button>
          <button
            onClick={() => { setCompareMode((v) => !v); if (compareMode) setCompareIds([]); }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              compareMode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitCompare className="h-3 w-3" />
            {compareMode ? `Comparar (${compareIds.length})` : "Comparar"}
          </button>
          <span className="font-mono text-muted-foreground/80">
            {sorted.length} resultado{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground space-y-2">
            <div className="h-8 w-8 mx-auto border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm">Buscando componentes compatibles...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground space-y-2">
            <Info className="h-8 w-8 mx-auto opacity-40" />
            <p className="text-sm">No hay componentes que coincidan.</p>
          </div>
        ) : (
          <div ref={listRef} className="space-y-1.5 pr-1">
            {sorted.map((comp, idx) => {
              const summary = componentStatSummary(comp, profile);
              const isExpanded = expandedId === comp.id;
              const isActive = idx === safeIndex;
              const isBest = comp.id === bestComponent?.id && comp.id !== equippedId;
              const isEquipped = comp.id === equippedId;
              const isAvailable = comp.buy_locations && comp.buy_locations.length > 0;

              return (
                <div key={comp.id} className="space-y-1">
                  <div
                    ref={isActive ? activeRef : undefined}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isActive ? "ring-1 ring-primary/60 border-primary/60" : ""
                    } ${
                      isEquipped
                        ? "border-primary/60 bg-primary/5"
                        : isBest
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border/30 hover:border-border/60"
                    }`}
                    onClick={() => handleRowClick(comp)}
                  >
                    <div className="flex items-start gap-2">
                      {compareMode && (
                        <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          compareIds.includes(comp.id) ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}>
                          {compareIds.includes(comp.id) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                      )}
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">{comp.name}</span>
                          {isEquipped && (
                            <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] gap-0.5 px-1 py-0">
                              <Check className="h-2.5 w-2.5" /> Equipado
                            </Badge>
                          )}
                          {isBest && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] gap-0.5 px-1 py-0">
                              <Crown className="h-2.5 w-2.5" /> Mejor
                            </Badge>
                          )}
                          {isAvailable ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] gap-0.5 px-1 py-0">
                              <ShoppingCart className="h-2.5 w-2.5" /> Disponible
                            </Badge>
                          ) : (
                            <Badge className="bg-muted/60 text-muted-foreground border-border/30 text-[9px] gap-0.5 px-1 py-0">
                              <X className="h-2.5 w-2.5" /> No disponible
                            </Badge>
                          )}
                          {comp.class && TIER_COLORS[comp.class] && (
                            <Badge
                              className={`${TIER_COLORS[comp.class].bg} ${TIER_COLORS[comp.class].text} ${TIER_COLORS[comp.class].border} text-[9px] gap-0.5 px-1 py-0`}
                            >
                              {comp.class}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {comp.manufacturer.name || "?"} · {comp.class || "—"} · G{comp.stats.grade ?? "?"} · S{comp.size}
                        </div>
                        <div className="flex flex-wrap gap-x-2.5 gap-y-0 pt-1 text-[10px] font-mono">
                          <span className="text-primary font-semibold">
                            {summary.primaryLabel}: {summary.primaryFormatted}
                          </span>
                          {summary.tradeoffs.slice(0, 2).map((t) => (
                            <span key={t.label} className="text-muted-foreground">
                              {t.label}: <span className="text-foreground/80">{t.format}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/20 pt-2">
                      <div className="min-w-0 flex-1 text-[10px] font-mono text-muted-foreground">
                        {typeof comp.price_auec === "number" && comp.price_auec > 0 ? (
                          <span className="text-amber-300 font-semibold" title="Precio del catálogo">
                            {formatPrice(comp.price_auec)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">Precio no disponible</span>
                        )}
                        {comp.buy_locations && comp.buy_locations.length > 0 && (
                          <span className="ml-2 truncate">
                            · {comp.buy_locations[0].shop_name}
                            {comp.buy_locations[0].planet_moon && ` (${comp.buy_locations[0].planet_moon})`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-lg px-2.5 text-[10px] shadow-sm shadow-primary/20"
                          onClick={(event) => { event.stopPropagation(); handleSelect(comp); }}
                          disabled={isEquipped}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {isEquipped ? "Equipado" : "Equipar"}
                        </Button>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-primary transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-1">
                      <ComponentDetailPanel
                        component={comp}
                        equipped={equippedComponent}
                        onSelect={() => handleSelect(comp)}
                        onClose={() => setExpandedId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {compareMode && compareIds.length >= 2 && (
        <ComparePanel
          components={compareIds.map((id) => sorted.find((c) => c.id === id)!).filter(Boolean)}
          onSelect={(comp) => { handleSelect(comp); setCompareMode(false); setCompareIds([]); }}
        />
      )}
    </>
  );
}

function ComparePanel({
  components,
  onSelect,
}: {
  components: Component[];
  onSelect: (comp: Component) => void;
}) {
  const allRows = useMemo(() => {
    if (components.length === 0) return [];
    const base = componentDetailRows(components[0]);
    return base.map((row) => ({
      label: row.label,
      format: row.format,
      lowerBetter: row.lowerBetter,
      values: components.map((c) => {
        const r = componentDetailRows(c).find((r: { label: string }) => r.label === row.label);
        return r?.format ?? "—";
      }),
      nums: components.map((c) => {
        const r = componentDetailRows(c).find((r: { label: string }) => r.label === row.label);
        return r?.value ?? 0;
      }),
    }));
  }, [components]);

  const COLORS = ["text-primary", "text-cyan-400", "text-amber-400"];

  return (
    <div className="glass-panel border border-primary/30 rounded-xl p-3 space-y-2 shrink-0">
      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
        <GitCompare className="h-3.5 w-3.5" /> Comparacion directa
      </h4>
      <div className="rounded-lg border border-border/30 overflow-hidden">
        <div className={`grid gap-px bg-border/30 text-[10px]`} style={{ gridTemplateColumns: `1fr repeat(${components.length}, 1fr)` }}>
          <div className="bg-muted/40 px-2 py-1 font-semibold text-muted-foreground">Stat</div>
          {components.map((c, i) => (
            <div key={c.id} className="bg-muted/40 px-2 py-1 font-semibold text-center truncate">
              <span className={COLORS[i]}>{c.name}</span>
            </div>
          ))}
          {allRows.map((row: { label: string; format?: string; lowerBetter?: boolean; values: string[]; nums: number[] }) => {
            const maxVal = Math.max(...row.nums);
            const minVal = Math.min(...row.nums.filter((n: number) => n !== 0));
            return (
              <div key={row.label} className="contents">
                <div className="bg-card/40 px-2 py-1 text-foreground/90">{row.label}</div>
                {row.values.map((val: string, i: number) => {
                  const num = row.nums[i];
                  const isBest = row.lowerBetter ? num === minVal && num !== 0 : num === maxVal && num !== 0;
                  const isWorst = row.lowerBetter ? num === maxVal && num !== minVal : num === minVal && num !== maxVal;
                  return (
                    <div key={i} className="bg-card/40 px-2 py-1 font-mono text-center text-foreground">
                      <span className={isBest ? "text-emerald-400 font-bold" : isWorst ? "text-red-400" : ""}>
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        {components.map((c, i) => (
          <Button
            key={c.id}
            size="sm"
            variant={i === 0 ? "default" : "outline"}
            className="flex-1 rounded-xl text-xs h-7"
            onClick={() => onSelect(c)}
          >
            Equipar {c.name.slice(0, 12)}
          </Button>
        ))}
      </div>
    </div>
  );
}
