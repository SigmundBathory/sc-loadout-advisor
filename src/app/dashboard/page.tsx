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
import { Reveal } from "@/components/motion/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Rocket,
  Wrench,
  Factory,
  Calendar,
  CircleCheck,
  CircleAlert,
  Radio,
  Satellite,
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
      <PageContainer>
        <SyncPanel />
      </PageContainer>
    );
  }

  const wikiVersion = stats.meta?.wiki_version || selectedVersion || "—";
  const isOk = stats.meta?.sync_status === "ok";
  const lastSync = stats.meta?.last_sync_at
    ? new Date(stats.meta.last_sync_at).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

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
        <div className="glass-panel rounded-2xl border-border/40 overflow-hidden relative">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(120% 120% at 100% 0%, color-mix(in oklch, var(--sc-quantum-500) 22%, transparent), transparent 60%)",
            }}
          />
          <div className="relative p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl border"
                style={{
                  color: "var(--sc-brand-primary)",
                  background: "color-mix(in oklch, var(--sc-brand-primary) 14%, transparent)",
                  borderColor: "color-mix(in oklch, var(--sc-brand-primary) 35%, transparent)",
                }}
              >
                <Satellite className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Versión activa
                </p>
                <p className="text-2xl font-bold font-heading tracking-tight truncate">
                  Alpha {wikiVersion.split("-")[0]}{" "}
                  <span
                    className="text-sm font-medium align-middle ml-1 px-2 py-0.5 rounded-full"
                    style={{
                      color: wikiVersion.includes("PTU")
                        ? "var(--sc-brand-secondary)"
                        : "var(--sc-status-success)",
                      background: wikiVersion.includes("PTU")
                        ? "color-mix(in oklch, var(--sc-brand-secondary) 14%, transparent)"
                        : "color-mix(in oklch, var(--sc-status-success) 14%, transparent)",
                    }}
                  >
                    {wikiVersion.includes("PTU") ? "PTU" : "LIVE"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Última sincronización
                </p>
                <p className="font-mono text-sm font-semibold">{lastSync}</p>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full border font-medium text-sm"
                style={{
                  color: isOk ? "var(--sc-status-success)" : "var(--sc-status-warning)",
                  background: isOk
                    ? "color-mix(in oklch, var(--sc-status-success) 12%, transparent)"
                    : "color-mix(in oklch, var(--sc-status-warning) 12%, transparent)",
                  borderColor: isOk
                    ? "color-mix(in oklch, var(--sc-status-success) 35%, transparent)"
                    : "color-mix(in oklch, var(--sc-status-warning) 35%, transparent)",
                }}
              >
                {isOk ? (
                  <CircleCheck className="h-4 w-4" />
                ) : (
                  <CircleAlert className="h-4 w-4" />
                )}
                {isOk ? "Sincronizado" : "Pendiente"}
              </div>
            </div>
          </div>
        </div>
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
            <div className="glass-panel rounded-2xl border-border/40 p-5 flex items-start gap-3">
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
