import { getDashboardStats, getTopShipsByDps, getManufacturerDistribution, getRecentLoadouts } from "@/lib/db/queries";
import { getGameVersionsFromDb, getSelectedVersion, getSyncMeta, getShipCount } from "@/lib/db/sync";
import { syncDataForVersion, syncGameVersions, checkVersionAndSync } from "@/lib/db/sync";
import StatCard from "@/components/dashboard/StatCard";
import PieChartFabricants from "@/components/dashboard/PieChartFabricants";
import TopDpsTable from "@/components/dashboard/TopDpsTable";
import VersionChanges from "@/components/dashboard/VersionChanges";
import RecentLoadouts from "@/components/dashboard/RecentLoadouts";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { Rocket, Wrench, Factory, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  // Auto-sync if DB is empty (Render cold start)
  const shipCount = getShipCount();
  if (shipCount === 0) {
    try {
      console.log("Dashboard: DB empty, triggering auto-sync...");
      await syncGameVersions();
      const versionCheck = await checkVersionAndSync();
      const version = versionCheck.currentVersion;
      if (version) {
        await syncDataForVersion(version);
        console.log("Dashboard: Auto-sync completed");
      }
    } catch (e) {
      console.error("Dashboard: Auto-sync failed:", e);
    }
  }

  const stats = getDashboardStats();
  const topDps = getTopShipsByDps(5);
  const manufacturers = getManufacturerDistribution();
  const recentLoadouts = getRecentLoadouts(4);
  const versions = getGameVersionsFromDb() as any[];
  const selectedVersion = getSelectedVersion();

  const currentVersion = versions.find((v: any) => v.code === selectedVersion);
  const previousVersion = versions.find((v: any) => v.code !== selectedVersion && v.is_synced);

  const pieData = manufacturers.map((m: any) => ({
    name: m.name,
    count: m.count,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Stat Cards */}
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartFabricants data={pieData} />
          <TopDpsTable ships={topDps} />
        </div>

        {/* Version Changes */}
        {previousVersion && currentVersion && (
          <VersionChanges
            fromVersion={previousVersion.code}
            toVersion={currentVersion.code}
            shipDelta={0}
            componentDelta={0}
            weaponDelta={0}
          />
        )}

        {/* Loadouts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentLoadouts loadouts={recentLoadouts} />
          <ActivityFeed entries={[]} />
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </main>
    </div>
  );
}
