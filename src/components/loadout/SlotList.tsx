"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, ArrowRight, ShoppingBag, Crown } from "lucide-react";
import { translateSlotTypeEs } from "@/lib/utils";
import { sortComponentsForSlot } from "@/lib/optimizer/componentSort";
import type { Ship, Component, Hardpoint } from "@/lib/types";

interface SlotListProps {
  ship: Ship;
  slotAssignments: Record<string, string>;
  componentMap: Map<string, Component>;
  allComponents: Component[];
  onSlotClick: (hardpoint: Hardpoint) => void;
  onClearSlot: (hardpointId: string) => void;
}

export default function SlotList({ ship, slotAssignments, componentMap, allComponents, onSlotClick, onClearSlot }: SlotListProps) {
  const bestPerSlot = useMemo(() => {
    const map = new Map<string, string>();
    for (const hp of ship.hardpoints) {
      const slotType = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
      const compType =
        slotType === "weapon" || slotType === "turret" || slotType === "missile" ? "Weapon"
        : slotType === "shield" ? "Shield"
        : slotType === "power_plant" || slotType === "powerplant" ? "PowerPlant"
        : slotType === "cooler" ? "Cooler"
        : slotType === "quantum_drive" || slotType === "quantumdrive" ? "QuantumDrive"
        : slotType === "radar" ? "Radar"
        : slotType === "thruster" || slotType === "flight_controller" ? "FlightController"
        : slotType === "life_support" || slotType === "lifesupport" ? "LifeSupport"
        : "";
      const compatible = allComponents.filter((c) => {
        const validTypes: Record<string, string[]> = {
          weapon: ["Weapon"], turret: ["Weapon"], shield: ["Shield"],
          power_plant: ["PowerPlant"], powerplant: ["PowerPlant"],
          cooler: ["Cooler"], quantum_drive: ["QuantumDrive"], quantumdrive: ["QuantumDrive"],
          radar: ["Radar"], thruster: ["FlightController"], flight_controller: ["FlightController"],
          life_support: ["LifeSupport"], lifesupport: ["LifeSupport"],
        };
        const types = validTypes[slotType] || [];
        return types.some(t => t.toLowerCase() === c.type.toLowerCase()) && c.size <= hp.max_size;
      });
      if (compatible.length > 0) {
        const sorted = sortComponentsForSlot(compatible, compType);
        map.set(hp.id, sorted[0].id);
      }
    }
    return map;
  }, [ship.hardpoints, allComponents]);

  return (
    <ScrollArea className="h-[620px] pr-2">
      <div className="space-y-3">
        {ship.hardpoints.map((hp) => {
          const assignedId = slotAssignments[hp.id];
          const comp = assignedId ? componentMap.get(assignedId) : null;
          const bestId = bestPerSlot.get(hp.id);
          const isBest = assignedId && bestId && assignedId === bestId;

          return (
            <div
              key={hp.id}
              className={`glass-panel glass-panel-hover p-4 rounded-xl border hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between group ${
                isBest ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/40"
              }`}
              onClick={() => onSlotClick(hp)}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary">
                    S{hp.size}
                  </Badge>
                  <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                    {hp.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                    {translateSlotTypeEs(hp.slot_type)}
                  </Badge>
                  {isBest && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] gap-0.5 px-1 py-0">
                      <Crown className="h-2.5 w-2.5" /> Mejor
                    </Badge>
                  )}
                </div>

                {comp ? (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
                    <span className="text-primary font-semibold">{comp.name}</span>
                    {comp.price_auec ? (
                      <span className="text-amber-400 font-mono flex items-center gap-1">
                        <DollarSign className="inline h-3 w-3" />
                        {comp.price_auec.toLocaleString()} aUEC
                        {comp.buy_locations && comp.buy_locations.length > 0 && (
                          <>
                            <ShoppingBag className="inline h-3 w-3 opacity-60" />
                            <span className="text-muted-foreground/80">
                              {comp.buy_locations[0].shop_name}
                              {comp.buy_locations[0].planet_moon && ` (${comp.buy_locations[0].planet_moon})`}
                            </span>
                          </>
                        )}
                      </span>
                    ) : null}
                    {comp.stats.dps ? (
                      <span className="text-red-400 font-mono">{comp.stats.dps.toFixed(0)} DPS</span>
                    ) : null}
                    {comp.stats.hp ? (
                      <span className="text-emerald-400 font-mono">{comp.stats.hp.toLocaleString()} HP</span>
                    ) : null}
                    {comp.stats.regen_rate ? (
                      <span className="text-cyan-400 font-mono">+{comp.stats.regen_rate}/s</span>
                    ) : null}
                    {comp.stats.travel_speed ? (
                      <span className="text-violet-400 font-mono">{(comp.stats.travel_speed / 1000000).toFixed(1)}G km/s</span>
                    ) : null}
                    {comp.stats.scm_speed ? (
                      <span className="text-blue-400 font-mono">{comp.stats.scm_speed} SCM</span>
                    ) : null}
                    {comp.stats.sensitivity_em ? (
                      <span className="text-orange-400 font-mono">EM {(comp.stats.sensitivity_em * 100).toFixed(0)}%</span>
                    ) : null}
                    {comp.stats.cooling_rate ? (
                      <span className="text-sky-400 font-mono">{comp.stats.cooling_rate} c/s</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/70 italic pt-0.5">
                    Slot vacío — Haz click para equipar
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {comp ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearSlot(hp.id);
                    }}
                  >
                    X
                  </Button>
                ) : (
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
