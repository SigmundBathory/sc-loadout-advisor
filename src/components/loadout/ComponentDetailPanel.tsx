"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, DollarSign, ShoppingBag, Check, Shield, Zap, Gauge, Thermometer, Navigation } from "lucide-react";
import type { Component } from "@/lib/types";
import { componentDetailRows } from "@/lib/optimizer/componentDetail";
import { formatPrice, hasKnownValue, isVerifiedSource, sourceLabel, UNAVAILABLE_LABEL } from "@/lib/presentation";

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Military: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  Civilian: { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  Stealth: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  Industrial: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  Competition: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
};

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
    <div className="relative z-20 bg-card/95 backdrop-blur-xl border border-primary/25 rounded-xl p-3 space-y-3 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {TYPE_ICONS[component.type]}
            <h4 className="font-bold text-sm text-foreground truncate">{component.name}</h4>
            {component.class && TIER_COLORS[component.class] && (
              <Badge className={`${TIER_COLORS[component.class].bg} ${TIER_COLORS[component.class].text} ${TIER_COLORS[component.class].border} text-[9px] gap-0.5 px-1 py-0`}>
                {component.class}
              </Badge>
            )}
            {isEquipped && (
              <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] gap-0.5 px-1 py-0">
                <Check className="h-2.5 w-2.5" /> Equipado
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {component.manufacturer.name || "?"} · G{component.stats.grade ?? "?"} · T{component.size}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-amber-300 font-mono font-bold text-xs flex items-center gap-0.5" title="Precio del catálogo; puede no estar verificado en el juego">
            <DollarSign className="h-3 w-3" />
            {formatPrice(component.price_auec)}
          </span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded-lg" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-30 -mx-1 rounded-lg border border-primary/20 bg-popover/95 backdrop-blur-xl px-2 py-2 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-muted-foreground">
            {equipped && !isEquipped ? `Reemplazará a ${equipped.name}` : "Compatible con este slot"}
          </span>
          <Button
            size="sm"
            className="rounded-lg gap-1.5 text-xs h-8 px-3 shadow-md shadow-primary/20"
            onClick={onSelect}
            disabled={isEquipped}
          >
            <Check className="h-3 w-3" />
            {isEquipped ? "Equipado" : "Equipar componente"}
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
            const comparable = eqRow && Number.isFinite(row.value) && Number.isFinite(eqRow.value);
            const diff = comparable ? row.value - eqRow.value : 0;
            const hasDiff = Boolean(equipped && comparable && row.value !== eqRow.value);
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
                        {loc.location_name}
                        {loc.planet_moon ? ` (${loc.planet_moon})` : ""}
                      </span>
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-amber-300 font-mono font-semibold block">
                      {hasKnownValue(loc.price) ? `${loc.price.toLocaleString("es-ES")} aUEC` : UNAVAILABLE_LABEL}
                    </span>
                    <span className={`text-[9px] block ${isVerifiedSource(loc.source) ? "text-emerald-400" : "text-amber-400"}`}>
                      {sourceLabel(loc.source)}
                    </span>
                  </div>
                </div>
              ))}
              {component.buy_locations.some((loc) => hasKnownValue(loc.price)) && (
                <div className="text-[10px] text-muted-foreground text-center py-0.5">
                  Precio observado en fuente de ubicación
                </div>
              )}
              {component.buy_locations.length > 6 && (
                <div className="text-[10px] text-muted-foreground text-center py-0.5">
                  +{component.buy_locations.length - 6} ubicaciones más
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : null}

      {!component.buy_locations?.length && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 text-[10px] text-amber-300">
          No hay una tienda verificada asociada a este componente. Puedes equiparlo, pero la ruta de compra requiere una sincronización de ubicaciones.
        </div>
      )}
    </div>
  );
}
