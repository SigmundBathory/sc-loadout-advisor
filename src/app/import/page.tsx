"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileJson, AlertCircle, Check, Loader2, Download } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [importType, setImportType] = useState<"full" | "ships" | "components" | "weapons">("full");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file || !version) {
      setError("Selecciona un archivo y version");
      return;
    }

    setImporting(true);
    setError("");
    setResult(null);

    try {
      // Convert file to base64 for JSON body approach
      const fileBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          type: importType,
          fileContent: base64,
          fileName: file.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al importar");
      } else {
        setResult(data);
        // Refresh page after successful import
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e) {
      setError("Error de conexion");
    } finally {
      setImporting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError("");
      setResult(null);

      // Try to detect version from filename
      const name = selected.name.toLowerCase();
      const versionMatch = name.match(/(\d+\.\d+(?:\.\d+)?(?:-ptu\.\d+)?)/);
      if (versionMatch) {
        setVersion(versionMatch[1]);
      }
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
              Descarga datos desde la consola del navegador (F12 &gt; Network) en erkul.games
              o usa archivos JSON de otras fuentes de datos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Version Input */}
            <div className="space-y-2">
              <label htmlFor="version" className="text-sm font-medium">
                Version del Juego
              </label>
              <Input
                id="version"
                placeholder="ej: 4.10.0-PTU.12358556"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ejemplos: 4.10.0-PTU.12358556, 4.9.0-LIVE.12232306
              </p>
            </div>

            {/* Import Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo de Importacion
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["full", "ships", "components", "weapons"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={importType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImportType(type)}
                  >
                    {type === "full" ? "Completo" :
                     type === "ships" ? "Naves" :
                     type === "components" ? "Componentes" : "Armas"}
                  </Button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Archivo JSON
              </label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileJson className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Click para seleccionar archivo JSON
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <Check className="h-4 w-4" />
                <span>
                  Importacion exitosa: {result.imported?.ships || 0} naves, {result.imported?.components || 0} componentes
                </span>
              </div>
            )}

            {/* Import Button */}
            <Button
              onClick={handleImport}
              disabled={!file || !version || importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Datos
                </>
              )}
            </Button>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground space-y-2 mt-4">
              <p className="font-medium">Como obtener datos de erkul.games:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abre erkul.games en tu navegador</li>
                <li>Presiona F12 para abrir DevTools</li>
                <li>Ve a la pestana Network (Red)</li>
                <li>Recarga la pagina y busca las llamadas a la API</li>
                <li>Haz click derecho en la respuesta y selecciona "Copy response"</li>
                <li>Pega la respuesta en un archivo JSON</li>
                <li>Sube el archivo aqui</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
