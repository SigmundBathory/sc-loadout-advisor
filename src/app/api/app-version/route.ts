import { NextResponse } from "next/server";
import { getSyncMeta, getShipCount, getComponentCount } from "@/lib/db/sync";
import pkg from "../../../../package.json";

export async function GET() {
  let meta = null;
  let shipCount = 0;
  let componentCount = 0;

  try {
    meta = getSyncMeta();
    shipCount = getShipCount();
    componentCount = getComponentCount();
  } catch (e) {
    console.error("Failed to fetch DB meta:", e);
  }

  return NextResponse.json({
    appName: "SC Loadout Advisor",
    currentVersion: pkg.version,
    latestVersion: pkg.version,
    releaseDate: "2026-08-05",
    isUpToDate: true,
    dbStats: {
      shipCount,
      componentCount,
      lastSyncAt: meta?.last_sync_at || null,
      gameVersion: meta?.wiki_version || "LIVE / PTU",
    },
    updateMethods: [
      {
        type: "git",
        title: "Actualización Automática por Terminal",
        command: "npm run update",
        description: "Ejecuta 'git pull' para descargar los últimos cambios de código y reconstruye la app.",
      },
      {
        type: "data_sync",
        title: "Sincronización de Datos en Vivo (LIVE/PTU)",
        command: "Botón 'Sync' en la barra superior",
        description: "Descarga las últimas naves, componentes, tiendas y precios de Star Citizen sin reinstalar.",
      },
      {
        type: "export",
        title: "Respaldo y Migración de Loadouts",
        description: "Exporta tus configuraciones a un archivo JSON para importarlas en cualquier otra copia.",
      },
    ],
  });
}
