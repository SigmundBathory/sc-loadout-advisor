import { NextResponse } from "next/server";
import {
  getAllComponents,
  getComponentById,
  getComponentsByIds,
  getCompatibleComponents,
} from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const size = searchParams.get("size") ? parseInt(searchParams.get("size")!) : undefined;
    const manufacturer = searchParams.get("manufacturer") || undefined;
    const search = searchParams.get("search") || undefined;
    const compatibleShipId = searchParams.get("compatibleShipId") || undefined;
    const slotType = searchParams.get("slotType") || undefined;
    const slotSize = searchParams.get("slotSize")
      ? parseInt(searchParams.get("slotSize")!)
      : undefined;
    const id = searchParams.get("id") || undefined;
    const ids = searchParams.get("ids") || undefined;

    if (id) {
      const component = getComponentById(id);
      if (!component) {
        return NextResponse.json({ error: "Component not found" }, { status: 404 });
      }
      return NextResponse.json({ component });
    }

    if (ids) {
      const idList = ids.split(",").filter(Boolean);
      const components = getComponentsByIds(idList);
      return NextResponse.json({ components });
    }

    if (compatibleShipId && slotType && slotSize) {
      const components = getCompatibleComponents(compatibleShipId, slotType, slotSize);
      return NextResponse.json({ components });
    }

    const components = getAllComponents({ type, size, manufacturer, search });
    return NextResponse.json({ components });
  } catch (error) {
    console.error("Error fetching components:", error);
    return NextResponse.json(
      { error: "Failed to fetch components" },
      { status: 500 }
    );
  }
}
