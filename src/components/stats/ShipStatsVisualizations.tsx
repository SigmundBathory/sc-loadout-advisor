"use client";

import { useMemo, useState } from "react";
import { useShipComponents } from "@/lib/api/client";
import PowerTriangle from "@/components/stats/PowerTriangle";
import DamageProfileChart from "@/components/stats/DamageProfileChart";
import { ComponentDNACard } from "@/components/stats/ComponentDNACard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Crosshair,
  Gauge,
  Shield,
  Users,
  Package,
  Weight,
  Rocket,
} from "lucide-react";
import type { Ship } from "@/lib/types";

interface ShipStatsVisualizationsProps {
  ship: Ship;
}

const WEAPON_COLORS = [
  "#00d4ff",
  "#ff6b00",
  "#ff0055",
  "#ffdd00",
  "#00ff88",
  "#aa66ff",
];

// Perfiles de daño disponibles. Cada uno ordena/recalca las armas compatibles.
type DamageProfileId = "top-dps" | "long-range" | "balanced" | "all";

interface DamageProfileOption {
  id: DamageProfileId;
  label: string;
  description: string;
}

const DAMAGE_PROFILES: DamageProfileOption[] = [
  { id: "top-dps", label: "Máximo DPS", description: "Las 3 armas con más DPS" },
  {
    id: "long-range",
    label: "Alcance largo",
    description: "Las 3 con mayor alcance",
  },
  { id: "balanced", label: "Equilibrado", description: "Mix de DPS y alcance" },
  { id: "all", label: "Todas", description: "Todas las compatibles" },
];

export default function ShipStatsVisualizations({ ship }: ShipStatsVisualizationsProps) {
  const { data: components = [] } = useShipComponents(ship);
  const [profile, setProfile] = useState<DamageProfileId>("top-dps");

  const weaponComponents = useMemo(
    () =>
      components.filter(
        (c) => c.type === "Weapon" && c.stats.dps && c.stats.dps > 0
      ),
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

  // Selección de armas según el perfil elegido
  const selectedWeapons = useMemo(() => {
    const sorted = [...weaponComponents];
    if (profile === "top-dps") {
      sorted.sort((a, b) => (b.stats.dps || 0) - (a.stats.dps || 0));
      return sorted.slice(0, 3);
    }
    if (profile === "long-range") {
      sorted.sort((a, b) => (b.stats.range || 0) - (a.stats.range || 0));
      return sorted.slice(0, 3);
    }
    if (profile === "balanced") {
      // Puntaje compuesto: 60% DPS + 40% alcance normalizado
      const maxDps = Math.max(...sorted.map((c) => c.stats.dps || 0), 1);
      const maxRange = Math.max(...sorted.map((c) => c.stats.range || 0), 1);
      sorted.sort((a, b) => {
        const sa = ((a.stats.dps || 0) / maxDps) * 0.6 + ((a.stats.range || 0) / maxRange) * 0.4;
        const sb = ((b.stats.dps || 0) / maxDps) * 0.6 + ((b.stats.range || 0) / maxRange) * 0.4;
        return sb - sa;
      });
      return sorted.slice(0, 3);
    }
    // all
    return sorted;
  }, [weaponComponents, profile]);

  const weaponProfiles = useMemo(
    () =>
      selectedWeapons.map((c, i) => ({
        name: c.name,
        type: c.stats.damage_type || "ballistic",
        dps: c.stats.dps || 0,
        range: c.stats.range || 500,
        falloffStart: c.stats.range ? Math.round(c.stats.range * 0.6) : 300,
        falloffEnd: c.stats.range ? Math.round(c.stats.range * 1.2) : 600,
        color: WEAPON_COLORS[i % WEAPON_COLORS.length],
      })),
    [selectedWeapons]
  );

  const highlightComponent = useMemo(() => {
    if (weaponComponents.length === 0) return null;
    return weaponComponents.reduce(
      (best, c) => ((c.stats.dps || 0) > (best.stats.dps || 0) ? c : best),
      weaponComponents[0]
    );
  }, [weaponComponents]);

  // Specs agrupadas por categoría
  const specGroups: {
    title: string;
    icon: typeof Gauge;
    accent: string;
    items: { label: string; value: string; icon: typeof Gauge; color: string }[];
  }[] = [
    {
      title: "Rendimiento",
      icon: Gauge,
      accent: "var(--sc-quantum-500)",
      items: [
        {
          label: "Velocidad SCM",
          value: `${ship.scm_speed || 0} m/s`,
          icon: Gauge,
          color: "text-blue-400",
        },
        {
          label: "Velocidad Máx",
          value: `${ship.max_speed || 0} m/s`,
          icon: Rocket,
          color: "text-blue-300",
        },
      ],
    },
    {
      title: "Supervivencia",
      icon: Shield,
      accent: "var(--sc-shield-500)",
      items: [
        {
          label: "HP Casco",
          value: `${(ship.hull_hp || 0).toLocaleString()}`,
          icon: Shield,
          color: "text-emerald-400",
        },
        {
          label: "HP Escudos",
          value: `${(ship.shield_hp || 0).toLocaleString()}`,
          icon: Shield,
          color: "text-cyan-400",
        },
      ],
    },
    {
      title: "Capacidad",
      icon: Package,
      accent: "var(--sc-engine-500)",
      items: [
        {
          label: "Tripulación",
          value: String(ship.crew),
          icon: Users,
          color: "text-red-400",
        },
        {
          label: "Carga",
          value: `${ship.cargo_capacity} SCU`,
          icon: Package,
          color: "text-amber-400",
        },
        {
          label: "Masa",
          value: `${(ship.mass || 0).toLocaleString()} kg`,
          icon: Weight,
          color: "text-slate-300",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Specs ordenadas por categoría */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5" style={{ color: "var(--sc-quantum-500)" }} />
            Especificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {specGroups.map((group) => (
            <div key={group.title}>
              <div className="flex items-center gap-2 mb-2">
                <group.icon
                  className="h-4 w-4"
                  style={{ color: group.accent }}
                />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.items.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30"
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </div>
                      <div className={`font-mono font-bold text-sm ${stat.color}`}>
                        {stat.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crosshair className="h-5 w-5" style={{ color: "var(--sc-engine-500)" }} />
                Perfil de Daño
              </CardTitle>
              <Select
                value={profile}
                onValueChange={(v) => setProfile(v as DamageProfileId)}
              >
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_PROFILES.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium">{p.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {p.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
