"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Upload, Wand2 } from "lucide-react";
import type { Loadout } from "@/lib/types";

interface LoadoutHeaderProps {
  shipName: string;
  loadedLoadout: Loadout | null;
  lastOptimizedPreset: string;
  onBack: () => void;
  onLoad: () => void;
  onOptimize: () => void;
  onSave: () => void;
  optimizing: boolean;
}

export default function LoadoutHeader({
  shipName,
  loadedLoadout,
  lastOptimizedPreset,
  onBack,
  onLoad,
  onOptimize,
  onSave,
  optimizing,
}: LoadoutHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Naves
      </Button>

      {(loadedLoadout || lastOptimizedPreset) && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground max-w-[240px] truncate">
            {loadedLoadout?.name || shipName}
          </span>
          {lastOptimizedPreset || loadedLoadout?.is_optimized ? (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
              <Wand2 className="h-3 w-3 mr-1" />
              Optimizada
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-500/30">
              Estándar
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 border-border/40 text-xs font-medium hover:bg-muted/40"
          onClick={onLoad}
        >
          <Upload className="h-4 w-4" />
          Cargar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 border-border/40 text-xs font-medium hover:bg-muted/40"
          onClick={onOptimize}
          disabled={optimizing}
        >
          <Wand2 className="h-4 w-4" />
          {optimizing ? "Optimizando..." : "Optimizar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2 border-border/40 text-xs font-medium hover:bg-muted/40"
          onClick={onSave}
        >
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  );
}
