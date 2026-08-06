"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Loadout, Ship } from "@/lib/types";
import {
  downloadFile,
  serializeLoadoutForExport,
  parseLoadoutImport,
  loadoutShareUrl,
  copyShareUrl,
  type ImportedLoadout,
} from "@/lib/loadout/share";
import { Download, Upload, Link2, Check, FileJson } from "lucide-react";

interface LoadLoadoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadouts: Loadout[];
  ship?: Ship;
  onSelect: (loadout: Loadout) => void;
  onImport?: (imported: ImportedLoadout) => void;
}

export default function LoadLoadoutDialog({
  open,
  onOpenChange,
  loadouts,
  ship,
  onSelect,
  onImport,
}: LoadLoadoutDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const handleExport = (loadout: Loadout) => {
    downloadFile(
      `loadout-${loadout.name.replace(/[^\w\d-]+/g, "_")}.json`,
      serializeLoadoutForExport(loadout)
    );
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const imported = parseLoadoutImport(text);
      if (!imported) {
        setError("Archivo inválido: no contiene un loadout de SC Loadout Advisor.");
        setFeedback("");
        return;
      }
      setError("");
      setFeedback("");
      onOpenChange(false);
      onImport?.(imported);
    } catch {
      setError("No se pudo leer el archivo.");
    }
  };

  const handleCopyLink = async (loadout: Loadout) => {
    if (!ship) return;
    const url = loadoutShareUrl(ship, loadout.components, {
      name: loadout.name,
      optimized: loadout.is_optimized,
      preset: loadout.optimized_preset,
    });
    const ok = await copyShareUrl(url);
    setFeedback(ok ? "¡Enlace copiado al portapapeles!" : "No se pudo copiar el enlace.");
    setError("");
    setTimeout(() => setFeedback(""), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-md border-border/40 space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Tus Loadouts Guardados</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({loadouts.length})
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 text-xs rounded-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Importar JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 text-xs rounded-xl text-muted-foreground"
            onClick={() => setFeedback("Usa Exportar en cada loadout para descargar su JSON.")}
          >
            <FileJson className="h-3.5 w-3.5" />
            ¿Cómo exportar?
          </Button>
        </div>

        {feedback && (
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" />
            {feedback}
          </div>
        )}
        {error && <div className="text-xs text-red-400 font-medium">{error}</div>}

        <ScrollArea className="max-h-[50vh]">
          {loadouts.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6 space-y-1">
              <p>No tienes loadouts guardados aún.</p>
              <p>Guarda una configuración o importa un archivo JSON.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {loadouts.map((loadout) => (
                <div
                  key={loadout.id}
                  className="glass-panel p-3 rounded-xl border border-border/40 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => {
                    onSelect(loadout);
                    onOpenChange(false);
                  }}
                >
                  <div>
                    <div className="font-bold text-sm">{loadout.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Guardado el {new Date(loadout.updated_at || loadout.created_at).toLocaleDateString("es-ES")}
                      {loadout.is_optimized ? " • ⚡ Optimizada" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {ship && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground"
                        title="Copiar enlace de compartir"
                        onClick={() => handleCopyLink(loadout)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground"
                      title="Exportar JSON"
                      onClick={() => handleExport(loadout)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-7 text-xs">
                      Cargar
                    </Button>
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
