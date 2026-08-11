"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronRight, ChevronDown } from "lucide-react";

interface SyncLogEntry {
  id: number;
  version: string | null;
  status: string;
  started_at: string;
  finished_at: string | null;
  ships_synced: number | null;
  components_synced: number | null;
  locations_synced: number | null;
  error_message: string | null;
}

interface SyncHistoryProps {
  limit?: number;
}

export default function SyncHistory({ limit = 10 }: SyncHistoryProps) {
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    async function loadSyncLogs() {
      try {
        const res = await fetch(`/api/sync-history?limit=${limit}`);
        const data = await res.json();
        setSyncLogs(data.logs || []);
      } catch (error) {
        console.error("Error loading sync logs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSyncLogs();
  }, [limit]);

  function getStatusBadge(status: string) {
    switch (status) {
      case "ok":
        return (
          <Badge variant="default" className="bg-green-600 text-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case "running":
        return (
          <Badge variant="outline" className="text-blue-400">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            En progreso
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(startedAt: string, finishedAt: string) {
    if (!startedAt || !finishedAt) return "-";
    const start = new Date(startedAt);
    const end = new Date(finishedAt);
    const durationMs = end.getTime() - start.getTime();
    if (durationMs < 1000) return "<1s";
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
    if (durationMs < 3600000) return `${Math.round(durationMs / 60000)}m`;
    return `${Math.round(durationMs / 3600000)}h ${Math.round((durationMs % 3600000) / 60000)}m`;
  }

  if (loading) {
    return (
      <Card className="product-card border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de Sincronizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  if (syncLogs.length === 0) {
    return (
      <Card className="product-card border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de Sincronizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay sincronizaciones registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="product-card border-border/40">
      <CardHeader>
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <History className="h-4 w-4" />
          Historial de Sincronizaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Versión</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead className="w-32">Fecha</TableHead>
                <TableHead className="w-24">Duración</TableHead>
                <TableHead className="w-20 text-right">Naves</TableHead>
                <TableHead className="w-20 text-right">Componentes</TableHead>
                <TableHead className="w-20 text-right">Ubicaciones</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLogs.map((log) => {
                const isExpanded = expandedLog === log.id;
                return (
                  <TableRow key={log.id} className="cursor-pointer" onClick={() => setExpandedLog(isExpanded ? null : log.id)}>
                    <TableCell>
                      <div className="font-mono text-xs">{log.version || "-"}</div>
                      {log.error_message && (
                        <div className="text-xs text-red-400 mt-1">{log.error_message}</div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(log.started_at)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDuration(log.started_at, log.finished_at || log.started_at)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {log.ships_synced?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {log.components_synced?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {log.locations_synced?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell>
                      {isExpanded ? (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {expandedLog && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/30">
            <h4 className="font-medium mb-2">Detalles de la sincronización</h4>
            <p className="text-sm text-muted-foreground">
              Versión: {syncLogs.find(l => l.id === expandedLog)?.version || "-"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
