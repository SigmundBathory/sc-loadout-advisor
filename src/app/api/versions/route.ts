import { NextResponse } from "next/server";
import { getGameVersionsFromDb, getSelectedVersion, getSyncMeta, setSelectedVersion, syncGameVersions } from "@/lib/db/sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const existing = getGameVersionsFromDb();
    
    // Fetch from Wiki API if we don't have versions yet
    if (!existing || existing.length === 0) {
      await syncGameVersions();
    }
    
    const versions = getGameVersionsFromDb();
    const selected = getSelectedVersion();
    
    const response = NextResponse.json({
      versions,
      selectedVersion: selected,
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { version } = await request.json();
    
    if (!version) {
      return NextResponse.json(
        { error: "Version is required" },
        { status: 400 }
      );
    }
    
    const knownVersion = getGameVersionsFromDb().some((candidate) => candidate.code === version);
    if (!knownVersion) {
      return NextResponse.json({ error: "Unknown game version" }, { status: 404 });
    }

    // The current schema has one active dataset. Never label it as another
    // version until that version has actually been imported/synchronized.
    const activeVersion = (getSyncMeta() as { wiki_version?: string } | undefined)?.wiki_version;
    if (activeVersion !== version) {
      return NextResponse.json(
        { error: "Version is known but not active; synchronize or import it before selecting it", activeVersion },
        { status: 409 }
      );
    }

    setSelectedVersion(version);
    
    return NextResponse.json({
      message: "Version selected",
      selectedVersion: version,
    });
  } catch (error) {
    console.error("Error setting version:", error);
    return NextResponse.json(
      { error: "Failed to set version" },
      { status: 500 }
    );
  }
}
