"use client";

import { Button } from "@/components/ui/button";
import { Save, Upload, Wand2 } from "lucide-react";
import type { Loadout } from "@/lib/types";

interface LoadoutHeaderProps {
  shipName: string;
  loadedLoadout: Loadout | null;
  lastOptimizedPreset: string;
  onLoad: () => void;
  onOptimize: () => void;
  onSave: () => void;
  optimizing: boolean;
}

export default function LoadoutHeader({
  shipName,
  loadedLoadout,
  lastOptimizedPreset,
  onLoad,
  onOptimize,
  onSave,
  optimizing,
}: LoadoutHeaderProps) {
  return (
    <div className="product-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div>
          <p className="section-kicker">Loadout studio</p>
          <h2 className="text-base font-bold text-foreground">Configuración del Loadout</h2>
        </div>
        {(loadedLoadout || lastOptimizedPreset) && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium text-muted-foreground max-w-[180px] truncate">
              {loadedLoadout?.name || shipName}
            </span>
            {lastOptimizedPreset || loadedLoadout?.is_optimized ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                <Wand2 className="h-2.5 w-2.5 mr-0.5" />
                Optimizada
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-500/30">
                Estándar
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 border-border/40 text-xs font-medium hover:bg-muted/40"
          onClick={onLoad}
        >
          <Upload className="h-3.5 w-3.5" />
          Cargar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 border-border/40 text-xs font-medium hover:bg-muted/40"
          onClick={onOptimize}
          disabled={optimizing}
        >
          <Wand2 className="h-3.5 w-3.5" />
          {optimizing ? "Optimizando..." : "Optimizar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 bg-primary text-primary-foreground text-xs font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-0.5 transition-transform"
          onClick={onSave}
        >
          <Save className="h-3.5 w-3.5" />
          Guardar
        </Button>
      </div>
    </div>
  );
}
