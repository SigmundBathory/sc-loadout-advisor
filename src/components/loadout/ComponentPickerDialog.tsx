"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Wand2, Info, ShoppingBag, Check, ArrowUpDown } from "lucide-react";
import type { Component, Hardpoint } from "@/lib/types";
import { sortComponentsForSlot, componentStatSummary } from "@/lib/optimizer/componentSort";

interface ComponentPickerDialogProps {
  slot: Hardpoint | null;
  components: Component[];
  loading: boolean;
  equippedId?: string | null;
  onSelect: (component: Component) => void;
  onClose: () => void;
}

export default function ComponentPickerDialog({ slot, components, loading, equippedId, onSelect, onClose }: ComponentPickerDialogProps) {
  const [search, setSearch] = useState("");

  // equippedId is the component currently assigned to this slot (from the parent).

  const slotType = slot?.slot_type?.toLowerCase().replace(/[-\s]/g, "_") || "";
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

  return (
    <Dialog open={!!slot} onOpenChange={() => onClose()}>
      <DialogContent className="glass-panel max-w-3xl max-h-[85vh] flex flex-col border-border/40">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <span>Seleccionar Componente para {slot?.name}</span>
            <Badge variant="outline" className="font-mono">S{slot?.size}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o fabricante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40 border-border/40"
          />
        </div>

        {/* Sort hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
          <ArrowUpDown className="h-3 w-3" />
          Ordenado por{" "}
          <span className="font-semibold text-foreground">
            {sorted.length > 0 ? componentStatSummary(sorted[0]).primaryLabel : "stat principal"}
          </span>{" "}
          (mejor primero). El componente equipado va arriba.
        </div>

        <ScrollArea className="flex-1 max-h-[52vh] pr-2">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <Wand2 className="h-8 w-8 mx-auto animate-spin text-primary opacity-60" />
              <p className="text-sm">Buscando componentes compatibles...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <Info className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-sm">No hay componentes que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((comp, idx) => {
                const summary = componentStatSummary(comp);
                return (
                  <div
                    key={comp.id}
                    className={`glass-panel glass-panel-hover p-3 rounded-xl border cursor-pointer transition-all ${
                      comp.id === equippedId
                        ? "border-primary/60 bg-primary/5"
                        : idx === 0
                        ? "border-emerald-500/40"
                        : "border-border/30"
                    }`}
                    onClick={() => onSelect(comp)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground truncate">{comp.name}</span>
                          {comp.id === equippedId && (
                            <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] gap-1">
                              <Check className="h-2.5 w-2.5" /> Equipado
                            </Badge>
                          )}
                          {idx === 0 && comp.id !== equippedId && (
                            <Badge variant="secondary" className="text-[10px]">Mejor en {summary.primaryLabel}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {comp.manufacturer.name || "Desconocido"} • {comp.class || "General"} • Grado {comp.stats.grade ?? "—"}
                        </div>
                        {/* Trade-off stats */}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1.5 text-[11px] font-mono">
                          <span className="text-primary font-semibold">
                            {summary.primaryLabel}: {summary.primaryFormatted}
                          </span>
                          {summary.tradeoffs.map((t) => (
                            <span key={t.label} className="text-muted-foreground">
                              {t.label}: <span className="text-foreground/80">{t.format}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right text-xs font-mono space-y-1 shrink-0">
                        {comp.price_auec ? (
                          <div className="text-amber-300 font-semibold flex items-center gap-1 justify-end">
                            {comp.price_auec.toLocaleString()} aUEC
                            {comp.buy_locations && comp.buy_locations.length > 0 && (
                              <ShoppingBag className="h-3 w-3 opacity-50" />
                            )}
                          </div>
                        ) : null}
                        {comp.buy_locations && comp.buy_locations.length > 0 && (
                          <div className="text-muted-foreground/70 text-[10px] space-y-0.5">
                            {comp.buy_locations.slice(0, 2).map((loc, i) => (
                              <div key={i} className="flex items-center gap-1 justify-end">
                                <span>{loc.shop_name}</span>
                                {loc.planet_moon && <span className="opacity-60">({loc.planet_moon})</span>}
                              </div>
                            ))}
                            {comp.buy_locations.length > 2 && (
                              <div className="text-muted-foreground/50">+{comp.buy_locations.length - 2} más...</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
