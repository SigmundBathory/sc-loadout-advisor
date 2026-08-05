import { getShipById, getShipBuyLocationsFuzzy } from "@/lib/db/queries";
import LoadoutBuilder from "@/components/loadout/LoadoutBuilder";
import ShipBuyLocations from "@/components/ships/ShipBuyLocations";
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

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader 
        title={ship.name} 
        backHref="/ships" 
        backLabel="Naves" 
      />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Breadcrumb items={[{ label: "Naves", href: "/ships" }, { label: ship.name }]} />
        
        {locations.length > 0 && (
          <ShipBuyLocations locations={locations} />
        )}
        
        <LoadoutBuilder ship={ship} />
      </main>
    </div>
  );
}
