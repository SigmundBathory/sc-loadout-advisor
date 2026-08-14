"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";
import { useSyncStatus } from "@/lib/api/client";
import { UpdateNotificationModal, VersionNotificationBanner } from "@/components/layout/UpdateModal";

export default function SyncIndicator() {
  const { data: status, refetch, isLoading } = useSyncStatus();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [adminToken, setAdminToken] = useState(() =>
    typeof window === "undefined" ? "" : window.sessionStorage.getItem("sc-admin-token") || ""
  );
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("Iniciando sincronizacion...");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify({ force: true }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status} en la sincronización`);
      }
      setSyncMessage(data.message || "Sincronizacion completada");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sync"] }),
        queryClient.invalidateQueries({ queryKey: ["ships"] }),
        queryClient.invalidateQueries({ queryKey: ["components"] }),
        queryClient.invalidateQueries({ queryKey: ["loadouts"] }),
      ]);
      await refetch();
      router.refresh();
      setShowUpdateModal(false);
      setBannerMessage("");
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Error en la sincronizacion");
    }
    setSyncing(false);
    setTimeout(() => setSyncMessage(""), 5000);
  }

  // Verificar si hay una nueva versión disponible
  useEffect(() => {
    if (!status) return;

    const currentWikiVersion = status.meta?.wiki_version || "";
    const selectedVersion = status.selectedVersion || status.meta?.selected_wiki_version || "";

    // Si hay una nueva versión disponible, mostrar notificación
    if (currentWikiVersion && selectedVersion && currentWikiVersion !== selectedVersion) {
      const newVersionLabel = currentWikiVersion.split("-")[0];
      const currentLabel = selectedVersion.split("-")[0];

      if (newVersionLabel !== currentLabel) {
        const timer = window.setTimeout(() => {
          setBannerMessage(`Nueva versión detectada: ${newVersionLabel} - Sincronizando datos...`);
          setShowUpdateModal(true);
        }, 0);
        return () => window.clearTimeout(timer);
      }
    }
  }, [status]);

  const selectedVersion = status?.selectedVersion || status?.meta?.selected_wiki_version || "";
  const versionLabel = selectedVersion ? selectedVersion.split("-")[0] : "";
  const currentWikiVersion = status?.meta?.wiki_version || "";
  const isUpToDate =
    status?.meta?.wiki_version && status.shipCount > 0 && status.meta.sync_status === "ok" &&
    currentWikiVersion === (status.selectedVersion || status.meta?.selected_wiki_version || "");

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Version badge */}
        {versionLabel && (
          <Badge variant="outline" className="font-mono text-xs">
            v{versionLabel}
          </Badge>
        )}

        {/* Status indicator */}
        {syncing ? (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sincronizando...
          </Badge>
        ) : isLoading ? (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Cargando...
          </Badge>
        ) : isUpToDate ? (
          <Badge variant="default" className="gap-1 bg-green-600">
            <Check className="h-3 w-3" />
            Actualizado
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Desactualizado
          </Badge>
        )}

        {/* Data counts */}
        {status && status.shipCount > 0 && (
          <span className="text-xs text-muted-foreground hidden md:inline">
            {status.shipCount} naves | {status.componentCount} componentes
          </span>
        )}

        {/* Sync credentials + button */}
        <input
          type="password"
          value={adminToken}
          onChange={(event) => {
            const value = event.target.value;
            setAdminToken(value);
            if (value) window.sessionStorage.setItem("sc-admin-token", value);
            else window.sessionStorage.removeItem("sc-admin-token");
          }}
          placeholder="Token admin"
          aria-label="Token de administración para sincronizar"
          className="h-8 w-28 rounded-md border border-border/50 bg-background/60 px-2 text-[10px] text-foreground placeholder:text-muted-foreground/60"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
          className="gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sync..." : "Sync"}
        </Button>

        {/* Sync message */}
        {syncMessage && (
          <span className="text-xs text-muted-foreground">{syncMessage}</span>
        )}
      </div>

      {/* Update Notification Modal */}
      {showUpdateModal && currentWikiVersion && selectedVersion && currentWikiVersion !== selectedVersion && (
        <UpdateNotificationModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          currentVersion={selectedVersion.split("-")[0] || "Desconocida"}
          newVersion={currentWikiVersion.split("-")[0] || "Desconocida"}
          changes={[]}
        />
      )}

      {/* Version Notification Banner */}
      {bannerMessage && (
        <VersionNotificationBanner
          message={bannerMessage}
          onSync={handleSync}
          onDismiss={() => setBannerMessage("")}
        />
      )}
    </>
  );
}
