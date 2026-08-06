import { getShipById, getShipBuyLocationsFuzzy, getWikeloShipFuzzy } from "@/lib/db/queries";
import LoadoutBuilder from "@/components/loadout/LoadoutBuilder";
import ShipBuyLocations from "@/components/ships/ShipBuyLocations";
import ShipStatsVisualizations from "@/components/stats/ShipStatsVisualizations";
import HologramImage from "@/components/ships/HologramImage";
import ClientHeader from "@/components/layout/ClientHeader";
import Breadcrumb from "@/components/Breadcrumb";
import { notFound } from "next/navigation";

interface ShipPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShipPage({ params }: ShipPageProps) {
  const { id } = await params;
  const ship = getShipById(id);

  if (!ship) {
    notFound();
  }

  const locations = getShipBuyLocationsFuzzy(ship.name);
  const wikelo = getWikeloShipFuzzy(ship.name);

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader 
        title={ship.name} 
        backHref="/ships" 
        backLabel="Naves" 
      />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Breadcrumb items={[{ label: "Naves", href: "/ships" }, { label: ship.name }]} />

        {/* Compact Header: Name + Classification + Key Stats */}
        <div className="glass-panel border-border/40 rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{ship.name}</h1>
                <span className="px-2.5 py-1 text-xs font-mono bg-primary/10 text-primary rounded-full border border-primary/20">
                  {ship.classification || "General"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Fabricante: <span className="text-foreground">{ship.manufacturer.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {[
                { label: "SCM", value: `${ship.scm_speed || 0} m/s`, color: "text-blue-400" },
                { label: "HP Casco", value: `${(ship.hull_hp || 0).toLocaleString()}`, color: "text-emerald-400" },
                { label: "Escudos", value: `${(ship.shield_hp || 0).toLocaleString()}`, color: "text-cyan-400" },
                { label: "Tripulación", value: String(ship.crew), color: "text-red-400" },
                { label: "Carga", value: `${ship.cargo_capacity} SCU`, color: "text-amber-400" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <span className={`font-mono font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hologram - centered below header */}
        <div className="flex justify-center">
          <HologramImage ship={ship} size={420} />
        </div>

        {/* Buy Locations */}
        <ShipBuyLocations locations={locations} wikelo={wikelo} />

        {/* Phase 3 Visualizations */}
        <ShipStatsVisualizations ship={ship} />

        {/* Loadout Builder */}
        <LoadoutBuilder ship={ship} />
      </main>
    </div>
  );
}
