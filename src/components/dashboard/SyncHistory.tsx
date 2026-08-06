import { RefreshCw, CheckCircle2, AlertCircle, Clock, Ship, Cpu } from "lucide-react";
import { getRecentSyncLogs } from "@/lib/db/queries";

export default function SyncHistory() {
  const logs = getRecentSyncLogs(8);

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground">Historial de Sincronización</h3>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aún no hay sincronizaciones registradas.
        </p>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const ok = log.status === "ok";
            const failed = log.status === "error";
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/20"
              >
                {failed ? (
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                ) : ok ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-amber-400 mt-0.5 shrink-0 animate-spin" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {log.version || "Desconocida"}
                    </span>
                    {ok && (
                      <span className="text-[10px] text-emerald-400 font-mono shrink-0">
                        {new Date(log.finished_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  {failed ? (
                    <p className="text-xs text-red-400/80 truncate mt-0.5">
                      {log.error_message || "Error durante la sincronización"}
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Ship className="h-3 w-3" />
                        {log.ships_synced}
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {log.components_synced}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.started_at).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
