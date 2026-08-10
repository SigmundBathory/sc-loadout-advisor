import { getShipById, getShipBuyLocationsFuzzy, getWikeloShipFuzzy } from "@/lib/db/queries";
import LoadoutBuilder from "@/components/loadout/LoadoutBuilder";
import HologramImage from "@/components/ships/HologramImage";
import Breadcrumb from "@/components/Breadcrumb";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Gauge,
  Shield,
  Users,
  Package,
  Weight,
  Rocket,
} from "lucide-react";

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
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Breadcrumb items={[{ label: "Naves", href: "/ships" }, { label: ship.name }]} />

        {/* ===== HEADER UNIFICADO ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/ships"
              className="p-2 rounded-xl bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="space-y-0.5">
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
          </div>

          {ship.price_auec ? (
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Precio</div>
              <div className="font-mono font-bold text-emerald-400">{ship.price_auec.toLocaleString()} aUEC</div>
            </div>
          ) : null}
        </div>

        {/* ===== HERO: IMAGEN + SPECS CLAVE ===== */}
        <div className="product-card overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Imagen holográfica */}
            <div className="md:w-[400px] shrink-0 p-5 sm:p-7 flex items-center justify-center bg-muted/10 border-b md:border-b-0 md:border-r border-border/30">
              <HologramImage ship={ship} className="w-full max-w-[340px]" />
            </div>

            {/* Specs clave */}
            <div className="flex-1 p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Gauge className="h-4 w-4 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">SCM</div>
                    <div className="font-mono font-bold text-sm text-blue-400">{ship.scm_speed || 0} m/s</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Rocket className="h-4 w-4 text-blue-300" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Máxima</div>
                    <div className="font-mono font-bold text-sm text-blue-300">{ship.max_speed || 0} m/s</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">HP Casco</div>
                    <div className="font-mono font-bold text-sm text-emerald-400">{(ship.hull_hp || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">HP Escudos</div>
                    <div className="font-mono font-bold text-sm text-cyan-400">{(ship.shield_hp || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Users className="h-4 w-4 text-red-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Tripulación</div>
                    <div className="font-mono font-bold text-sm text-red-400">{ship.crew}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                  <Package className="h-4 w-4 text-amber-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Carga</div>
                    <div className="font-mono font-bold text-sm text-amber-400">{ship.cargo_capacity} SCU</div>
                  </div>
                </div>
              </div>
              {(ship.mass || 0) > 0 && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 w-fit">
                  <Weight className="h-4 w-4 text-slate-300" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Masa</div>
                    <div className="font-mono font-bold text-sm text-slate-300">{(ship.mass || 0).toLocaleString()} kg</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== LOADOUT BUILDER (feature principal) ===== */}
        <LoadoutBuilder
          ship={ship}
          locations={locations}
          wikelo={wikelo}
        />
      </main>
    </div>
  );
}
