"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileJson, AlertCircle, Check, Loader2, Eye, Rocket, AlertTriangle } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

interface PreviewResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: { ships: number; components: number; weapons: number; hardpoints: number };
  sampleShips: { name: string; manufacturer: string; classification: string; crew: number }[];
  sampleComponents: { name: string; type: string; size: number }[];
}

interface ImportResult {
  imported?: { ships: number; components: number; hardpoints: number };
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [version, setVersion] = useState("");
  const [importType, setImportType] = useState<"full" | "ships" | "components" | "weapons">("full");
  const [step, setStep] = useState<"select" | "preview" | "done">("select");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState(() =>
    typeof window === "undefined" ? "" : window.sessionStorage.getItem("sc-admin-token") || ""
  );
  const fileInputRef = useRef<HTMLInputElement>(null);


  function updateAdminToken(value: string) {
    setAdminToken(value);
    if (value) window.sessionStorage.setItem("sc-admin-token", value);
    else window.sessionStorage.removeItem("sc-admin-token");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError("");
    setPreview(null);
    setResult(null);
    setStep("select");

    const name = selected.name.toLowerCase();
    const versionMatch = name.match(/(\d+\.\d+(?:\.\d+)?(?:-ptu\.\d+)?)/);
    if (versionMatch) setVersion(versionMatch[1]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setFileContent(btoa(unescape(encodeURIComponent(text))));
    };
    reader.readAsText(selected);
  }

  async function handlePreview() {
    if (!file || !fileContent) return;
    setError("");
    setImporting(true);
    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileContent, fileName: file.name }),
      });
      const data: PreviewResult = await res.json();
      setPreview(data);
      if (data.valid) setStep("preview");
      else setError(data.errors.join("; "));
    } catch {
      setError("Error al analizar el archivo");
    } finally {
      setImporting(false);
    }
  }

  async function handleImport() {
    if (!file || !version || !fileContent) return;
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify({ version, type: importType, fileContent, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Error al importar");
      else { setResult(data); setStep("done"); }
    } catch {
      setError("Error de conexion");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="container mx-auto px-4 py-6 max-w-2xl flex-1 space-y-6">
        <Breadcrumb items={[{ label: "Importar Datos" }]} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Archivo JSON
            </CardTitle>
            <CardDescription>
              Sube un archivo JSON para vista previa antes de importar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Version Input */}
            <div className="space-y-2">
              <label htmlFor="version" className="text-sm font-medium">Version del Juego</label>
              <Input id="version" placeholder="ej: 4.10.0-PTU.12358556" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>

            {/* Import Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Importacion</label>
              <div className="flex gap-2 flex-wrap">
                {(["full", "ships", "components", "weapons"] as const).map((type) => (
                  <Button key={type} variant={importType === type ? "default" : "outline"} size="sm" onClick={() => setImportType(type)}>
                    {type === "full" ? "Completo" : type === "ships" ? "Naves" : type === "components" ? "Componentes" : "Armas"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-token" className="text-sm font-medium">Token de administración <span className="text-muted-foreground font-normal">(si el servidor lo requiere)</span></label>
              <Input
                id="admin-token"
                type="password"
                autoComplete="off"
                placeholder="Se guarda solo en esta sesión del navegador"
                value={adminToken}
                onChange={(e) => updateAdminToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">El token no se incluye en el archivo ni se almacena en la base de datos.</p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Archivo JSON</label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileJson className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Click para seleccionar archivo JSON</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Results */}
            {step === "preview" && preview && (
              <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <h3 className="font-semibold flex items-center gap-2 text-primary"><Eye className="h-4 w-4" /> Vista Previa</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="rounded-lg bg-background/60 p-3">
                    <div className="text-2xl font-bold text-primary">{preview.summary.ships}</div>
                    <div className="text-xs text-muted-foreground">Naves</div>
                  </div>
                  <div className="rounded-lg bg-background/60 p-3">
                    <div className="text-2xl font-bold text-primary">{preview.summary.components}</div>
                    <div className="text-xs text-muted-foreground">Componentes</div>
                  </div>
                  <div className="rounded-lg bg-background/60 p-3">
                    <div className="text-2xl font-bold text-primary">{preview.summary.weapons}</div>
                    <div className="text-xs text-muted-foreground">Armas</div>
                  </div>
                  <div className="rounded-lg bg-background/60 p-3">
                    <div className="text-2xl font-bold text-primary">{preview.summary.hardpoints}</div>
                    <div className="text-xs text-muted-foreground">Hardpoints</div>
                  </div>
                </div>

                {preview.sampleShips.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Muestra de naves:</p>
                    <div className="text-xs space-y-1">
                      {preview.sampleShips.map((s, i) => (
                        <div key={i} className="flex justify-between bg-background/40 rounded px-2 py-1">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-muted-foreground">{s.manufacturer} · {s.classification} · Trip. {s.crew}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {preview.sampleComponents.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Muestra de componentes:</p>
                    <div className="text-xs space-y-1">
                      {preview.sampleComponents.map((c, i) => (
                        <div key={i} className="flex justify-between bg-background/40 rounded px-2 py-1">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground">{c.type} · Size {c.size}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {preview.warnings.length > 0 && (
                  <div className="text-xs text-amber-500 space-y-1">
                    {preview.warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Errors */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {/* Result */}
            {step === "done" && result && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <Check className="h-4 w-4" />
                Importacion exitosa: {result.imported?.ships || 0} naves, {result.imported?.components || 0} componentes, {result.imported?.hardpoints || 0} hardpoints
              </div>
            )}

            {/* Action Buttons */}
            {step === "select" ? (
              <Button onClick={handlePreview} disabled={!file || importing} className="w-full">
                {importing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analizando...</> : <><Eye className="h-4 w-4 mr-2" /> Vista Previa</>}
              </Button>
            ) : step === "preview" ? (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep("select"); setPreview(null); }} className="flex-1">Volver</Button>
                <Button onClick={handleImport} disabled={!version || importing} className="flex-1">
                  {importing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importando...</> : <><Rocket className="h-4 w-4 mr-2" /> Importar Datos</>}
                </Button>
              </div>
            ) : (
              <Button onClick={() => { setStep("select"); setFile(null); setPreview(null); setResult(null); }} variant="outline" className="w-full">
                Importar Otro Archivo
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
