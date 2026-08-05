"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface ShipDps {
  id: string;
  name: string;
  dps: number;
  classification: string;
  image_url: string;
}

const classColors: Record<string, string> = {
  Fighter: "bg-red-500/20 text-red-400 border-red-500/30",
  Bomber: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Multi Crew": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Freight: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Exploration: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Stealth: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Industrial: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function TopDpsTable({ ships }: { ships: ShipDps[] }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Top 5 DPS</h3>
      <div className="space-y-3">
        {ships.map((ship, i) => (
          <Link
            key={ship.id}
            href={`/ships/${ship.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
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
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 mt-0.5 ${classColors[ship.classification] || ""}`}
              >
                {ship.classification}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-primary">{ship.dps.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">DPS</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
