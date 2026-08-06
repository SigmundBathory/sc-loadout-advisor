"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, DollarSign, ShoppingBag, Check } from "lucide-react";
import type { Component } from "@/lib/types";
import { componentDetailRows } from "@/lib/optimizer/componentDetail";

interface ComponentDetailPanelProps {
  component: Component;
  equipped?: Component | null;
  onSelect: () => void;
  onClose: () => void;
}

export default function ComponentDetailPanel({
  component,
  equipped,
  onSelect,
  onClose,
}: ComponentDetailPanelProps) {
  const rows = componentDetailRows(component);
  const isEquipped = equipped?.id === component.id;

  return (
    <div className="glass-panel border border-border/40 rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-foreground">{component.name}</h4>
            {isEquipped && (
              <Badge className="bg-primary/20 text-primary border-primary/40 text-[10px] gap-1">
                <Check className="h-2.5 w-2.5" /> Equipado
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {component.manufacturer.name || "Desconocido"} • {component.class || "General"} • Grado{" "}
            {component.stats.grade ?? "—"} • Tamaño {component.size}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {component.price_auec ? (
            <span className="text-amber-300 font-mono font-bold text-sm flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {component.price_auec.toLocaleString()}
            </span>
          ) : null}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats table with deltas */}
      <div className="rounded-lg border border-border/30 overflow-hidden">
        <div className="grid grid-cols-3 gap-px bg-border/30 text-[11px]">
          <div className="bg-muted/40 px-2.5 py-1.5 font-semibold text-muted-foreground">Stat</div>
          <div className="bg-muted/40 px-2.5 py-1.5 font-semibold text-muted-foreground text-right">Este</div>
          <div className="bg-muted/40 px-2.5 py-1.5 font-semibold text-muted-foreground text-right">Actual</div>
          {rows.map((row) => {
            const eqRow = equipped ? componentDetailRows(equipped).find((r) => r.label === row.label) : null;
            const diff = eqRow && eqRow.value !== 0 ? row.value - eqRow.value : 0;
            const hasDiff = equipped && eqRow && row.value !== eqRow.value;
            const good = hasDiff ? (row.lowerBetter ? diff < 0 : diff > 0) : null;
            return (
              <div key={row.label} className="contents">
                <div className="bg-card/40 px-2.5 py-1.5 text-foreground/90">{row.label}</div>
                <div className="bg-card/40 px-2.5 py-1.5 font-mono text-right text-foreground">{row.format ?? "—"}</div>
                <div className="bg-card/40 px-2.5 py-1.5 font-mono text-right text-muted-foreground">
                  {eqRow ? (
                    <span className="flex items-center justify-end gap-1">
                      <span>{eqRow.format ?? "—"}</span>
                      {hasDiff && (
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                            good ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff.toLocaleString("es-ES", { maximumFractionDigits: 1 })}
                        </span>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buy locations */}
      {component.buy_locations && component.buy_locations.length > 0 ? (
        <div className="space-y-1.5">
          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="h-3 w-3" />
            Puntos de venta
          </h5>
          <ScrollArea className="max-h-36">
            <div className="space-y-1.5">
              {component.buy_locations.map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border border-border/20"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      <span className="font-semibold">{loc.shop_name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        • {loc.location_name}
                        {loc.planet_moon ? ` (${loc.planet_moon})` : ""}
                      </span>
                    </span>
                  </div>
                  <span className="text-amber-300 font-mono font-semibold shrink-0">
                    {loc.price ? `${loc.price.toLocaleString()} aUEC` : ""}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted-foreground">
          {equipped && !isEquipped
            ? `Reemplazará a ${equipped.name}`
            : "Componente compatible con este slot."}
        </span>
        <Button
          size="sm"
          className="rounded-xl gap-1.5 text-xs"
          onClick={onSelect}
          disabled={isEquipped}
        >
          <Check className="h-3.5 w-3.5" />
          {isEquipped ? "Equipado" : "Equipar"}
        </Button>
      </div>
    </div>
  );
}
