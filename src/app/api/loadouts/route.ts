import { NextResponse } from "next/server";
import {
  getAllLoadouts,
  getLoadoutById,
  getLoadoutsByShip,
  createLoadout,
  updateLoadout,
  deleteLoadout,
} from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const shipId = searchParams.get("ship_id");

    if (id) {
      const loadout = getLoadoutById(id);
      if (!loadout) {
        return NextResponse.json({ error: "Loadout not found" }, { status: 404 });
      }
      return NextResponse.json({ loadout });
    }

    if (shipId) {
      const loadouts = getLoadoutsByShip(shipId);
      return NextResponse.json({ loadouts });
    }

    const loadouts = getAllLoadouts();
    return NextResponse.json({ loadouts });
  } catch (error: any) {
    console.error("GET /api/loadouts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch loadouts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ship_id, components, is_optimized, optimized_preset, stats } = body;

    if (!name || !ship_id) {
      return NextResponse.json(
        { error: "Name and ship_id are required" },
        { status: 400 }
      );
    }

    const loadout = createLoadout(name, ship_id, components || {}, {
      is_optimized: !!is_optimized,
      optimized_preset: optimized_preset || "",
      stats: stats || {},
    });
    return NextResponse.json({ loadout, message: "Loadout guardado con éxito" });
  } catch (error: any) {
    console.error("POST /api/loadouts error:", error);
    return NextResponse.json({ error: error.message || "Failed to create loadout" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, components, is_favorite, is_optimized, optimized_preset, stats } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updated = updateLoadout(id, {
      name,
      components,
      is_favorite,
      is_optimized,
      optimized_preset,
      stats,
    });
    if (!updated) {
      return NextResponse.json({ error: "Loadout not found" }, { status: 404 });
    }

    return NextResponse.json({ loadout: updated, message: "Loadout actualizado" });
  } catch (error: any) {
    console.error("PUT /api/loadouts error:", error);
    return NextResponse.json({ error: error.message || "Failed to update loadout" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const success = deleteLoadout(id);
    if (!success) {
      return NextResponse.json({ error: "Loadout not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Loadout eliminado" });
  } catch (error: any) {
    console.error("DELETE /api/loadouts error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete loadout" }, { status: 500 });
  }
}
