import { Suspense } from "react";
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
      <Suspense fallback={<div className="flex justify-center p-8"><div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
        <ShipSelector />
      </Suspense>
    </PageContainer>
  );
}
