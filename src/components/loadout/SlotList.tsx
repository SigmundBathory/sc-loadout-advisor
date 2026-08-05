"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, ArrowRight } from "lucide-react";
import { translateSlotTypeEs } from "@/lib/utils";
import type { Ship, Component, Hardpoint } from "@/lib/types";

interface SlotListProps {
  ship: Ship;
  slotAssignments: Record<string, string>;
  componentMap: Map<string, Component>;
  onSlotClick: (hardpoint: Hardpoint) => void;
  onClearSlot: (hardpointId: string) => void;
}

export default function SlotList({ ship, slotAssignments, componentMap, onSlotClick, onClearSlot }: SlotListProps) {
  return (
    <ScrollArea className="h-[620px] pr-2">
      <div className="space-y-3">
        {ship.hardpoints.map((hp) => {
          const assignedId = slotAssignments[hp.id];
          const comp = assignedId ? componentMap.get(assignedId) : null;

          return (
            <div
              key={hp.id}
              className="glass-panel glass-panel-hover p-4 rounded-xl border border-border/40 hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between group"
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
                </div>

                {comp ? (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
                    <span className="text-primary font-semibold">{comp.name}</span>
                    {comp.price_auec ? (
                      <span className="text-amber-400 font-mono">
                        <DollarSign className="inline h-3 w-3" />
                        {comp.price_auec.toLocaleString()} aUEC
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
                    Slot vacio — Haz click para equipar un componente
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
