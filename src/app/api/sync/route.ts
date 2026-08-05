import { NextResponse } from "next/server";
import {
  checkVersionAndSync,
  syncAllData,
  syncDataForVersion,
  syncGameVersions,
  getSelectedVersion,
  getSyncMeta,
  getShipCount,
  getComponentCount,
} from "@/lib/db/sync";

export async function GET() {
  try {
    const meta = getSyncMeta();
    const shipCount = getShipCount();
    const componentCount = getComponentCount();
    const selectedVersion = getSelectedVersion();

    return NextResponse.json({
      meta,
      shipCount,
      componentCount,
      selectedVersion,
    });
  } catch (error) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const forceVersion = body.version;
    
    // Always sync game versions list first
    await syncGameVersions();
    
    // Use forced version or selected version
    let versionToSync = forceVersion || getSelectedVersion();
    
    if (!versionToSync) {
      // Fall back to checking for new default version
      const versionCheck = await checkVersionAndSync();
      if (!versionCheck.needsSync && getShipCount() > 0) {
        return NextResponse.json({
          message: "Data is up to date",
          version: versionCheck.currentVersion,
          needsSync: false,
        });
      }
      versionToSync = versionCheck.currentVersion;
    }

    // Run sync for specific version
    await syncDataForVersion(versionToSync);

    const meta = getSyncMeta();
    const shipCount = getShipCount();
    const componentCount = getComponentCount();

    return NextResponse.json({
      message: "Sync completed",
      version: versionToSync,
      previousVersion: meta?.wiki_version || "",
      needsSync: false,
      meta,
      shipCount,
      componentCount,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
