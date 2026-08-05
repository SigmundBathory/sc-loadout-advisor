"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Minus, Minus as MinusIcon } from "lucide-react";

interface VersionChangesProps {
  fromVersion: string;
  toVersion: string;
  shipDelta: number;
  componentDelta: number;
  weaponDelta: number;
}

export default function VersionChanges({
  fromVersion,
  toVersion,
  shipDelta,
  componentDelta,
  weaponDelta,
}: VersionChangesProps) {
  const from = fromVersion.split("-")[0];
  const to = toVersion.split("-")[0];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Cambios entre versiones</h3>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <Badge variant="outline" className="font-mono text-xs">
          {from}
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant="default" className="font-mono text-xs">
          {to}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <DeltaCard label="Naves" delta={shipDelta} />
        <DeltaCard label="Componentes" delta={componentDelta} />
        <DeltaCard label="Armas" delta={weaponDelta} />
      </div>
    </div>
  );
}

function DeltaCard({ label, delta }: { label: string; delta: number }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <div className="text-center p-3 rounded-lg bg-muted/30">
      <p className="text-xl font-bold font-mono">
        {isNeutral ? (
          <span className="text-muted-foreground">—</span>
        ) : isPositive ? (
          <span className="text-green-500">+{delta}</span>
        ) : (
          <span className="text-red-500">{delta}</span>
        )}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
