import { NextResponse } from "next/server";
import { requireAdminToken } from "@/lib/security/admin";
import { checkVersionAndSync, syncDataForVersion, getSyncMeta, getShipCount, getComponentCount, syncGameVersions } from "@/lib/db/sync";

export async function POST(request: Request) {
  const authError = requireAdminToken(request);
  if (authError) return authError;

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
      results.step2.output = output.toString();
      results.step2.status = "completed";
    } catch (e: any) {
      results.step2.status = "error";
      results.step2.error = e.message;
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
      results.step3.output = output.toString();
      results.step3.status = "completed";
    } catch (e: any) {
      results.step3.status = "error";
      results.step3.error = e.message;
    }

    const meta = getSyncMeta();
    const shipCount = getShipCount();
    const componentCount = getComponentCount();

    return NextResponse.json({
      message: "Full sync completed",
      version: vc.currentVersion,
      meta,
      shipCount,
      componentCount,
      steps: [results.step1, results.step2, results.step3],
    });
  } catch (error) {
    console.error("Full sync error:", error);
    return NextResponse.json(
      { error: "Full sync failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}