"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Info, Check, ArrowUpDown, ChevronDown, Crown, Zap, Shield, Gauge, Thermometer, Navigation } from "lucide-react";
import type { Component, Hardpoint } from "@/lib/types";
import { sortComponentsForSlot, componentStatSummary } from "@/lib/optimizer/componentSort";
import ComponentDetailPanel from "./ComponentDetailPanel";

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
  Radar: <Gauge className="h-3.5 w-3.5" />,
  FlightController: <Gauge className="h-3.5 w-3.5" />,
};

export default function ComponentPickerDialog({ slot, components, loading, equippedId, onSelect, onClose }: ComponentPickerDialogProps) {
  return (
    <Dialog open={!!slot} onOpenChange={() => onClose()}>
      {slot && (
        <DialogContent key={slot.id} className="glass-panel max-w-2xl border-border/40 flex flex-col max-h-[85vh]">
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
  const listRef = useRef<HTMLDivElement>(null);

  const slotType = slot.slot_type.toLowerCase().replace(/[-\s]/g, "_");
  const componentType =
    slotType === "weapon" || slotType === "turret" || slotType === "missile"
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
      : slotType === "thruster" || slotType === "flight_controller"
      ? "FlightController"
      : slotType === "life_support" || slotType === "lifesupport"
      ? "LifeSupport"
      : "";

  const sorted = useMemo(() => {
    const filtered = components.filter(
      (c) =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.manufacturer.name.toLowerCase().includes(search.toLowerCase())
    );
    return sortComponentsForSlot(filtered, componentType, equippedId);
  }, [components, componentType, equippedId, search]);

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
          <Badge variant="outline" className="font-mono text-[10px]">S{slot.size}</Badge>
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

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3 w-3" />
          <span className="font-semibold text-foreground">
            {sorted.length > 0 ? componentStatSummary(sorted[0]).primaryLabel : "stat"}
          </span>{" "}
          (mejor primero)
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-muted-foreground/80">
            {sorted.length} resultado{sorted.length !== 1 ? "s" : ""}
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-muted/60 border border-border/40 px-1.5 py-0.5 text-[10px] font-mono">
            ↑↓ Enter
          </kbd>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1" style={{ maxHeight: "calc(85vh - 200px)" }}>
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
              const summary = componentStatSummary(comp);
              const isExpanded = expandedId === comp.id;
              const isActive = idx === safeIndex;
              const isBest = comp.id === bestComponent?.id && comp.id !== equippedId;
              const isEquipped = comp.id === equippedId;

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
                    <div className="flex items-start justify-between gap-2">
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

                      <div className="text-right text-[11px] font-mono space-y-0.5 shrink-0">
                        {comp.price_auec ? (
                          <div className="text-amber-300 font-semibold">
                            {comp.price_auec.toLocaleString()} aUEC
                          </div>
                        ) : null}
                        {comp.buy_locations && comp.buy_locations.length > 0 && (
                          <div className="text-muted-foreground/70 text-[9px]">
                            <span>{comp.buy_locations[0].shop_name}</span>
                            {comp.buy_locations[0].planet_moon && (
                              <span className="opacity-60"> ({comp.buy_locations[0].planet_moon})</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-0.5 justify-end text-[9px] text-primary">
                          <ChevronDown
                            className={`h-3 w-3 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
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
    </>
  );
}
