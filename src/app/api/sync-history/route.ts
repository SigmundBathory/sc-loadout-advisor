import { NextResponse } from "next/server";
import { getRecentSyncLogs } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const logs = getRecentSyncLogs(limit);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching sync history:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync history" },
      { status: 500 }
    );
  }
}
