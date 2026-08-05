"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Wand2 } from "lucide-react";

interface BudgetInputProps {
  maxBudget: number | undefined;
  onBudgetChange: (budget: number | undefined) => void;
  onOptimize: () => void;
  disabled: boolean;
  optimizing: boolean;
}

export default function BudgetInput({ maxBudget, onBudgetChange, onOptimize, disabled, optimizing }: BudgetInputProps) {
  return (
    <Card className="glass-panel border-border/40">
      <CardHeader className="p-4 border-b border-border/30">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-amber-400" />
          4. Presupuesto Máximo (aUEC)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <Input
          type="number"
          placeholder="Sin límite (ej: 2000000)"
          value={maxBudget || ""}
          onChange={(e) => onBudgetChange(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-muted/40 border-border/40 font-mono text-xs"
        />

        <Button
          onClick={onOptimize}
          disabled={disabled || optimizing}
          className="w-full rounded-xl gap-2 font-bold text-sm py-6 shadow-lg shadow-primary/25"
        >
          <Wand2 className={`h-5 w-5 ${optimizing ? "animate-spin" : ""}`} />
          {optimizing ? "Calculando Configuración Óptima..." : "Ejecutar Optimización"}
        </Button>
      </CardContent>
    </Card>
  );
}
