"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Shield, Compass, DollarSign, ArrowRight, Save, Check } from "lucide-react";
import LoadoutRadarChart from "@/components/stats/LoadoutRadarChart";
import type { Component } from "@/lib/types";

interface ResultHeaderProps {
  ship: any;
  result: any;
  qdComponent: Component | undefined;
  onApplyToBuilder: () => void;
  onSave: () => void;
  savedMsg: string;
}

export default function ResultHeader({ ship, result, qdComponent, onApplyToBuilder, onSave, savedMsg }: ResultHeaderProps) {
  return (
    <Card className="glass-panel border-border/40 overflow-hidden">
      <CardHeader className="p-5 border-b border-border/30 bg-muted/20 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{ship.name}</h2>
            <Badge variant="outline" className="border-primary/40 text-primary uppercase font-mono text-xs">
              Loadout Completo
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fabricante: {ship.manufacturer?.name || "Desconocido"} • Clasificación: {ship.classification || "N/A"}
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-extrabold text-primary font-mono">
            {Math.round(result.optimization?.totalScore || 0)}/100
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase">Score de Coincidencia</div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Crosshair className="h-3.5 w-3.5 text-red-400" />} label="DPS Total" value={`${result.stats?.total_dps?.toFixed(0) || 0} DPS`} color="text-red-400" />
          <StatCard icon={<Shield className="h-3.5 w-3.5 text-emerald-400" />} label="Escudos HP" value={`${result.stats?.shield_hp?.toLocaleString() || 0} HP`} color="text-emerald-400" />
          <StatCard icon={<Compass className="h-3.5 w-3.5 text-cyan-400" />} label="Vel. Quantum" value={qdComponent?.stats?.travel_speed ? `${qdComponent.stats.travel_speed.toLocaleString()} km/s` : `${result.stats?.scm_speed || 0} m/s`} color="text-cyan-400" />
          <StatCard icon={<DollarSign className="h-3.5 w-3.5 text-amber-400" />} label="Coste Estimado" value={result.stats?.total_cost ? `${result.stats.total_cost.toLocaleString()} aUEC` : "N/A"} color="text-amber-400" />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button onClick={onApplyToBuilder} className="flex-1 gap-2 rounded-xl font-bold">
            <span>Abrir y Editar en Loadout Builder</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={onSave} variant="secondary" className="gap-2 rounded-xl">
            <Save className="h-4 w-4" />
            Guardar Loadout
          </Button>
        </div>

        {savedMsg && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-1">
            <Check className="h-4 w-4" />
            {savedMsg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        {icon} {label}
      </div>
      <div className={`text-lg font-bold font-mono mt-1 ${color}`}>
        {value}
      </div>
    </div>
  );
}
