"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Crosshair, Gauge, Fuel } from "lucide-react";
import type { Ship } from "@/lib/types";

export default function ShipInfoCard({ ship }: { ship: Ship }) {
  return (
    <Card className="glass-panel border-border/40 overflow-hidden">
      {ship.image_url ? (
        <div className="h-44 w-full relative overflow-hidden bg-muted/30 border-b border-border/30">
          <img src={ship.image_url} alt={ship.name} className="object-cover w-full h-full" />
        </div>
      ) : null}
      <CardHeader className="p-5">
        <CardTitle className="flex items-center justify-between gap-2 text-xl">
          <span>{ship.name}</span>
          <Badge variant="outline" className="border-primary/40 text-primary">
            {ship.classification || "General"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        <p className="text-xs text-muted-foreground font-medium">
          Fabricante: <span className="text-foreground">{ship.manufacturer.name}</span>
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-xl border border-border/30">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground">Velocidad SCM</div>
              <div className="font-mono font-semibold">{ship.scm_speed} m/s</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground">HP Casco</div>
              <div className="font-mono font-semibold">{ship.hull_hp?.toLocaleString()} HP</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-red-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground">Tripulación</div>
              <div className="font-mono font-semibold">{ship.crew} persona(s)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-muted-foreground">Capacidad Carga</div>
              <div className="font-mono font-semibold">{ship.cargo_capacity} SCU</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
