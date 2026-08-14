"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Rocket, Check, X, Info, RefreshCw } from "lucide-react";
import { useSyncStatus } from "@/lib/api/client";
import VersionSelector from "@/components/VersionSelector";

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  newVersion: string;
  changes?: Array<{ type: string; item: string; oldValue?: string | number; newValue?: string | number }>;
}

/**
 * Modal que muestra información sobre una nueva versión disponible
 */
export function UpdateNotificationModal({
  isOpen,
  onClose,
  currentVersion,
  newVersion,
  changes = [],
}: UpdateModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Contar cambios por tipo
  const changeCounts = {
    buff: changes.filter(c => c.type === "buff").length,
    nerf: changes.filter(c => c.type === "nerf").length,
    new: changes.filter(c => c.type === "new").length,
    fixed: changes.filter(c => c.type === "fixed").length,
  };
  
  const totalChanges = changes.length;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Nueva Versión Disponible
          </DialogTitle>
          <DialogDescription>
            Se ha detectado una nueva versión del juego. Sincroniza los datos para obtener 
            la información más reciente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Versión actual</p>
              <Badge variant="outline" className="mt-1">
                {currentVersion}
              </Badge>
            </div>
            <div className="text-center">
              <Rocket className="h-6 w-6 text-primary mx-auto" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nueva versión</p>
              <Badge variant="default" className="mt-1 bg-green-600">
                {newVersion}
              </Badge>
            </div>
          </div>
          
          {totalChanges > 0 && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Cambios detectados</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {changeCounts.buff > 0 && (
                  <Badge variant="outline" className="bg-green-500/15 text-green-400 border-green-500/30 justify-center">
                    +{changeCounts.buff} Buffs
                  </Badge>
                )}
                {changeCounts.nerf > 0 && (
                  <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 justify-center">
                    -{changeCounts.nerf} Nerfs
                  </Badge>
                )}
                {changeCounts.new > 0 && (
                  <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/30 justify-center">
                    +{changeCounts.new} Nuevos
                  </Badge>
                )}
                {changeCounts.fixed > 0 && (
                  <Badge variant="outline" className="bg-purple-500/15 text-purple-400 border-purple-500/30 justify-center">
                    {changeCounts.fixed} Fixes
                  </Badge>
                )}
              </div>
              
              {showDetails && changes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium mb-2">Detalles:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {changes.slice(0, 10).map((change, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-xs ${
                          change.type === "buff" ? "bg-green-500/10 text-green-400" :
                          change.type === "nerf" ? "bg-red-500/10 text-red-400" :
                          change.type === "new" ? "bg-blue-500/10 text-blue-400" :
                          "bg-muted/50"
                        }`}
                      >
                        <span className="font-medium">
                          {change.type === "buff" && "↑ "}
                          {change.type === "nerf" && "↓ "}
                          {change.type === "new" && "✨ "}
                          {change.item}
                        </span>
                        {change.oldValue !== undefined && change.newValue !== undefined && (
                          <span className="block text-muted-foreground">
                            {change.oldValue} → {change.newValue}
                          </span>
                        )}
                      </div>
                    ))}
                    {changes.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        ... y {changes.length - 10} más
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 p-0 h-6 text-xs"
              >
                {showDetails ? "Ocultar detalles" : `Mostrar ${totalChanges} cambios`}
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Más tarde
          </Button>
          <Button onClick={onClose}>
            <Check className="h-4 w-4 mr-2" />
            Sincronizar Ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para detectar y mostrar notificaciones de nuevas versiones
 */
export function useVersionNotification() {
  const { data: syncStatus, refetch } = useSyncStatus();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [changes] = useState<Array<{ type: string; item: string; oldValue?: string | number; newValue?: string | number }>>([]);
  
  // Verificar si hay una nueva versión disponible
  useEffect(() => {
    if (!syncStatus) return;
    
    const currentWikiVersion = syncStatus.meta?.wiki_version || "";
    const selectedVersion = syncStatus.selectedVersion || "";
    
    // Si la versión actual es diferente a la seleccionada, hay una nueva versión
    if (currentWikiVersion && selectedVersion && currentWikiVersion !== selectedVersion) {
      const timer = window.setTimeout(() => {
        setNewVersion(currentWikiVersion);
        setShowUpdateModal(true);
      }, 0);
      return () => window.clearTimeout(timer);

      // Por ahora, no tenemos el changelog, pero podríamos obtenerlo de la API
      // setChanges([...]);
    }
  }, [syncStatus]);
  
  return {
    showUpdateModal,
    setShowUpdateModal,
    newVersion,
    currentVersion: syncStatus?.selectedVersion || "",
    changes,
    refetchSyncStatus: refetch,
  };
}

interface UpdateCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal genérico del centro de actualizaciones (usado en Navbar)
 */
export default function UpdateCenterModal({ open, onOpenChange }: UpdateCenterModalProps) {
  const { data: syncStatus, isLoading, refetch } = useSyncStatus();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [adminToken, setAdminToken] = useState(() =>
    typeof window === "undefined" ? "" : window.sessionStorage.getItem("sc-admin-token") || ""
  );

  async function refreshData() {
    setSyncing(true);
    setSyncMessage("Actualizando LIVE...");
    try {
      const token = adminToken || window.sessionStorage.getItem("sc-admin-token") || "";
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({ force: true }),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sync"] }),
        queryClient.invalidateQueries({ queryKey: ["ships"] }),
        queryClient.invalidateQueries({ queryKey: ["components"] }),
        queryClient.invalidateQueries({ queryKey: ["loadouts"] }),
        refetch(),
      ]);
      router.refresh();
      setSyncMessage("Datos actualizados correctamente");
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Error al actualizar los datos");
    } finally {
      setSyncing(false);
    }
  }

  const lastSync = syncStatus?.meta?.last_sync_at
    ? new Date(`${syncStatus.meta.last_sync_at.replace(" ", "T")}Z`).toLocaleString("es-ES", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "Nunca";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Centro de Actualizaciones
          </DialogTitle>
          <DialogDescription>
            Gestiona la sincronización de datos del juego.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Cargando estado...</div>
          ) : syncStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Naves</span>
                <Badge variant="outline">{syncStatus.shipCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Componentes</span>
                <Badge variant="outline">{syncStatus.componentCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Estado</span>
                {syncStatus.meta?.sync_status === "ok" ? (
                  <Badge variant="default" className="bg-green-600">Sincronizado</Badge>
                ) : (
                  <Badge variant="destructive">Desactualizado</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Última actualización</span>
                <span className="text-xs text-muted-foreground">{lastSync}</span>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Dataset activo · LIVE / PTU</p>
                <VersionSelector />
              </div>
              {syncMessage && <p className="text-xs text-center text-muted-foreground">{syncMessage}</p>}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Token de administración</label>
                <input
                  type="password"
                  value={adminToken}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAdminToken(value);
                    if (value) window.sessionStorage.setItem("sc-admin-token", value);
                    else window.sessionStorage.removeItem("sc-admin-token");
                  }}
                  placeholder="Introduce el token si el servidor lo requiere"
                  className="h-9 w-full rounded-lg border border-border bg-background/60 px-3 text-sm"
                />
              </div>
              <Button onClick={refreshData} disabled={syncing} className="w-full gap-2">
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Actualizando..." : "Actualizar datos ahora"}
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">Sin datos disponibles</div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente que muestra un banner de notificación en la parte superior de la página
 */
export function VersionNotificationBanner({
  message,
  onSync,
  onDismiss,
}: {
  message: string;
  onSync: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10 backdrop-blur-md border border-primary/20 shadow-lg">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            className="h-7 px-3 text-xs"
          >
            Sincronizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
