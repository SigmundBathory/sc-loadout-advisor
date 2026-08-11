"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, Share2 } from "lucide-react";
import { toPng, toJpeg, toBlob, toPixelData } from "html-to-image";
import { toast } from "sonner";

interface LoadoutExportProps {
  elementId: string; // ID del elemento HTML a capturar (ej: "radar-chart")
  fileName?: string;
  showShareButton?: boolean;
}

/**
 * Componente para exportar un elemento HTML como imagen
 * Usa la librería html-to-image para capturar el elemento y descargarlo
 */
export default function LoadoutExport({
  elementId,
  fileName = "sc-loadout",
  showShareButton = true,
}: LoadoutExportProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  /**
   * Captura el elemento y lo descarga como PNG
   */
  async function handleExportAsPng() {
    if (!elementId) return;
    
    setIsCapturing(true);
    try {
      // Obtener el elemento del DOM
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error(`No se encontró el elemento con ID: ${elementId}`);
        return;
      }
      
      // Capturar como PNG
      const dataUrl = await toPng(element, {
        backgroundColor: "#0a0e17", // Fondo oscuro estilo SC
        pixelRatio: 2, // Alta calidad
        quality: 1.0,
      });
      
      // Crear enlace de descarga
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Imagen descargada correctamente");
    } catch (error) {
      console.error("Error exporting as PNG:", error);
      toast.error("Error al exportar como PNG");
    } finally {
      setIsCapturing(false);
    }
  }

  /**
   * Captura el elemento y lo descarga como JPEG
   */
  async function handleExportAsJpeg() {
    if (!elementId) return;
    
    setIsCapturing(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error(`No se encontró el elemento con ID: ${elementId}`);
        return;
      }
      
      const dataUrl = await toJpeg(element, {
        backgroundColor: "#0a0e17",
        pixelRatio: 2,
        quality: 0.95,
      });
      
      const link = document.createElement("a");
      link.download = `${fileName}.jpg`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Imagen descargada correctamente");
    } catch (error) {
      console.error("Error exporting as JPEG:", error);
      toast.error("Error al exportar como JPEG");
    } finally {
      setIsCapturing(false);
    }
  }

  /**
   * Copia la imagen al portapapeles
   */
  async function handleCopyToClipboard() {
    if (!elementId) return;
    
    setIsCapturing(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error(`No se encontró el elemento con ID: ${elementId}`);
        return;
      }
      
      const blob = await toBlob(element, {
        backgroundColor: "#0a0e17",
        pixelRatio: 2,
        quality: 1.0,
      });
      
      if (!blob) {
        toast.error("No se pudo generar la imagen");
        return;
      }
      
      // Copiar al portapapeles
      await navigator.clipboard.write([
        new ClipboardItem({
          ["image/png"]: blob,
        }),
      ]);
      
      toast.success("Imagen copiada al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Error al copiar al portapapeles");
    } finally {
      setIsCapturing(false);
    }
  }

  /**
   * Comparte la imagen (si el navegador lo soporta)
   */
  async function handleShare() {
    if (!elementId || typeof navigator.share !== "function") return;
    
    setIsCapturing(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error(`No se encontró el elemento con ID: ${elementId}`);
        return;
      }
      
      const blob = await toBlob(element, {
        backgroundColor: "#0a0e17",
        pixelRatio: 2,
        quality: 1.0,
      });
      
      if (!blob) {
        toast.error("No se pudo generar la imagen");
        return;
      }
      
      // Crear archivo
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      
      // Compartir
      await navigator.share({
        title: "SC Loadout Advisor",
        text: "Mira mi configuración de nave en Star Citizen",
        files: [file],
      });
      
      toast.success("Compartido correctamente");
    } catch (error) {
      console.error("Error sharing:", error);
      // Si el error es que el usuario canceló, no mostrar error
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Error al compartir");
      }
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportAsPng}
        disabled={isCapturing}
        className="gap-1"
      >
        <Download className="h-3 w-3" />
        <span className="hidden sm:inline">Descargar PNG</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyToClipboard}
        disabled={isCapturing}
        className="gap-1"
      >
        <ImageIcon className="h-3 w-3" />
        <span className="hidden sm:inline">Copiar Imagen</span>
      </Button>
      
      {showShareButton && typeof navigator.share === "function" && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={isCapturing}
          className="gap-1"
        >
          <Share2 className="h-3 w-3" />
          <span className="hidden sm:inline">Compartir</span>
        </Button>
      )}
      
      {isCapturing && (
        <span className="text-xs text-muted-foreground self-center">
          Generando imagen...
        </span>
      )}
    </div>
  );
}

/**
 * Hook para exportar el radar chart de un loadout
 */
export function useLoadoutExport(loadoutName: string) {
  const [isExporting, setIsExporting] = useState(false);
  
  async function exportRadarChart(elementId: string) {
    setIsExporting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error("No se encontró el gráfico para exportar");
        return null;
      }
      
      const dataUrl = await toPng(element, {
        backgroundColor: "#0a0e17",
        pixelRatio: 2,
        quality: 1.0,
      });
      
      return dataUrl;
    } catch (error) {
      console.error("Error exporting radar chart:", error);
      toast.error("Error al exportar el gráfico");
      return null;
    } finally {
      setIsExporting(false);
    }
  }
  
  return { exportRadarChart, isExporting };
}
