"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";

interface Loadout {
  id: string;
  name: string;
  ship_id: string;
  ship_name?: string;
  components: string;
  updated_at: string;
}

export default function RecentLoadouts({ loadouts }: { loadouts: Loadout[] }) {
  return (
    <div className="product-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="section-kicker">Hangar personal</p>
          <h3 className="text-base font-semibold text-foreground mt-1">Loadouts recientes</h3>
        </div>
        <Link href="/ships">
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" />
            Nuevo
          </Button>
        </Link>
      </div>
      {loadouts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No hay loadouts guardados</p>
          <Link href="/ships">
            <Button variant="link" size="sm" className="mt-2 text-xs">
              Crear uno ahora →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loadouts.slice(0, 4).map((loadout) => {
              let compCount = 0;
              try {
                const comps = JSON.parse(loadout.components);
                compCount = Object.keys(comps).length;
              } catch {}

              return (
                <StaggerItem key={loadout.id}>
                  <Link
                    href={`/ships/${loadout.ship_id}`}
                    className="p-3.5 rounded-xl bg-muted/35 border border-border/30 hover:bg-muted/65 hover:border-primary/25 transition-all group block"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {loadout.name}
                      </p>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {compCount} componente{compCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(loadout.updated_at).toLocaleDateString("es-ES")}
                    </p>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      )}
    </div>
  );
}
