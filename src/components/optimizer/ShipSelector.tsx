"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Rocket } from "lucide-react";
import type { Ship } from "@/lib/types";

interface ShipSelectorProps {
  selectedShipId: string;
  onSelect: (shipId: string) => void;
}

export default function ShipSelector({ selectedShipId, onSelect }: ShipSelectorProps) {
  const [ships, setShips] = useState<Ship[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/ships")
      .then((r) => r.json())
      .then((d) => setShips(d.ships || []));
  }, []);

  const filtered = ships.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.manufacturer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="glass-panel border-border/40">
      <CardHeader className="p-4 border-b border-border/30">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          1. Seleccionar Nave
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o fabricante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40 border-border/40 text-xs"
          />
        </div>

        <ScrollArea className="h-48 pr-2">
          <div className="space-y-1">
            {filtered.slice(0, 50).map((ship) => (
              <div
                key={ship.id}
                className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all flex items-center justify-between ${
                  selectedShipId === ship.id
                    ? "bg-primary/20 border border-primary text-foreground font-bold shadow-md shadow-primary/10"
                    : "hover:bg-muted/50 border border-transparent text-muted-foreground"
                }`}
                onClick={() => onSelect(ship.id)}
              >
                <div className="flex items-center gap-2">
                  <Rocket className="h-3.5 w-3.5 opacity-70" />
                  <span className="font-semibold text-foreground">{ship.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {ship.manufacturer?.name || "Desconocido"}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
