import { getDashboardStats, getTopShipsByDps, getManufacturerDistribution, getRecentLoadouts, getVersionChanges } from "@/lib/db/queries";
import { getGameVersionsFromDb, getSelectedVersion, getShipCount } from "@/lib/db/sync";
import StatCard from "@/components/dashboard/StatCard";
import PieChartFabricants from "@/components/dashboard/PieChartFabricants";
import TopDpsTable from "@/components/dashboard/TopDpsTable";
import VersionChanges from "@/components/dashboard/VersionChanges";
import RecentLoadouts from "@/components/dashboard/RecentLoadouts";
import QuickActions from "@/components/dashboard/QuickActions";
import SyncPanel from "@/components/dashboard/SyncPanel";
import SyncHistory from "@/components/dashboard/SyncHistory";
import { Rocket, Wrench, Factory, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface GameVersionRow {
  code: string;
  channel?: string;
  released_at?: string;
  is_default?: number;
  is_synced?: number;
  last_synced_at?: string;
}

interface ManufacturerRow {
  name: string;
  count: number;
}

export default async function DashboardPage() {
  const shipCount = getShipCount();
  const stats = getDashboardStats();
  const topDps = getTopShipsByDps(5);
  const manufacturers = getManufacturerDistribution();
  const recentLoadouts = getRecentLoadouts(4);
  const versions = getGameVersionsFromDb() as GameVersionRow[];
  const selectedVersion = getSelectedVersion();

  const currentVersion = versions.find((v) => v.code === selectedVersion);
  const previousVersion = versions.find((v) => v.code !== selectedVersion && v.is_synced);

  const versionChanges =
    currentVersion && previousVersion
      ? getVersionChanges(currentVersion.code, previousVersion.code)
      : null;

  const pieData = (manufacturers as ManufacturerRow[]).map((m) => ({
    name: m.name,
    count: m.count,
  }));

  if (shipCount === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <span className="text-primary">⬡</span> SC Loadout Advisor
              </h1>
              <p className="text-sm text-muted-foreground">
                Dashboard de Star Citizen Loadouts
              </p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <SyncPanel />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className="text-primary">⬡</span> SC Loadout Advisor
            </h1>
            <p className="text-sm text-muted-foreground">
              Dashboard de Star Citizen Loadouts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full font-mono">
              {selectedVersion ? selectedVersion.split("-")[0] : "—"} {selectedVersion?.includes("PTU") ? "PTU" : "LIVE"}
            </span>
            <Link href="/ships">
              <Button size="sm" className="gap-1">
                <Rocket className="h-3 w-3" />
                Explorar Naves
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Rocket className="h-5 w-5" />}
            label="Naves"
            value={stats.ships}
            subtitle={stats.meta?.wiki_version?.split("-")[0]}
          />
          <StatCard
            icon={<Wrench className="h-5 w-5" />}
            label="Componentes"
            value={stats.components}
          />
          <StatCard
            icon={<Factory className="h-5 w-5" />}
            label="Fabricantes"
            value={stats.manufacturers}
          />
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            label="Última Sync"
            value={stats.meta?.last_sync_at ? new Date(stats.meta.last_sync_at).toLocaleDateString("es-ES") : "—"}
            subtitle={stats.meta?.sync_status === "ok" ? "✓ OK" : "⚠ Pendiente"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartFabricants data={pieData} />
          <TopDpsTable ships={topDps} />
        </div>

        {previousVersion && currentVersion && (
          <VersionChanges
            fromVersion={previousVersion.code}
            toVersion={currentVersion.code}
            shipDelta={versionChanges?.shipDelta ?? 0}
            componentDelta={versionChanges?.componentDelta ?? 0}
            weaponDelta={versionChanges?.weaponDelta ?? 0}
          />
        )}

        <RecentLoadouts loadouts={recentLoadouts} />

        <SyncHistory />

        <QuickActions />
      </main>
    </div>
  );
}
