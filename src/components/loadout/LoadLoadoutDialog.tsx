"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Loadout } from "@/lib/types";

interface LoadLoadoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadouts: Loadout[];
  onSelect: (loadout: Loadout) => void;
}

export default function LoadLoadoutDialog({ open, onOpenChange, loadouts, onSelect }: LoadLoadoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-md border-border/40 space-y-4">
        <DialogHeader>
          <DialogTitle>Tus Loadouts Guardados</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh]">
          {loadouts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No tienes loadouts guardados aún.</p>
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
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="h-7 text-xs">Cargar</Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
