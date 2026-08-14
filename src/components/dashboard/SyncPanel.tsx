"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Download, Upload, ArrowRight, CheckCircle2, Loader2, AlertCircle, Globe, MapPin, ClipboardList } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

type SyncState = "idle" | "syncing" | "done" | "error";

interface SyncStep {
  name: string;
  status: "pending" | "syncing" | "done" | "error";
  icon: LucideIcon;
  message?: string;
}

const steps: SyncStep[] = [
  { name: "Wiki API + UEX", status: "pending", icon: Globe },
  { name: "Ubicaciones naves (scfocus.org)", status: "pending", icon: MapPin },
  { name: "Wikelo (Google Sheets)", status: "pending", icon: ClipboardList },
];

export default function SyncPanel() {
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");
  const [stepStates, setStepStates] = useState<SyncStep[]>(steps.map(s => ({ ...s })));


  async function handleSync() {
    setState("syncing");
    setMessage("Iniciando sincronización completa...");
    setStepStates(steps.map(s => ({ ...s, status: "pending" })));

    try {
      const res = await fetch("/api/full-sync", {
        method: "POST",
      });
      const data = await res.json();
      
      if (res.ok) {
        setState("done");
        setMessage(data.message || "Sincronización completa. Recargando...");
        toast.success("Sincronización completa", { description: data.message || "Datos actualizados correctamente" });
        
        // Update step states based on response
        if (data.steps) {
          setStepStates(prev => prev.map((s, i) => ({
            ...s,
            status: data.steps[i]?.status === "completed" ? "done" : data.steps[i]?.status === "error" ? "error" : s.status,
            message: data.steps[i]?.summary || data.steps[i]?.error || undefined
          })));
        }
        
        if (data.steps?.some((step: { status?: string }) => step.status === "error")) {
          setState("error");
          setMessage(data.message || "Sincronización parcial: revisa los pasos con error");
          toast.error("Sincronización parcial", { description: data.message });
          return;
        }
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setState("error");
        setMessage(data.error || "Error en la sincronización");
        toast.error("Error en sincronización", { description: data.error || "Error desconocido" });
        setStepStates(prev => prev.map((s, i) => ({
          ...s,
          status: data.steps?.[i]?.status === "error" ? "error" : s.status
        })));
      }
    } catch {
      setState("error");
      setMessage("Error de red. Verifica tu conexión.");
    }
  }

  function getStepIcon(step: SyncStep) {
    if (step.status === "syncing") return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    if (step.status === "done") return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    if (step.status === "error") return <AlertCircle className="h-5 w-5 text-red-400" />;
    return <step.icon className="h-5 w-5 text-muted-foreground" />;
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

      {/* Sync progress steps */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Sincronización completa (3 pasos)
        </h3>
        <div className="space-y-2">
          {stepStates.map((step) => (
            <div key={step.name} className="flex items-center gap-3 p-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl transition-all">
              <div className="flex-shrink-0">{getStepIcon(step)}</div>
              <div className="flex-1">
                <div className="font-medium">{step.name}</div>
                {step.message && <div className="text-xs text-muted-foreground/70">{step.message}</div>}
              </div>
              {step.status === "syncing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {step.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-400" />}
              {step.status === "error" && <AlertCircle className="h-4 w-4 text-red-400" />}
            </div>
          ))}
        </div>
      </div>

      {/* Sync button */}
      <Button
        onClick={handleSync}
        disabled={state === "syncing"}
        className="w-full py-3 text-lg"
      >
        {state === "syncing" && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
        {state === "done" && <CheckCircle2 className="h-5 w-5 mr-2" />}
        {state === "error" && <AlertCircle className="h-5 w-5 mr-2" />}
        {state === "syncing" ? "Sincronizando todo..." : state === "done" ? "Completado" : "Sincronizar Todo (Wiki + UEX + Ubicaciones + Wikelo)"}
      </Button>
      {message && (
        <p className={`text-xs text-center ${state === "error" ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}

      {/* Import file option */}
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

      {/* Help text */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>¿No funciona la sincronización automática?</p>
        <p>
          Prueba ejecutar <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx tsx sync-now.ts</code> desde la terminal local.
        </p>
      </div>
    </div>
  );
}