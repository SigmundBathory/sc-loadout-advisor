import { NextResponse } from "next/server";
import { getAllShips, getAllManufacturers, getClassifications } from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const manufacturer = searchParams.get("manufacturer") || undefined;
    const classification = searchParams.get("classification") || undefined;
    const search = searchParams.get("search") || undefined;
    const withDps = searchParams.get("withDps") === "true";

    let ships;
    if (withDps) {
      // Use the DPS-enriched query for compare page
      const { getShipsWithDps } = await import("@/lib/db/queries");
      ships = getShipsWithDps({ manufacturer, classification, search });
    } else {
      ships = getAllShips({ manufacturer, classification, search });
    }

    const manufacturers = getAllManufacturers();
    const classifications = getClassifications();

    return NextResponse.json({
      ships,
      manufacturers,
      classifications,
    });
  } catch (error) {
    console.error("Error fetching ships:", error);
    return NextResponse.json(
      { error: "Failed to fetch ships" },
      { status: 500 }
    );
  }
}
