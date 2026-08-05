"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react";

interface SyncStatus {
  meta: {
    wiki_version: string;
    uex_version: string;
    last_sync_at: string;
    sync_status: string;
    selected_wiki_version: string;
  };
  shipCount: number;
  componentCount: number;
  selectedVersion: string;
}

export default function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch sync status:", e);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("Iniciando sincronizacion...");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      setSyncMessage(data.message || "Sincronizacion completada");
      await fetchStatus();
    } catch (e) {
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
