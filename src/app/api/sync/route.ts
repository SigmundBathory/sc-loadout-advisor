import { NextResponse } from "next/server";
import { requireAdminToken } from "@/lib/security/admin";
import {
  checkVersionAndSync,
  syncDataForVersion,
  syncGameVersions,
  getSelectedVersion,

  getSyncMeta,
  getShipCount,
  getComponentCount,
} from "@/lib/db/sync";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function GET() {
  try {
    const meta = getSyncMeta();
    const shipCount = getShipCount();
    const componentCount = getComponentCount();
    const selectedVersion = getSelectedVersion();

    return noStore(NextResponse.json({
      meta,
      shipCount,
      componentCount,
      selectedVersion,
    }));
  } catch (error) {
    console.error("Error getting sync status:", error);
    return noStore(NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    ));
  }
}

export async function POST(request: Request) {
  const authError = requireAdminToken(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const forceVersion = body.version;
    const force = !!body.force;
    
    // Always sync game versions list first
    await syncGameVersions();
    
    // An explicit version is used only by the version selector. A regular
    // manual sync must always target the current LIVE version returned by the
    // Wiki, never an old selected dataset.
    const versionCheck = await checkVersionAndSync();
    const versionToSync = forceVersion || versionCheck.currentVersion;

    if (!versionToSync) {
      throw new Error("The Wiki did not return a current game version");
    }

    if (!forceVersion && !versionCheck.needsSync && getShipCount() > 0) {
      const meta = getSyncMeta();
      return noStore(NextResponse.json({
        message: "Data is up to date",
        version: versionCheck.currentVersion,
        needsSync: false,
        meta,
      }));
    }

    // Run sync for specific version
    const previousVersion = (getSyncMeta() as { wiki_version?: string } | undefined)?.wiki_version || "";
    await syncDataForVersion(versionToSync, undefined, { force });

    const meta = getSyncMeta();
    const shipCount = getShipCount();
    const componentCount = getComponentCount();

    return noStore(NextResponse.json({
      message: "Sync completed",
      version: versionToSync,
      previousVersion,
      needsSync: false,
      meta,
      shipCount,
      componentCount,
    }));
  } catch (error) {
    console.error("Sync error:", error);
    return noStore(NextResponse.json(
      { error: "Sync failed: " + (error as Error).message },
      { status: 500 }
    ));
  }
}
