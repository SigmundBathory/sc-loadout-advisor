"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, DollarSign, ShoppingBag, Check, Shield, Zap, Gauge, Thermometer, Navigation } from "lucide-react";
import type { Component } from "@/lib/types";
import { componentDetailRows } from "@/lib/optimizer/componentDetail";

interface ComponentDetailPanelProps {
  component: Component;
  equipped?: Component | null;
  onSelect: () => void;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Weapon: <Zap className="h-3 w-3" />,
  Shield: <Shield className="h-3 w-3" />,
  PowerPlant: <Zap className="h-3 w-3" />,
  Cooler: <Thermometer className="h-3 w-3" />,
  QuantumDrive: <Navigation className="h-3 w-3" />,
  Radar: <Gauge className="h-3 w-3" />,
  FlightController: <Gauge className="h-3 w-3" />,
};

export default function ComponentDetailPanel({
  component,
  equipped,
  onSelect,
  onClose,
}: ComponentDetailPanelProps) {
  const rows = componentDetailRows(component);
  const isEquipped = equipped?.id === component.id;

  return (
    <div className="glass-panel border border-border/40 rounded-xl p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {TYPE_ICONS[component.type]}
            <h4 className="font-bold text-sm text-foreground truncate">{component.name}</h4>
            {isEquipped && (
              <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] gap-0.5 px-1 py-0">
                <Check className="h-2.5 w-2.5" /> Equipado
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {component.manufacturer.name || "?"} · {component.class || "—"} · G{component.stats.grade ?? "?"} · T{component.size}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {component.price_auec ? (
            <span className="text-amber-300 font-mono font-bold text-xs flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {component.price_auec.toLocaleString()}
            </span>
          ) : null}
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-lg" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border/30 overflow-hidden">
        <div className="grid grid-cols-3 gap-px bg-border/30 text-[10px]">
          <div className="bg-muted/40 px-2 py-1 font-semibold text-muted-foreground">Stat</div>
          <div className="bg-muted/40 px-2 py-1 font-semibold text-muted-foreground text-right">Este</div>
          <div className="bg-muted/40 px-2 py-1 font-semibold text-muted-foreground text-right">Actual</div>
          {rows.map((row) => {
            const eqRow = equipped ? componentDetailRows(equipped).find((r) => r.label === row.label) : null;
            const diff = eqRow && eqRow.value !== 0 ? row.value - eqRow.value : 0;
            const hasDiff = equipped && eqRow && row.value !== eqRow.value;
            const good = hasDiff ? (row.lowerBetter ? diff < 0 : diff > 0) : null;
            return (
              <div key={row.label} className="contents">
                <div className="bg-card/40 px-2 py-1 text-foreground/90">{row.label}</div>
                <div className="bg-card/40 px-2 py-1 font-mono text-right text-foreground">{row.format ?? "—"}</div>
                <div className="bg-card/40 px-2 py-1 font-mono text-right text-muted-foreground">
                  {eqRow ? (
                    <span className="flex items-center justify-end gap-0.5">
                      <span>{eqRow.format ?? "—"}</span>
                      {hasDiff && (
                        <span
                          className={`text-[8px] px-0.5 py-0.5 rounded font-bold ${
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

      {component.buy_locations && component.buy_locations.length > 0 ? (
        <div className="space-y-1">
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" />
            Puntos de venta ({component.buy_locations.length})
          </h5>
          <ScrollArea className="max-h-24">
            <div className="space-y-1">
              {component.buy_locations.slice(0, 6).map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-muted/30 border border-border/20"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="h-2.5 w-2.5 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      <span className="font-semibold">{loc.shop_name}</span>
                      <span className="text-muted-foreground">
                        {" "}· {loc.location_name}
                        {loc.planet_moon ? ` (${loc.planet_moon})` : ""}
                      </span>
                    </span>
                  </div>
                  <span className="text-amber-300 font-mono font-semibold shrink-0">
                    {loc.price ? `${loc.price.toLocaleString()}` : ""}
                  </span>
                </div>
              ))}
              {component.buy_locations.length > 6 && (
                <div className="text-[10px] text-muted-foreground text-center py-0.5">
                  +{component.buy_locations.length - 6} ubicaciones más
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">
          {equipped && !isEquipped
            ? `Reemplazará a ${equipped.name}`
            : "Compatible con este slot"}
        </span>
        <Button
          size="sm"
          className="rounded-xl gap-1 text-xs h-7"
          onClick={onSelect}
          disabled={isEquipped}
        >
          <Check className="h-3 w-3" />
          {isEquipped ? "Equipado" : "Equipar"}
        </Button>
      </div>
    </div>
  );
}
