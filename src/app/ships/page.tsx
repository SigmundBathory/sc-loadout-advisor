import ShipSelector from "@/components/ships/ShipSelector";
import ClientHeader from "@/components/layout/ClientHeader";
import Breadcrumb from "@/components/Breadcrumb";

export default function ShipsPage() {
  return (
    <div className="min-h-screen bg-background">
      <ClientHeader 
        title="Naves" 
        backHref="/" 
        backLabel="SC Loadout Advisor" 
      />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Breadcrumb items={[{ label: "Naves" }]} />
        <ShipSelector />
      </main>
    </div>
  );
}
