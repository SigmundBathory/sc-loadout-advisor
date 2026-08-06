import { getShipById, getShipBuyLocationsFuzzy, getWikeloShipFuzzy } from "@/lib/db/queries";
import LoadoutBuilder from "@/components/loadout/LoadoutBuilder";
import ShipBuyLocations from "@/components/ships/ShipBuyLocations";
import ShipHologramWrapper from "@/components/ships/ShipHologramWrapper";
import ShipStatsVisualizations from "@/components/stats/ShipStatsVisualizations";
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
        
        {/* Ship Hologram Card */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Visualización 3D</h2>
            <span className="px-2 py-1 text-xs font-mono bg-primary/10 text-primary rounded-full">
              {ship.classification}
            </span>
          </div>
          <ShipHologramWrapper ship={ship} size={380} />
        </div>

        <ShipBuyLocations locations={locations} wikelo={wikelo} />

        <ShipStatsVisualizations ship={ship} />
        
        <LoadoutBuilder ship={ship} />
      </main>
    </div>
  );
}