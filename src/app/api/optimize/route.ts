import { NextResponse } from "next/server";
import { getShipById, getAllComponents } from "@/lib/db/queries";
import { optimizeLoadout, FILTER_PRESETS, calculateLoadoutStats } from "@/lib/optimizer/scoring";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ship_id, weights, max_budget, preset, target_slots } = body;

    if (!ship_id) {
      return NextResponse.json({ error: "ship_id is required" }, { status: 400 });
    }

    const ship = getShipById(ship_id);
    if (!ship) {
      return NextResponse.json({ error: "Ship not found" }, { status: 404 });
    }

    let filterWeights = weights;
    if (preset && (!weights || Object.keys(weights).length === 0)) {
      const presetDef = FILTER_PRESETS.find((p) => p.name === preset);
      if (presetDef) {
        filterWeights = presetDef.weights;
      }
    }

    if (!filterWeights) {
      filterWeights = FILTER_PRESETS.find((p) => p.name === "balanced")!.weights;
    }

    const result = optimizeLoadout(ship, filterWeights, max_budget, target_slots);


    // Calculate stats for the optimized loadout
    const componentMap = new Map<string, any>();
    const allComps = getAllComponents();
    for (const c of allComps) {
      componentMap.set(c.id, c);
    }

    const componentIds: Record<string, string> = {};
    for (const sel of result.selected) {
      componentIds[sel.slotId] = sel.component.id;
    }

    const stats = calculateLoadoutStats(ship, componentIds, componentMap);

    return NextResponse.json({
      ship,
      optimization: result,
      stats,
      preset: preset || "custom",
    });
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json(
      { error: "Optimization failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
