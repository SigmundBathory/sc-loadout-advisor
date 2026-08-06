"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import type { Ship } from "@/lib/types";

interface SaveLoadoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ship: Ship;
  onSave: (name: string) => Promise<void>;
}

export default function SaveLoadoutDialog({ open, onOpenChange, ship, onSave }: SaveLoadoutDialogProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      setSuccessMsg("¡Loadout guardado correctamente!");
      setTimeout(() => {
        setSuccessMsg("");
        onOpenChange(false);
        setName("");
      }, 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-md border-border/40 space-y-4">
        <DialogHeader>
          <DialogTitle>Guardar Configuración</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Nombre del Loadout</label>
          <Input
            placeholder={`Ej: ${ship.name} PvP Build`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-muted/40 border-border/40"
          />
          {successMsg && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <Check className="h-4 w-4" />
              {successMsg}
            </div>
          )}
          <Button onClick={handleSave} className="w-full" disabled={saving || !name.trim()}>
            {saving ? "Guardando..." : "Confirmar y Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
