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
import SyncStatusCard from "@/components/dashboard/SyncStatusCard";
import { Reveal } from "@/components/motion/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Rocket,
  Wrench,
  Factory,
  Calendar,
  Radio,
} from "lucide-react";
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
  code: string;
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
    code: m.code,
    name: m.name,
    count: m.count,
  }));

  if (shipCount === 0) {
    return (
      <PageContainer>
        <SyncPanel />
      </PageContainer>
    );
  }

  const wikiVersion = stats.meta?.wiki_version || selectedVersion || "—";

  const lastSync = stats.meta?.last_sync_at
    ? new Date(`${stats.meta.last_sync_at.replace(" ", "T")}Z`).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
  const syncStatus = stats.meta?.sync_status || "unknown";

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard del Verse"
        subtitle="Estado de la flota, componentes y sincronización de Star Citizen"
        action={
          <Link href="/ships">
            <Button size="sm" className="gap-1.5">
              <Rocket className="h-3.5 w-3.5" />
              Explorar Naves
            </Button>
          </Link>
        }
      />

      {/* ===== Hero: estado de la versión / sync ===== */}
      <Reveal y={10}>
        <SyncStatusCard
          initialWikiVersion={wikiVersion}
          initialLastSync={lastSync}
          initialSyncStatus={syncStatus}
        />
      </Reveal>

      {/* ===== Stat cards ===== */}
      <Reveal delay={0.06}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Rocket className="h-5 w-5" />}
            label="Naves en la base"
            value={stats.ships}
            subtitle={wikiVersion.split("-")[0]}
            color="text-[var(--sc-brand-primary)]"
            glow="var(--sc-brand-primary)"
          />
          <StatCard
            icon={<Wrench className="h-5 w-5" />}
            label="Componentes"
            value={stats.components}
            color="text-[var(--sc-brand-secondary)]"
            glow="var(--sc-brand-secondary)"
          />
          <StatCard
            icon={<Factory className="h-5 w-5" />}
            label="Fabricantes"
            value={stats.manufacturers}
            color="text-[var(--sc-status-success)]"
            glow="var(--sc-status-success)"
          />
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            label="Loadouts guardados"
            value={stats.loadouts}
            color="text-[var(--sc-status-danger)]"
            glow="var(--sc-status-danger)"
          />
        </div>
      </Reveal>

      {/* ===== Gráficos principales ===== */}
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartFabricants data={pieData} />
          <TopDpsTable ships={topDps} />
        </div>
      </Reveal>

      {previousVersion && currentVersion && (
        <Reveal delay={0.14}>
          <VersionChanges
            fromVersion={previousVersion.code}
            toVersion={currentVersion.code}
            shipDelta={versionChanges?.shipDelta ?? 0}
            componentDelta={versionChanges?.componentDelta ?? 0}
            weaponDelta={versionChanges?.weaponDelta ?? 0}
          />
        </Reveal>
      )}

      {/* ===== Loadouts recientes + mantenimiento ===== */}
      <Reveal delay={0.18}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentLoadouts loadouts={recentLoadouts} />
            <QuickActions />
          </div>
          <div className="space-y-6">
            <SyncHistory />
            <div className="product-card p-5 flex items-start gap-3">
              <Radio className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="text-foreground font-medium mb-1">¿Datos desactualizados?</p>
                Usa el Centro de Actualizaciones en la barra superior para forzar una
                sincronización de la versión activa.
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </PageContainer>
  );
}
