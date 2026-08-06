"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";
import { useSyncStatus } from "@/lib/api/client";

export default function SyncIndicator() {
  const { data: status, refetch, isLoading } = useSyncStatus();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("Iniciando sincronizacion...");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      setSyncMessage(data.message || "Sincronizacion completada");
      await queryClient.invalidateQueries({ queryKey: ["sync"] });
      await refetch();
    } catch {
      setSyncMessage("Error en la sincronizacion");
    }
    setSyncing(false);
    setTimeout(() => setSyncMessage(""), 5000);
  }

  const selectedVersion = status?.selectedVersion || status?.meta?.selected_wiki_version || "";
  const versionLabel = selectedVersion ? selectedVersion.split("-")[0] : "";
  const isUpToDate =
    status?.meta?.wiki_version && status.shipCount > 0 && status.meta.sync_status === "ok";

  return (
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

      {/* Sync button */}
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
  );
}
