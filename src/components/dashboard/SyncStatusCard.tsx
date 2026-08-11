"use client";

import { useSyncStatus } from "@/lib/api/client";
import { CircleCheck, CircleAlert, Loader2, Satellite } from "lucide-react";

interface SyncStatusCardProps {
  initialWikiVersion?: string;
  initialLastSync?: string;
  initialSyncStatus?: string;
}

export default function SyncStatusCard({
  initialWikiVersion = "—",
  initialLastSync = "—",
  initialSyncStatus = "unknown",
}: SyncStatusCardProps) {
  const { data: status, isLoading } = useSyncStatus();

  const wikiVersion = status?.meta?.wiki_version || initialWikiVersion;
  const syncStatus = status?.meta?.sync_status || initialSyncStatus;

  const lastSyncRaw = status?.meta?.last_sync_at || "";
  const lastSync = lastSyncRaw
    ? new Date(`${lastSyncRaw.replace(" ", "T")}Z`).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : initialLastSync;

  const statusLabel =
    syncStatus === "ok"
      ? "Sincronizado"
      : syncStatus === "syncing"
        ? "Sincronizando"
        : syncStatus === "partial"
          ? "Sincronización parcial"
          : syncStatus === "error"
            ? "Error"
            : "Sin estado";
  const statusIsHealthy = syncStatus === "ok";

  return (
    <div className="product-card overflow-hidden relative min-h-[170px]">
      <div
        className="data-grid-line pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(120% 120% at 100% 0%, color-mix(in oklch, var(--sc-quantum-500) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="relative p-5 sm:p-7 flex flex-wrap items-center justify-between gap-6">
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
              <span className="section-kicker">Dataset activo</span>
            </p>
            <p className="text-2xl sm:text-3xl font-bold font-heading tracking-tight truncate mt-1">
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
            <p className="section-kicker text-muted-foreground">Última sincronización</p>
            <p className="font-mono text-sm font-semibold">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin inline" />
              ) : (
                lastSync
              )}
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full border font-medium text-sm"
            style={{
              color: statusIsHealthy ? "var(--sc-status-success)" : "var(--sc-status-warning)",
              background: statusIsHealthy
                ? "color-mix(in oklch, var(--sc-status-success) 12%, transparent)"
                : "color-mix(in oklch, var(--sc-status-warning) 12%, transparent)",
              borderColor: statusIsHealthy
                ? "color-mix(in oklch, var(--sc-status-success) 35%, transparent)"
                : "color-mix(in oklch, var(--sc-status-warning) 35%, transparent)",
            }}
          >
            {statusIsHealthy ? (
              <CircleCheck className="h-4 w-4" />
            ) : (
              <CircleAlert className="h-4 w-4" />
            )}
            {statusLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
