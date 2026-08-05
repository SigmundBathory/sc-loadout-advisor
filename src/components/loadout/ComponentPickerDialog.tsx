"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Wand2, Info, ShoppingBag } from "lucide-react";
import type { Component, Hardpoint } from "@/lib/types";

interface ComponentPickerDialogProps {
  slot: Hardpoint | null;
  components: Component[];
  loading: boolean;
  onSelect: (component: Component) => void;
  onClose: () => void;
}

export default function ComponentPickerDialog({ slot, components, loading, onSelect, onClose }: ComponentPickerDialogProps) {
  const [search, setSearch] = useState("");

  const filtered = components.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.manufacturer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={!!slot} onOpenChange={() => onClose()}>
      <DialogContent className="glass-panel max-w-2xl max-h-[85vh] flex flex-col border-border/40">
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

        <ScrollArea className="flex-1 max-h-[55vh] pr-2">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <Wand2 className="h-8 w-8 mx-auto animate-spin text-primary opacity-60" />
              <p className="text-sm">Buscando componentes compatibles...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <Info className="h-8 w-8 mx-auto opacity-40" />
              <p className="text-sm">No hay componentes que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((comp) => (
                <div
                  key={comp.id}
                  className="glass-panel glass-panel-hover p-3 rounded-xl border border-border/30 cursor-pointer flex items-center justify-between transition-all"
                  onClick={() => onSelect(comp)}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-foreground">{comp.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {comp.manufacturer.name || "Desconocido"} • Clásificación: {comp.class || "General"}
                    </div>
                  </div>

<div className="text-right text-xs font-mono space-y-1">
                      {comp.stats.dps ? (
                        <div className="text-red-400 font-bold">{comp.stats.dps.toFixed(0)} DPS</div>
                      ) : null}
                      {comp.stats.hp ? (
                        <div className="text-emerald-400 font-bold">{comp.stats.hp.toLocaleString()} HP</div>
                      ) : null}
                      {comp.stats.output ? (
                        <div className="text-amber-400 font-bold">{comp.stats.output.toLocaleString()} W Output</div>
                      ) : null}
                      {comp.price_auec ? (
                        <div className="space-y-1">
                          <div className="text-amber-300 font-semibold flex items-center gap-1">
                            {comp.price_auec.toLocaleString()} aUEC
                            {comp.buy_locations && comp.buy_locations.length > 0 && (
                              <ShoppingBag className="h-3 w-3 opacity-50" />
                            )}
                          </div>
                          {comp.buy_locations && comp.buy_locations.length > 0 && (
                            <div className="text-muted-foreground/70 text-[10px] space-y-0.5">
                              {comp.buy_locations.slice(0, 3).map((loc, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span>{loc.shop_name}</span>
                                  {loc.planet_moon && <span className="opacity-60">({loc.planet_moon})</span>}
                                </div>
                              ))}
                              {comp.buy_locations.length > 3 && (
                                <div className="text-muted-foreground/50">+{comp.buy_locations.length - 3} más...</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
