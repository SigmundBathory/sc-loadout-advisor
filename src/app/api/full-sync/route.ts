import { NextResponse } from "next/server";
import { checkVersionAndSync, syncDataForVersion, getSyncMeta, getShipCount, getComponentCount, syncGameVersions } from "@/lib/db/sync";
import { getDb } from "@/lib/db/schema";

let fullSyncInProgress = false;
let fullSyncStartedAt = 0;
const FULL_SYNC_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {

  // Reset stuck flag after timeout
  if (fullSyncInProgress && Date.now() - fullSyncStartedAt > FULL_SYNC_TIMEOUT_MS) {
    console.warn("Full sync flag was stuck, resetting after timeout");
    fullSyncInProgress = false;
  }

  if (fullSyncInProgress) {
    return NextResponse.json(
      { error: "Ya hay una sincronización completa en curso" },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    );
  }

  fullSyncInProgress = true;
  fullSyncStartedAt = Date.now();
  try {
    const results: Record<string, any> = {};

    // Step 1: Wiki API + UEX sync (existing sync)
    results.step1 = { name: "Wiki API + UEX", status: "started" };
    await syncGameVersions();
    const vc = await checkVersionAndSync();
    results.step1.version = vc.currentVersion;
    await syncDataForVersion(vc.currentVersion, undefined, { force: true });
    results.step1.status = "completed";
    results.step1.ships = getShipCount();
    results.step1.components = getComponentCount();

    // Step 2: Ship locations from scfocus.org
    results.step2 = { name: "Ship Locations (scfocus.org)", status: "started" };
    try {
      const { execSync } = await import("child_process");
      const output = execSync("npx tsx scripts/scrape-ship-locations.ts", { 
        stdio: "pipe", 
        cwd: process.cwd(),
        timeout: 120000
      });
      results.step2.status = "completed";
      results.step2.summary = output.toString().trim().split("\n").filter(Boolean).slice(-1)[0] || "Paso completado";
    } catch (e: any) {
      results.step2.status = "error";
      results.step2.error = e instanceof Error ? e.message : "Error en el scraper de ubicaciones";
    }

    // Step 3: Wikelo ships from Google Sheets
    results.step3 = { name: "Wikelo Ships (Google Sheets)", status: "started" };
    try {
      const { execSync } = await import("child_process");
      const output = execSync("npx tsx scripts/sync-wikelo.ts", { 
        stdio: "pipe", 
        cwd: process.cwd(),
        timeout: 60000
      });
      results.step3.status = "completed";
      results.step3.summary = output.toString().trim().split("\n").filter(Boolean).slice(-1)[0] || "Paso completado";
    } catch (e: any) {
      results.step3.status = "error";
      results.step3.error = e instanceof Error ? e.message : "Error en la sincronización de Wikelo";
    }

    const shipCount = getShipCount();
    const componentCount = getComponentCount();

    const steps = [results.step1, results.step2, results.step3];
    const failed = steps.filter((step) => step.status === "error");
    if (failed.length > 0) {
      getDb().prepare("UPDATE sync_meta SET sync_status = 'partial' WHERE id = 1").run();
    }
    const meta = getSyncMeta();
    const response = NextResponse.json({
      message: failed.length === 0 ? "Sincronización completa finalizada" : "Sincronización parcial: algunos pasos fallaron",
      version: vc.currentVersion,
      meta,
      shipCount,
      componentCount,
      steps,
    }, { status: failed.length === 0 ? 200 : 207 });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Full sync error:", error);
    return NextResponse.json(
      { error: "Full sync failed: " + (error as Error).message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    fullSyncInProgress = false;
  }
}