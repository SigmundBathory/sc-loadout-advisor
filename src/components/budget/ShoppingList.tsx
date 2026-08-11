"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, ShoppingCart, Building } from "lucide-react";
import type { Component, BuyLocation } from "@/lib/types";
import { translateComponentTypeEs } from "@/lib/utils";
import { formatPrice, hasKnownValue, isVerifiedSource, sourceLabel, UNAVAILABLE_LABEL, UNVERIFIED_DATA_LABEL } from "@/lib/presentation";

interface ShoppingListProps {
  components: Component[];
}

export default function ShoppingList({ components }: ShoppingListProps) {
  // Group components by system -> planet -> shop for better organization
  const systemMap = new Map<
    string,
    Map<string, Map<string, { location: BuyLocation; components: Component[] }>>
  >();

  for (const comp of components) {
    if (comp.buy_locations && comp.buy_locations.length > 0) {
      for (const loc of comp.buy_locations) {
        const system = loc.system || "Unknown";
        const planet = loc.planet_moon || loc.location_name || "Unknown";
        const shop = loc.shop_name || loc.location_name || "Unknown";
        
        if (!systemMap.has(system)) {
          systemMap.set(system, new Map());
        }
        
        const planetMap = systemMap.get(system)!;
        if (!planetMap.has(planet)) {
          planetMap.set(planet, new Map());
        }
        
        const shopMap = planetMap.get(planet)!;
        const key = `${shop}_${loc.location_name}`;
        
        const existing = shopMap.get(key);
        if (existing) {
          existing.components.push(comp);
        } else {
          shopMap.set(key, { location: loc, components: [comp] });
        }
      }
    }
  }

  // Calculate total cost
  const pricedComponents = components.filter(
    (component) => typeof component.price_auec === "number" && component.price_auec > 0
  );
  const totalCost = pricedComponents.reduce((sum, c) => sum + c.price_auec!, 0);
  const hasCompleteCost = pricedComponents.length === components.length && components.length > 0;

  // Count components by system
  const systemStats = Array.from(systemMap.entries()).map(([system, planetMap]) => {
    let systemTotalCost = 0;
    let systemComponentCount = 0;
    
    for (const [, shopMap] of planetMap) {
      for (const { components: comps } of shopMap.values()) {
        const shopPriced = comps.filter((c) => typeof c.price_auec === "number" && c.price_auec > 0);
        systemTotalCost += shopPriced.reduce((sum, c) => sum + c.price_auec!, 0);
        systemComponentCount += comps.length;
      }
    }
    
    return {
      system,
      totalCost: systemTotalCost,
      componentCount: systemComponentCount,
      planetCount: planetMap.size,
    };
  });

  // Get all locations grouped by system
  const systems = Array.from(systemMap.entries()).map(([system, planetMap]) => ({
    system,
    planets: Array.from(planetMap.entries()).map(([planet, shopMap]) => ({
      planet,
      shops: Array.from(shopMap.values()),
    })),
  }));

  const unassignedComponents = components.filter(
    (c) => !c.buy_locations || c.buy_locations.length === 0
  );

  return (
    <Card className="product-card border-border/40">
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
            {hasCompleteCost ? `${totalCost.toLocaleString("es-ES")} aUEC` : UNVERIFIED_DATA_LABEL}
          </span>
        </div>

        {/* System Overview */}
        {systems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {systemStats.map((stat) => (
              <div
                key={stat.system}
                className="product-card p-4 rounded-xl border border-border/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm">{stat.system}</h4>
                  <Badge variant="outline" className="text-xs">
                    {stat.planetCount} planeta(s)
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Componentes:</span>
                    <span className="font-mono">{stat.componentCount}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Coste total:</span>
                    <span className="font-mono text-amber-400">
                      {stat.totalCost.toLocaleString("es-ES")} aUEC
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grouped by System -> Planet -> Shop */}
        {systems.length > 0 ? (
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-6">
              {systems.map(({ system, planets }) => (
                <div key={system} className="space-y-4">
                  <h3 className="text-lg font-bold text-primary border-b border-border/30 pb-2">
                    {system}
                  </h3>
                  
                  {planets.map(({ planet, shops }) => (
                    <div key={planet} className="space-y-3 ml-4">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {planet}
                      </h4>
                      
                      {shops.map(({ location, components: comps }, shopIndex) => {
                        const shopPricedComponents = comps.filter(
                          (component) => typeof component.price_auec === "number" && component.price_auec > 0
                        );
                        const shopCost = shopPricedComponents.reduce((sum, c) => sum + c.price_auec!, 0);
                        const hasCompleteShopCost = shopPricedComponents.length === comps.length;

                        return (
                          <div
                            key={shopIndex}
                            className="product-card p-4 rounded-xl border border-border/40 space-y-3 ml-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                  <Building className="h-4 w-4" />
                                </div>
                                <div>
                                  <h5 className="font-extrabold text-sm text-foreground">
                                    {location.shop_name || location.location_name}
                                  </h5>
                                  <p className="text-xs text-muted-foreground">
                                    {location.location_name}
                                  </p>
                                  <p className={`text-[10px] ${isVerifiedSource(location.source) ? "text-emerald-400" : "text-amber-400"}`}>
                                    {sourceLabel(location.source)}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-mono font-bold text-amber-400 block">
                                  {hasCompleteShopCost ? `${shopCost.toLocaleString("es-ES")} aUEC` : UNAVAILABLE_LABEL}
                                </span>
                                {hasKnownValue(location.price) && (
                                  <span className="text-[10px] text-muted-foreground block">Precio observado</span>
                                )}
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
                                  className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/35 border border-border/25"
                                >
                                  <div>
                                    <span className="font-bold text-foreground block">{comp.name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {translateComponentTypeEs(comp.type)} • Size {comp.size}
                                    </span>
                                  </div>
                                  <span className="text-amber-300 font-mono font-bold text-xs">
                                    {formatPrice(comp.price_auec)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : null}

        {/* Unassigned Components if any */}
        {unassignedComponents.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Componentes sin tienda verificada
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
                    {comp.price_auec ? formatPrice(comp.price_auec) : "Equipado de serie · precio no disponible"}
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
