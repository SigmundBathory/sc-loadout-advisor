"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, ShoppingCart, Key, Trophy } from "lucide-react";
import type { ShipBuyLocation } from "@/lib/db/queries";

interface ShipBuyLocationsProps {
  locations: ShipBuyLocation[];
}

export default function ShipBuyLocations({ locations }: ShipBuyLocationsProps) {
  if (locations.length === 0) return null;

  const sales = locations.filter(l => l.location_type === "sale");
  const rentals = locations.filter(l => l.location_type === "rental");
  const earns = locations.filter(l => l.location_type === "earn");

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Disponibilidad In-Game
      </h3>

      {sales.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Compra</span>
          </div>
          <div className="space-y-1.5">
            {sales.map((loc, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{loc.shop_name}</span>
                  <span className="text-muted-foreground">— {loc.location_name}</span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold">
                  {loc.price_auec > 0 ? `${loc.price_auec.toLocaleString()} aUEC` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rentals.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Alquiler (1 día)</span>
          </div>
          <div className="space-y-1.5">
            {rentals.map((loc, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{loc.shop_name}</span>
                  <span className="text-muted-foreground">— {loc.location_name}</span>
                </div>
                <span className="font-mono text-blue-400 font-semibold">
                  {loc.price_auec > 0 ? `${loc.price_auec.toLocaleString()} aUEC` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {earns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Obtener (Misiones/Wikelo)</span>
          </div>
          <div className="space-y-1.5">
            {earns.map((loc, i) => (
              <div key={i} className="flex items-center text-xs bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                <span className="font-medium text-foreground">{loc.shop_name}</span>
                <span className="text-muted-foreground ml-2">— {loc.location_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
