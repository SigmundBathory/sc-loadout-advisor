import { NextResponse } from "next/server";
import { getLoadoutById, getComponentsByIds } from "@/lib/db/queries";
import { calculateLoadoutStats } from "@/lib/optimizer/loadoutStats";
import type { Loadout, Component } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loadoutIds } = body;
    
    if (!loadoutIds || !Array.isArray(loadoutIds) || loadoutIds.length === 0) {
      return NextResponse.json(
        { error: "loadoutIds is required and must be an array" },
        { status: 400 }
      );
    }
    
    if (loadoutIds.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 loadouts can be compared at once" },
        { status: 400 }
      );
    }
    
    // Obtener todos los loadouts
    const loadouts: Loadout[] = [];
    for (const id of loadoutIds) {
      const loadout = getLoadoutById(id);
      if (loadout) {
        loadouts.push(loadout);
      }
    }
    
    if (loadouts.length === 0) {
      return NextResponse.json(
        { error: "No loadouts found" },
        { status: 404 }
      );
    }
    
    // Obtener todos los componentes necesarios
    const allComponentIds = new Set<string>();
    for (const loadout of loadouts) {
      Object.values(loadout.components || {}).forEach((compId) => {
        if (compId) allComponentIds.add(compId);
      });
    }
    
    const components = getComponentsByIds(Array.from(allComponentIds));
    const componentMap = new Map<string, Component>(
      components.map((c) => [c.id, c])
    );
    
    // Calcular stats para cada loadout
    const comparisons = [];
    for (const loadout of loadouts) {
      // Obtener la nave asociada
      const ship = loadouts[0]?.ship_id === loadout.ship_id 
        ? { id: loadout.ship_id, hull_hp: 0, shield_hp: 0 } // Simplificado
        : { id: loadout.ship_id, hull_hp: 0, shield_hp: 0 };
      
      const stats = calculateLoadoutStats(
        ship as any,
        loadout.components || {},
        componentMap
      );
      
      comparisons.push({
        loadout: {
          id: loadout.id,
          name: loadout.name,
          ship_id: loadout.ship_id,
          is_optimized: loadout.is_optimized,
          optimized_preset: loadout.optimized_preset,
        },
        stats,
        components: Object.entries(loadout.components || {}).map(([slotId, compId]) => {
          const comp = componentMap.get(compId);
          return { slotId, component: comp };
        }),
      });
    }
    
    return NextResponse.json({ comparisons });
  } catch (error) {
    console.error("Error comparing loadouts:", error);
    return NextResponse.json(
      { error: "Failed to compare loadouts" },
      { status: 500 }
    );
  }
}
