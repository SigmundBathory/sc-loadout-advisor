import ShipSelector from "@/components/ships/ShipSelector";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Rocket } from "lucide-react";

export default function ShipsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Explorador de Naves"
        subtitle="Filtra, ordena y compara la flota del Verse"
        icon={<Rocket className="h-5 w-5" />}
      />
      <ShipSelector />
    </PageContainer>
  );
}
