"use client";

import { useMemo } from "react";
import { useShipComponents } from "@/lib/api/client";
import PowerTriangle from "@/components/stats/PowerTriangle";
import DamageProfileChart from "@/components/stats/DamageProfileChart";
import { ComponentDNACard } from "@/components/stats/ComponentDNACard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Crosshair, Gauge } from "lucide-react";
import type { Ship } from "@/lib/types";

interface ShipStatsVisualizationsProps {
  ship: Ship;
}

const WEAPON_COLORS = [
  "#00d4ff", "#ff6b00", "#ff0055", "#ffdd00", "#00ff88", "#aa66ff",
];

export default function ShipStatsVisualizations({ ship }: ShipStatsVisualizationsProps) {
  const { data: components = [] } = useShipComponents(ship);

  const weaponComponents = useMemo(
    () => components.filter((c) => c.type === "Weapon" && c.stats.dps && c.stats.dps > 0),
    [components]
  );

  const powerValues = useMemo(() => {
    const weaponCount = ship.hardpoints.filter((h) => h.slot_type === "weapon").length;
    const shieldCount = ship.hardpoints.filter((h) => h.slot_type === "shield").length;
    const engineCount = ship.hardpoints.filter(
      (h) => h.slot_type === "thruster" || h.slot_type === "quantum_drive"
    ).length;

    const total = weaponCount + shieldCount + engineCount || 1;
    const weaponsPower = Math.round((weaponCount / total) * 100);
    const shieldsPower = Math.round((shieldCount / total) * 100);
    const enginesPower = 100 - weaponsPower - shieldsPower;

    return { weaponsPower, shieldsPower, enginesPower };
  }, [ship.hardpoints]);

  const weaponProfiles = useMemo(
    () =>
      weaponComponents.map((c, i) => ({
        name: c.name,
        type: c.stats.damage_type || "ballistic",
        dps: c.stats.dps || 0,
        range: c.stats.range || 500,
        falloffStart: c.stats.range ? Math.round(c.stats.range * 0.6) : 300,
        falloffEnd: c.stats.range ? Math.round(c.stats.range * 1.2) : 600,
        color: WEAPON_COLORS[i % WEAPON_COLORS.length],
      })),
    [weaponComponents]
  );

  const highlightComponent = useMemo(() => {
    if (weaponComponents.length === 0) return null;
    return weaponComponents.reduce((best, c) => ((c.stats.dps || 0) > (best.stats.dps || 0) ? c : best), weaponComponents[0]);
  }, [weaponComponents]);

  return (
    <div className="space-y-6">
      {/* Power Triangle + Damage Profile */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm border-border/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="h-5 w-5" style={{ color: "var(--sc-quantum-500)" }} />
              Distribución de Potencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PowerTriangle
              weaponsPower={powerValues.weaponsPower}
              shieldsPower={powerValues.shieldsPower}
              enginesPower={powerValues.enginesPower}
              size={280}
              interactive
            />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crosshair className="h-5 w-5" style={{ color: "var(--sc-engine-500)" }} />
              Perfil de Daño
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weaponProfiles.length > 0 ? (
              <DamageProfileChart weapons={weaponProfiles} width={500} height={280} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin datos de armas disponibles
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Component DNA highlight */}
      {highlightComponent && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" style={{ color: "var(--sc-engine-500)" }} />
              Componente Destacado
              <Badge variant="outline" className="text-xs ml-2">
                Mayor DPS
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComponentDNACard
              component={{
                name: highlightComponent.name,
                type: highlightComponent.type,
                manufacturer: highlightComponent.manufacturer.name,
                grade: String(highlightComponent.class || "A"),
                size: highlightComponent.size,
                stats: highlightComponent.stats as unknown as Record<string, number>,
                tradeoffs: [],
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
