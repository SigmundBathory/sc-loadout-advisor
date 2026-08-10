import { NextResponse } from "next/server";
import { getShipById } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ship = getShipById(decodeURIComponent(id));

    if (!ship) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 });
    }

    return NextResponse.json({ ship });
  } catch (error) {
    console.error("GET /api/ships/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch ship" }, { status: 500 });
  }
}
