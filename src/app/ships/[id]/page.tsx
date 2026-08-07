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

        {/* ===== FICHA UNIFICADA ===== */}
        <div className="glass-panel border-border/40 rounded-2xl overflow-hidden">
          {/* Header compacto */}
          <div className="p-5 border-b border-border/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
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

              {ship.price_auec ? (
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Precio</div>
                  <div className="font-mono font-bold text-emerald-400">{ship.price_auec.toLocaleString()} aUEC</div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Cuerpo: holograma (specs abajo en sección dedicada) */}
          <div className="p-5">
            <div className="flex items-center justify-center">
              <HologramImage ship={ship} className="w-full max-w-[520px]" />
            </div>
          </div>
        </div>

        {/* ===== SECCIONES RESTANTES ===== */}
        <ShipBuyLocations locations={locations} wikelo={wikelo} />

        <ShipStatsVisualizations ship={ship} />
        
        <LoadoutBuilder ship={ship} />
      </main>
    </div>
  );
}
