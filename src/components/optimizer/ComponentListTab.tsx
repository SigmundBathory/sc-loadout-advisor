"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin } from "lucide-react";
import { translateSlotTypeEs } from "@/lib/utils";
import type { Component, BuyLocation } from "@/lib/types";

interface ComponentListTabProps {
  components: { component: Component; score: number; slotId: string }[];
}

export default function ComponentListTab({ components }: ComponentListTabProps) {
  return (
    <Card className="glass-panel border-border/40">
      <CardHeader className="p-4 border-b border-border/30">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span>Lista de Componentes Equipados</span>
          <span className="text-xs text-muted-foreground font-normal">Precios y tiendas en el juego</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[480px] pr-2">
          <div className="space-y-3">
            {components.map((sel, i) => {
              const comp = sel.component;
              const spanishType = translateSlotTypeEs(comp?.type || sel.slotId);
              const locations = comp?.buy_locations || [];

              return (
                <div key={i} className="glass-panel p-4 rounded-xl border border-border/40 space-y-2.5 hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">{spanishType}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">Size {comp?.size || 1}</span>
                      </div>
                      <h4 className="font-extrabold text-base text-foreground mt-1">{comp?.name || comp?.class_name || "Componente"}</h4>
                      <div className="text-xs text-muted-foreground font-medium">
                        Fabricante: <span className="text-foreground">{comp?.manufacturer?.name || "Desconocido"}</span> • Clase: {comp?.class || "General"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-amber-400 font-mono">
                        {comp?.price_auec ? `${comp.price_auec.toLocaleString()} aUEC` : "Precio N/A"}
                      </div>
                      <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[10px] mt-1">
                        Score: {Math.round(sel.score)}/100
                      </Badge>
                    </div>
                  </div>

                  {comp?.stats && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
                      {comp.stats.dps ? <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[11px] font-mono">{comp.stats.dps.toFixed(0)} DPS</Badge> : null}
                      {comp.stats.alpha ? <Badge className="bg-red-500/10 text-red-200 border-red-500/20 text-[11px] font-mono">Alfa: {comp.stats.alpha}</Badge> : null}
                      {comp.stats.hp ? <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] font-mono">{comp.stats.hp.toLocaleString()} HP</Badge> : null}
                      {comp.stats.output ? <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[11px] font-mono">{comp.stats.output.toLocaleString()} W</Badge> : null}
                      {comp.stats.cooling_rate ? <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[11px] font-mono">{comp.stats.cooling_rate.toLocaleString()} Cooling</Badge> : null}
                      {comp.stats.travel_speed ? <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[11px] font-mono">{comp.stats.travel_speed.toLocaleString()} km/s</Badge> : null}
                    </div>
                  )}

                  {locations.length > 0 && (
                    <div className="pt-2 border-t border-border/30 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-foreground mb-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-400" /> Tiendas Disponibles:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                        {locations.map((loc: BuyLocation, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] bg-muted/40 p-2 rounded-lg border border-border/30">
                            <div>
                              <span className="font-bold text-foreground block">{loc.shop_name}</span>
                              <span className="text-muted-foreground text-[10px]">{loc.location_name} • {loc.planet_moon || loc.system}</span>
                            </div>
                            <span className="font-mono text-amber-400 font-bold">{loc.price ? `${loc.price.toLocaleString()} aUEC` : ""}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
