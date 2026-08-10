"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLoadoutStore } from "@/stores/loadoutStore";
import {
  Download,
  Upload,
  RefreshCw,
  Check,
  Sparkles,
  Terminal,
  ShieldCheck,
  Database,
  ArrowUpCircle,
} from "lucide-react";

interface AppInfo {
  appName: string;
  currentVersion: string;
  dbStats?: {
    shipCount: number;
    componentCount: number;
    lastSyncAt: string | null;
    gameVersion: string;
    syncStatus?: string;
  };
}

interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateModal({ open, onOpenChange }: UpdateModalProps) {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [exportMsg, setExportMsg] = useState("");
  const [adminToken, setAdminToken] = useState(() =>
    typeof window === "undefined" ? "" : window.sessionStorage.getItem("sc-admin-token") || ""
  );

  const { savedLoadouts, setSavedLoadouts } = useLoadoutStore();

  useEffect(() => {
    if (open) {
      fetchAppInfo();
    }
  }, [open]);

  async function fetchAppInfo() {
    setLoading(true);
    try {
      const res = await fetch("/api/app-version");
      const data = await res.json();
      setAppInfo(data);
    } catch (error) {
      console.error("Failed to fetch app version:", error);
    }
    setLoading(false);
  }

  async function handleSyncDatabase() {
    setSyncing(true);
    setSyncMsg("Sincronizando datos de parches en vivo (LIVE / PTU)...");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: adminToken ? { "x-admin-token": adminToken } : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Error HTTP ${res.status}`);
      }
      setSyncMsg(`Sincronización completada: ${data.version || "versión activa"}`);
      await fetchAppInfo();
    } catch (error) {
      setSyncMsg(error instanceof Error ? error.message : "Error durante la sincronización.");
    } finally {
      setSyncing(false);
    }
    setTimeout(() => setSyncMsg(""), 6000);
  }

  function updateAdminToken(value: string) {
    setAdminToken(value);
    if (value) window.sessionStorage.setItem("sc-admin-token", value);
    else window.sessionStorage.removeItem("sc-admin-token");
  }

  function formatSyncDate(value: string | null | undefined): string {
    if (!value) return "Sin sincronizaciones registradas";
    const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
  }

  function handleExportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedLoadouts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sc-loadouts-backup-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportMsg("¡Copia de respaldo exportada con éxito!");
    setTimeout(() => setExportMsg(""), 3000);
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setSavedLoadouts(parsed);
            setExportMsg(`¡Importados ${parsed.length} loadouts respaldados!`);
            setTimeout(() => setExportMsg(""), 4000);
          }
        } catch (err) {
          console.error("Error al importar loadouts:", err);
        }
      };
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-xl border-border/40 space-y-4">
        <DialogHeader className="border-b border-border/30 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ArrowUpCircle className="h-5 w-5 text-primary animate-pulse" />
            Centro de Actualización & Gestión de Versiones
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Comprueba la versión instalada, sincroniza datos de Star Citizen o respalda tus loadouts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-foreground">
                  {appInfo?.appName || "SC Loadout Advisor"}
                </span>
                <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
                  v{appInfo?.currentVersion || "1.2.0"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dataset: <span className="text-foreground font-semibold">{appInfo?.dbStats?.gameVersion || "—"}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Última sincronización: <span className="text-foreground font-mono">{formatSyncDate(appInfo?.dbStats?.lastSyncAt)}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Estado: <span className={appInfo?.dbStats?.syncStatus === "ok" ? "text-emerald-400" : "text-amber-300"}>{appInfo?.dbStats?.syncStatus || "sin estado"}</span>
              </p>
            </div>

            <Button
              size="sm"
              onClick={fetchAppInfo}
              disabled={loading}
              variant="outline"
              className="gap-1.5 text-xs rounded-lg"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Comprobar
            </Button>
          </div>

          {/* Database Live Sync Card */}
          <Card className="glass-panel border-border/40">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-cyan-400" />
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Sincronización de Parches (LIVE / PTU)</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Naves: <span className="text-foreground font-mono font-bold">{appInfo?.dbStats?.shipCount || 0}</span> • Componentes: <span className="text-foreground font-mono font-bold">{appInfo?.dbStats?.componentCount || 0}</span>
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleSyncDatabase}
                  disabled={syncing}
                  className="gap-1.5 rounded-lg text-xs font-bold"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Sincronizando..." : "Sincronizar Datos"}
                </Button>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="update-admin-token" className="text-[11px] text-muted-foreground">Token de administración <span className="opacity-70">(producción)</span></label>
                <input
                  id="update-admin-token"
                  type="password"
                  autoComplete="off"
                  value={adminToken}
                  onChange={(event) => updateAdminToken(event.target.value)}
                  placeholder="Necesario si el servidor protege la sincronización"
                  className="h-8 w-full rounded-lg border border-border bg-background/50 px-2.5 text-xs"
                />
              </div>

              {syncMsg && (
                <div className="text-xs font-semibold text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/30 flex items-center gap-2">
                  {syncMsg.toLowerCase().includes("error") || syncMsg.toLowerCase().includes("no se pudo") ? <ShieldCheck className="h-3.5 w-3.5 text-red-300" /> : <Sparkles className="h-3.5 w-3.5 animate-spin" />}
                  {syncMsg}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loadouts Backup & Restore */}
          <Card className="glass-panel border-border/40">
            <CardContent className="p-4 space-y-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Respaldo y Migración de Loadouts
              </h4>
              <p className="text-xs text-muted-foreground">
                Exporta tus naves configuradas para no perderlas al cambiar de ordenador o instalar una nueva versión.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleExportBackup} className="gap-1.5 text-xs rounded-lg">
                  <Download className="h-3.5 w-3.5" />
                  Exportar Loadouts (.json)
                </Button>

                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-muted/50 border border-border/40 hover:bg-muted transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Importar Respaldo
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {exportMsg && (
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 pt-1">
                  <Check className="h-4 w-4" />
                  {exportMsg}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terminal / Git Update Guide for Local Users */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-xs space-y-2">
            <div className="font-bold text-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-purple-400" />
              ¿Cómo actualizar la app si otro usuario la descarga?
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Si se comparten versiones mediante repositorio Git o carpeta local, solo se necesita ejecutar el siguiente comando en la terminal dentro de la carpeta del proyecto:
            </p>
            <div className="p-2 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-400 border border-border/40 flex items-center justify-between">
              <code>npm run update</code>
              <Badge variant="outline" className="text-[9px] uppercase font-mono border-emerald-500/40 text-emerald-300">
                Git Pull + Build
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
