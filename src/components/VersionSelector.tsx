"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Download } from "lucide-react";

interface GameVersion {
  code: string;
  channel: string;
  released_at: string;
  is_default: number;
  is_synced: number;
  last_synced_at: string;
}

interface VersionSelectorProps {
  onVersionChange?: (version: string) => void;
  onSyncRequired?: (version: string) => void;
}

export default function VersionSelector({ onVersionChange, onSyncRequired }: VersionSelectorProps) {
  const [versions, setVersions] = useState<GameVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, []);

  async function fetchVersions() {
    try {
      const res = await fetch("/api/versions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        setSelectedVersion(data.selectedVersion || "");
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVersionChange(version: string) {
    setSelectedVersion(version);
    
    const versionData = versions.find(v => v.code === version);
    if (versionData?.is_synced) {
      // Version already synced, just switch to it
      const res = await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSyncError(data.error || `No se pudo seleccionar la versión (HTTP ${res.status})`);
        return;
      }
      onVersionChange?.(version);
      window.location.reload();
    } else {
      // Version not synced: keep the callback for embedded consumers, but make
      // the standalone Navbar selector work as well.
      if (onSyncRequired) onSyncRequired(version);
      else await handleSyncVersion(version);
    }
  }

  async function handleSyncVersion(version: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ version }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `No se pudo sincronizar la versión (HTTP ${res.status})`);
      }
      await fetchVersions();
      window.location.reload();
    } catch (error) {
      console.error("Failed to sync version:", error);
      setSyncError(error instanceof Error ? error.message : "Error durante la sincronización");
    } finally {
      setSyncing(false);
    }
  }

  function formatVersion(code: string, channel?: string) {
    const match = code.match(/^(\d+\.\d+)/);
    const isPtu = channel?.toLowerCase() === "ptu" || code.toUpperCase().includes("PTU");
    const label = match ? `Alpha ${match[1]}` : code;
    return isPtu ? `${label} PTU` : `${label} LIVE`;
  }

  if (loading) {
    return (
      <Badge variant="outline" className="font-mono animate-pulse">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Cargando...
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedVersion} onValueChange={(value) => value && handleVersionChange(value)}>
        <SelectTrigger className="w-[180px] h-9 font-mono text-sm">
          <SelectValue placeholder="Seleccionar version" />
        </SelectTrigger>
        <SelectContent>
          {versions.map((v) => (
            <SelectItem key={v.code} value={v.code} className="font-mono text-sm">
              <div className="flex items-center gap-2">
                <span>{formatVersion(v.code, v.channel)}</span>
                {v.is_default ? (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Default
                  </Badge>
                ) : null}
                {v.is_synced ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : null}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedVersion && (
        <div className="text-xs text-muted-foreground hidden sm:block">
          {syncError ? (
            <span className="text-red-400 max-w-[240px] truncate" title={syncError}>⚠ {syncError}</span>
          ) : versions.find(v => v.code === selectedVersion)?.is_synced ? (
            <span className="text-green-500">✓ Sincronizado</span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-yellow-500 hover:text-yellow-400"
              onClick={(e) => handleSyncVersion(selectedVersion, e)}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              Sincronizar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
