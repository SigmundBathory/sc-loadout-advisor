"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, ShoppingCart, Building } from "lucide-react";
import type { Component, BuyLocation } from "@/lib/types";
import { translateComponentTypeEs } from "@/lib/utils";

interface ShoppingListProps {
  components: Component[];
}

export default function ShoppingList({ components }: ShoppingListProps) {
  // Group components by location/shop
  const locationMap = new Map<
    string,
    { location: BuyLocation; components: Component[] }
  >();

  for (const comp of components) {
    if (comp.buy_locations && comp.buy_locations.length > 0) {
      for (const loc of comp.buy_locations) {
        const key = `${loc.shop_name}_${loc.location_name}`;
        const existing = locationMap.get(key);
        if (existing) {
          existing.components.push(comp);
        } else {
          locationMap.set(key, { location: loc, components: [comp] });
        }
      }
    }
  }

  const totalCost = components.reduce(
    (sum, c) => sum + (c.price_auec || 0),
    0
  );

  const locations = Array.from(locationMap.values());
  const unassignedComponents = components.filter(
    (c) => !c.buy_locations || c.buy_locations.length === 0
  );

  return (
    <Card className="glass-panel border-border/40">
      <CardHeader className="p-5 border-b border-border/30">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-amber-400" />
            <span>Lista de Compra & Tiendas en el Verse</span>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-300">
            {components.length} ítems
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Total Cost Summary Card */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div>
            <span className="font-bold text-sm text-foreground block">Presupuesto Estimado Total</span>
            <span className="text-xs text-muted-foreground">Suma del coste de todos los componentes equipados</span>
          </div>
          <span className="text-2xl font-extrabold text-amber-400 font-mono">
            {totalCost ? `${totalCost.toLocaleString()} aUEC` : "N/A"}
          </span>
        </div>

        {/* Grouped Shops & Locations */}
        {locations.length > 0 ? (
          <ScrollArea className="h-[480px] pr-2">
            <div className="space-y-4">
              {locations.map(({ location, components: comps }, i) => {
                const shopCost = comps.reduce((sum, c) => sum + (location.price || c.price_auec || 0), 0);

                return (
                  <div key={i} className="glass-panel p-4 rounded-xl border border-border/40 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-foreground">
                            {location.shop_name || location.location_name}
                          </h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-cyan-400" />
                            {location.location_name} • {location.planet_moon || location.system || "Stanton"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400 block">
                          {shopCost ? `${shopCost.toLocaleString()} aUEC` : ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {comps.length} componente(s)
                        </span>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div className="space-y-2">
                      {comps.map((comp) => (
                        <div
                          key={comp.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border border-border/20"
                        >
                          <div>
                            <span className="font-bold text-foreground block">{comp.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {translateComponentTypeEs(comp.type)} • Size {comp.size}
                            </span>
                          </div>
                          <span className="text-amber-300 font-mono font-bold text-xs">
                            {comp.price_auec ? `${comp.price_auec.toLocaleString()} aUEC` : "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : null}

        {/* Unassigned Components if any */}
        {unassignedComponents.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Componentes Estándar / De Serie
            </h4>
            <div className="space-y-1.5">
              {unassignedComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/20 border border-border/20"
                >
                  <div>
                    <span className="font-semibold text-foreground">{comp.name}</span>
                    <span className="text-muted-foreground text-[10px] ml-2">
                      ({translateComponentTypeEs(comp.type)})
                    </span>
                  </div>
                  <span className="text-amber-400 font-mono font-semibold">
                    {comp.price_auec ? `${comp.price_auec.toLocaleString()} aUEC` : "Equipado de serie"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
