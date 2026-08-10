"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShipImage } from "@/components/ui/ProgressiveImage";
import { ClassBadge } from "@/components/ships/ClassBadge";
import { SpecialEditionBadge } from "@/components/ships/SpecialEditionBadge";
import type { Ship } from "@/lib/types";
import { Gauge, Shield, Users, Package, DollarSign, Wrench, ArrowRight } from "lucide-react";

interface ShipQuickLookDialogProps {
  ship: Ship | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fast, non-navigating preview opened from a ship card's "quick look" button.
 * Lets the user gauge a ship before committing to the full detail page.
 */
export default function ShipQuickLookDialog({ ship, onOpenChange }: ShipQuickLookDialogProps) {
  return (
    <Dialog open={!!ship} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-border/50">
        {ship && (
          <>
            <DialogTitle className="sr-only">{ship.name}</DialogTitle>
            <div className="relative h-48 w-full bg-muted/20 border-b border-border/30">
              <ShipImage ship={ship} fill alt={ship.name} className="object-contain p-4" />
              <div className="absolute inset-0 bg-gradient-to-t from-popover via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold font-heading text-foreground truncate drop-shadow-sm">
                    {ship.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{ship.manufacturer?.name}</p>
                </div>
                <ClassBadge classification={ship.classification} className="shrink-0" />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <SpecialEditionBadge ship={ship} />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <QuickStat icon={<Gauge className="h-3.5 w-3.5 text-blue-400" />} label="SCM" value={`${ship.scm_speed || 0} m/s`} />
                <QuickStat icon={<Shield className="h-3.5 w-3.5 text-emerald-400" />} label="Casco" value={(ship.hull_hp || 0).toLocaleString()} />
                <QuickStat icon={<Users className="h-3.5 w-3.5 text-red-400" />} label="Tripulación" value={String(ship.crew ?? 0)} />
                <QuickStat icon={<Package className="h-3.5 w-3.5 text-amber-400" />} label="Carga" value={`${ship.cargo_capacity || 0} SCU`} />
              </div>

              {ship.price_auec ? (
                <div className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-muted/30 border border-border/30">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" /> Precio
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {ship.price_auec.toLocaleString()} aUEC
                  </span>
                </div>
              ) : null}

              <div className="flex gap-2 pt-1">
                <Link href={`/ships/${ship.id}`} className="flex-1">
                  <Button className="w-full gap-2" size="sm">
                    <Wrench className="h-3.5 w-3.5" />
                    Configurar Loadout
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
      {icon}
      <div className="min-w-0">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-mono font-bold text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}
