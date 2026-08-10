"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Sword, Shield, Rocket } from "lucide-react";

interface ShipCombat {
  id: string;
  name: string;
  classification: string;
  image_url: string;
  mass: number;
  hull_hp: number;
  shield_hp: number;
  weapons: number;
  shields: number;
  missiles: number;
}

function getMassTier(mass: number): string {
  if (!Number.isFinite(mass) || mass <= 0) return "Sin datos";
  if (mass > 10000000) return "Capital";
  if (mass > 1000000) return "Large";
  if (mass > 100000) return "Medium";
  return "Small";
}

function getTierColor(mass: number): string {
  if (mass > 10000000) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (mass > 1000000) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (mass > 100000) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return "bg-green-500/20 text-green-400 border-green-500/30";
}

function formatMass(mass: number): string {
  if (!Number.isFinite(mass) || mass <= 0) return "No disponible";
  if (mass >= 1000000) return `${(mass / 1000000).toFixed(1)}M`;
  if (mass >= 1000) return `${(mass / 1000).toFixed(0)}K`;
  return mass.toFixed(0);
}

export default function TopDpsTable({ ships }: { ships: ShipCombat[] }) {
  return (
    <div className="product-card p-5 sm:p-6">
      <p className="section-kicker">Lectura táctica</p>
      <h3 className="text-base font-semibold text-foreground mt-1 mb-1">Top 5 capacidad de combate</h3>
      <p className="text-[11px] text-muted-foreground/70 mb-4">Ordenado por hardpoints observados, no por DPS real.</p>
      <div className="space-y-3">
        <Stagger className="space-y-3">
          {ships.map((ship, i) => (
            <StaggerItem key={ship.id}>
              <Link
                href={`/ships/${ship.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/45 transition-all group"
              >
                <span className="text-lg font-bold text-muted-foreground w-6 text-center font-mono">
                  {i + 1}
                </span>
                {ship.image_url && (
                  <img
                    src={ship.image_url}
                    alt={ship.name}
                    className="w-10 h-10 rounded-lg object-cover bg-muted"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {ship.name}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${getTierColor(ship.mass)}`}
                    >
                      {getMassTier(ship.mass)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-muted/50"
                    >
                      {ship.classification}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1" title="Armas">
                    <Sword className="h-3 w-3" />
                    <span className="font-mono">{ship.weapons}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Escudos">
                    <Shield className="h-3 w-3" />
                    <span className="font-mono">{ship.shields}</span>
                  </div>
                  {ship.missiles > 0 && (
                    <div className="flex items-center gap-1" title="Misiles">
                      <Rocket className="h-3 w-3" />
                      <span className="font-mono">{ship.missiles}</span>
                    </div>
                  )}
                  <div className="text-right min-w-[3rem]" title="Masa">
                    <span className="font-mono text-[10px]">{formatMass(ship.mass)}</span>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
