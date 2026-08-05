import { NextResponse } from "next/server";
import { getShipBuyLocationsFuzzy, getAllShipLocations } from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shipName = searchParams.get("ship") || undefined;

    if (shipName) {
      const locations = getShipBuyLocationsFuzzy(shipName);
      return NextResponse.json({ locations });
    }

    const locations = getAllShipLocations();
    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching ship locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch ship locations" },
      { status: 500 }
    );
  }
}
