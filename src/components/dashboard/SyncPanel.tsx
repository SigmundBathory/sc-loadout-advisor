"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Upload, Download, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

type SyncState = "idle" | "syncing" | "done" | "error";

export default function SyncPanel() {
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");

  async function handleSync() {
    setState("syncing");
    setMessage("Sincronizando datos del Wiki API...");
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setMessage(data.message || "Sincronización completada. Recargando...");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setState("error");
        setMessage(data.error || "Error en la sincronización");
      }
    } catch (e) {
      setState("error");
      setMessage("Error de red. Verifica tu conexión.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Empty state hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
          <Rocket className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Bienvenido a SC Loadout Advisor</h2>
        <p className="text-muted-foreground text-lg">
          La base de datos está vacía. Sincroniza los datos de Star Citizen para comenzar.
        </p>
      </div>

      {/* Sync options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Sync from API */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Sincronizar desde Wiki API</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Descarga naves, componentes y precios desde la API oficial de Star Citizen Wiki.
          </p>
          <Button
            onClick={handleSync}
            disabled={state === "syncing"}
            className="w-full"
          >
            {state === "syncing" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {state === "done" && <CheckCircle2 className="h-4 w-4 mr-2" />}
            {state === "error" && <AlertCircle className="h-4 w-4 mr-2" />}
            {state === "syncing" ? "Sincronizando..." : state === "done" ? "Completado" : "Sincronizar Ahora"}
          </Button>
          {message && (
            <p className={`text-xs ${state === "error" ? "text-red-400" : "text-green-400"}`}>
              {message}
            </p>
          )}
        </div>

        {/* Option 2: Import file */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Importar archivo JSON</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Importa datos exportados desde erkul.games o archivos JSON de la comunidad.
          </p>
          <Link href="/import">
            <Button variant="outline" className="w-full gap-2">
              Ir a Importar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Help text */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>¿No funciona la sincronización automática?</p>
        <p>
          Prueba ejecutar <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm run sync</code> desde la terminal local.
        </p>
      </div>
    </div>
  );
}
