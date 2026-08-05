"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const SLOT_TYPES = [
  { id: "weapon", label: "Armas y Torretas" },
  { id: "shield", label: "Generadores de Escudo" },
  { id: "quantum_drive", label: "Motor Quantum (Salto)" },
  { id: "power_plant", label: "Plantas de Energía" },
  { id: "cooler", label: "Enfriadores" },
  { id: "missile", label: "Misiles y Racks" },
];

interface SlotTypeSelectorProps {
  selectedTypes: string[];
  onToggle: (type: string) => void;
}

export default function SlotTypeSelector({ selectedTypes, onToggle }: SlotTypeSelectorProps) {
  return (
    <Card className="glass-panel border-border/40">
      <CardHeader className="p-4 border-b border-border/30">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-emerald-400" />
          3. Componentes a Incluir
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <p className="text-xs text-muted-foreground mb-2">
          Marca los componentes que deseas optimizar:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-medium">
          {SLOT_TYPES.map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer border transition-all ${
                selectedTypes.includes(item.id)
                  ? "bg-primary/15 border-primary text-foreground font-bold"
                  : "bg-muted/20 border-border/30 text-muted-foreground"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedTypes.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="rounded border-border/40 text-primary focus:ring-primary h-4 w-4"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
