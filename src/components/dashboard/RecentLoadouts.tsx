"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";

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
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Loadouts Recientes</h3>
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
          {loadouts.slice(0, 4).map((loadout) => {
            let compCount = 0;
            try {
              const comps = JSON.parse(loadout.components);
              compCount = Object.keys(comps).length;
            } catch {}

            return (
              <Link
                key={loadout.id}
                href={`/ships/${loadout.ship_id}`}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
