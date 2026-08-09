"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLoadoutStore } from "@/stores/loadoutStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsIndicator } from "@/components/ui/tabs";
import { ShoppingCart, Settings, Crosshair, Zap, MapPin, Gauge } from "lucide-react";
import LoadoutRadarChart from "@/components/stats/LoadoutRadarChart";
import ShoppingList from "@/components/budget/ShoppingList";
import ShipBuyLocations from "@/components/ships/ShipBuyLocations";
import ShipStatsVisualizations from "@/components/stats/ShipStatsVisualizations";
import StatsPanel from "./StatsPanel";
import HardpointSchematic from "./HardpointSchematic";
import LoadoutHeader from "./LoadoutHeader";
import ComponentPickerDialog from "./ComponentPickerDialog";
import SaveLoadoutDialog from "./SaveLoadoutDialog";
import LoadLoadoutDialog from "./LoadLoadoutDialog";
import OptimizerDialog from "./OptimizerDialog";
import type { Ship, Loadout, Hardpoint } from "@/lib/types";
import type { ShipBuyLocation, WikeloShip } from "@/lib/db/queries";
import { calculateLoadoutStats } from "@/lib/optimizer/loadoutStats";
import { optimizeAssignments } from "@/lib/optimizer/optimizeLive";
import { useShipComponents, useLoadoutsByShip } from "@/lib/api/client";
import { decodeLoadoutShare, type ImportedLoadout } from "@/lib/loadout/share";

interface LoadoutBuilderProps {
  ship: Ship;
  locations: ShipBuyLocation[];
  wikelo?: WikeloShip | null;
}

export default function LoadoutBuilder({ ship, locations, wikelo }: LoadoutBuilderProps) {
  const {
    slotAssignments,
    setSlotAssignment,
    clearSlotAssignment,
    savedLoadouts,
    addSavedLoadout,
    loadedLoadout,
    setLoadedLoadout,
    lastOptimizedPreset,
    setLastOptimizedPreset,
  } = useLoadoutStore();
  const [selectedSlot, setSelectedSlot] = useState<Hardpoint | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const { data: availableComponents, isLoading: loadingComponents } = useShipComponents(ship);
  const components = useMemo(() => availableComponents || [], [availableComponents]);
  const componentMap = useMemo(
    () => new Map(components.map((c) => [c.id, c])),
    [components]
  );

  const assignedCount = Object.keys(slotAssignments).length;
  const totalSlots = ship.hardpoints.length;

  const stats = useMemo(() => {
    let totalDps = 0;
    let shieldHp = 0;
    let shieldRegen = 0;
    let powerOutput = 0;
    let coolingRate = 0;
    let quantumSpeed = 0;
    let totalCost = 0;
    let emissionEm = 0;

    Object.values(slotAssignments).forEach((compId) => {
      const comp = componentMap.get(compId);
      if (comp) {
        totalDps += comp.stats.dps || 0;
        shieldHp += comp.stats.hp || 0;
        shieldRegen += comp.stats.regen_rate || 0;
        powerOutput += comp.stats.output || comp.stats.power_segment_generation || 0;
        coolingRate += comp.stats.cooling_rate || 0;
        quantumSpeed = Math.max(quantumSpeed, comp.stats.travel_speed || 0);
        totalCost += comp.price_auec || 0;
        emissionEm += comp.stats.emission_em_max || 0;
      }
    });

    return { totalDps, shieldHp, shieldRegen, powerOutput, coolingRate, quantumSpeed, totalCost, emissionEm };
  }, [slotAssignments, componentMap]);

  const baselineStats = useMemo(() => {
    if (loadedLoadout?.stats) {
      const s = loadedLoadout.stats;
      return {
        totalDps: s.total_dps || 0,
        shieldHp: s.shield_hp || 0,
        shieldRegen: s.shield_regen || 0,
        powerOutput: s.power_output || 0,
        coolingRate: s.cooling_rate || 0,
        quantumSpeed: s.scm_speed || 0,
        totalCost: s.total_cost || 0,
        emissionEm: 0,
      };
    }
    return {
      totalDps: 0,
      shieldHp: ship.shield_hp || 0,
      shieldRegen: 0,
      powerOutput: 0,
      coolingRate: 0,
      quantumSpeed: 0,
      totalCost: 0,
      emissionEm: 0,
    };
  }, [loadedLoadout, ship]);

  const equippedComponentList = useMemo(() => {
    return Array.from(componentMap.values());
  }, [componentMap]);

  const { data: shipLoadouts } = useLoadoutsByShip(ship.id);
  useEffect(() => {
    const loadouts = shipLoadouts?.loadouts || [];
    if (loadouts.length > 0) {
      const latest = loadouts[0];
      setLoadedLoadout(latest);
      setLastOptimizedPreset(latest.optimized_preset || "");
      if (latest.components) {
        Object.entries(latest.components).forEach(([slotId, compId]) => {
          setSlotAssignment(slotId, compId);
        });
      }
    }
  }, [shipLoadouts, setLoadedLoadout, setLastOptimizedPreset, setSlotAssignment]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#loadout=")) return;
    const decoded = decodeLoadoutShare(hash.slice("#loadout=".length));
    if (!decoded || decoded.ship.id !== ship.id) return;
    Object.entries(decoded.components).forEach(([slotId, compId]) => {
      setSlotAssignment(slotId, compId);
    });
    if (decoded.name) {
      const current = useLoadoutStore.getState().loadedLoadout;
      setLoadedLoadout(current ? { ...current, name: decoded.name } : null);
    }
    setLastOptimizedPreset(decoded.preset || (decoded.optimized ? "shared" : ""));
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", cleanUrl);
  }, [ship.id, setLoadedLoadout, setLastOptimizedPreset, setSlotAssignment]);

  const handleImport = (imported: ImportedLoadout) => {
    Object.entries(imported.components).forEach(([slotId, compId]) => {
      setSlotAssignment(slotId, compId);
    });
    setLoadedLoadout({
      id: `imported_${Date.now()}`,
      name: imported.name,
      ship_id: imported.ship_id,
      components: imported.components,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
      is_optimized: imported.is_optimized,
      optimized_preset: imported.optimized_preset,
      stats: imported.stats,
    });
    setLastOptimizedPreset(imported.optimized_preset || "");
    setShowLoadDialog(false);
  };

  const loadComponentPicker = useCallback(() => {
    if (!selectedSlot) return null;

    const slotMaxSize = selectedSlot.max_size || selectedSlot.size;

    const compsForSlot = components.filter((c) => {
      const slotTypeMap: Record<string, string[]> = {
        weapon: ["Weapon"],
        turret: ["Weapon"],
        shield: ["Shield"],
        power_plant: ["PowerPlant"],
        powerplant: ["PowerPlant"],
        cooler: ["Cooler"],
        quantum_drive: ["QuantumDrive"],
        quantumdrive: ["QuantumDrive"],
        radar: ["Radar"],
        thruster: ["FlightController"],
        flight_controller: ["FlightController"],
        life_support: ["LifeSupport"],
        lifesupport: ["LifeSupport"],
      };
      const slotKey = selectedSlot.slot_type.toLowerCase().replace(/[-\s]/g, "_");
      const validTypes = slotTypeMap[slotKey] || [selectedSlot.slot_type];
      const typeMatch = validTypes.some(t => t.toLowerCase() === c.type.toLowerCase());
      const sizeMatch = c.size <= slotMaxSize;
      return typeMatch && sizeMatch;
    });

    return compsForSlot;
  }, [selectedSlot, components]);

  const pickerComponents = loadComponentPicker() || [];

  const handleOptimize = (preset: string) => {
    setOptimizing(true);
    setLastOptimizedPreset(preset);
    setTimeout(() => {
      const bestComponents = optimizeAssignments(ship, components, preset);
      bestComponents.forEach((compId, slotId) => {
        setSlotAssignment(slotId, compId);
      });
      if (loadedLoadout) {
        const newAssignments: Record<string, string> = {};
        bestComponents.forEach((compId, slotId) => { newAssignments[slotId] = compId; });
        const newStats = calculateLoadoutStats(ship, newAssignments, componentMap);
        setLoadedLoadout({ ...loadedLoadout, stats: newStats, is_optimized: true, optimized_preset: preset });
      }
      setOptimizing(false);
    }, 1200);
  };

  const handleMoveComponent = (fromSlotId: string, toSlotId: string) => {
    const fromComp = slotAssignments[fromSlotId];
    const toComp = slotAssignments[toSlotId];
    setSlotAssignment(fromSlotId, toComp || "");
    setSlotAssignment(toSlotId, fromComp || "");
  };

  const handleSaveLoadout = async (name: string) => {
    const isOptimized = !!lastOptimizedPreset || !!loadedLoadout?.is_optimized;
    const loadoutStats = calculateLoadoutStats(ship, slotAssignments, componentMap);
    const newLoadout: Loadout = {
      id: loadedLoadout?.id?.startsWith("imported_") ? `loadout_${Date.now()}` : (loadedLoadout?.id || `loadout_${Date.now()}`),
      name,
      ship_id: ship.id,
      components: { ...slotAssignments },
      created_at: loadedLoadout?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: loadedLoadout?.is_favorite || false,
      is_optimized: isOptimized,
      optimized_preset: lastOptimizedPreset || loadedLoadout?.optimized_preset || "",
      stats: loadoutStats,
    };

    addSavedLoadout(newLoadout);
    setLoadedLoadout(newLoadout);

    try {
      const res = await fetch("/api/loadouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ship_id: ship.id,
          components: slotAssignments,
          is_optimized: isOptimized,
          optimized_preset: lastOptimizedPreset || loadedLoadout?.optimized_preset || "",
          stats: loadoutStats,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const saved = { ...newLoadout, id: data.loadout?.id || newLoadout.id };
        addSavedLoadout(saved);
        setLoadedLoadout(saved);
      }
    } catch (error) {
      console.error("Error saving loadout:", error);
    }
  };

  const handleLoadPreset = (loadout: Loadout) => {
    if (loadout.components) {
      Object.entries(loadout.components).forEach(([slotId, compId]) => {
        setSlotAssignment(slotId, compId);
      });
    }
    setLoadedLoadout(loadout);
    setLastOptimizedPreset(loadout.optimized_preset || "");
  };

  return (
    <Tabs defaultValue="loadout" className="w-full">
      <TabsList className="glass-panel border border-border/40 p-1 bg-muted/30 rounded-xl">
        <TabsIndicator className="bg-background/80 backdrop-blur-sm border border-border/40 rounded-lg shadow-sm" />
        <TabsTrigger
          value="loadout"
          className="relative z-10 rounded-lg font-semibold"
        >
          <Settings className="h-4 w-4 mr-1.5" /> Loadout Builder
        </TabsTrigger>
        <TabsTrigger
          value="specs"
          className="relative z-10 rounded-lg font-semibold"
        >
          <Gauge className="h-4 w-4 mr-1.5" /> Especificaciones
        </TabsTrigger>
        <TabsTrigger
          value="locations"
          className="relative z-10 rounded-lg font-semibold"
        >
          <MapPin className="h-4 w-4 mr-1.5" /> Ubicaciones
        </TabsTrigger>
      </TabsList>

      {/* ===== TAB: LOADOUT BUILDER ===== */}
      <TabsContent value="loadout" className="mt-4 space-y-6">
        <LoadoutHeader
          shipName={ship.name}
          loadedLoadout={loadedLoadout}
          lastOptimizedPreset={lastOptimizedPreset}
          onLoad={() => setShowLoadDialog(true)}
          onOptimize={() => setShowOptimizer(true)}
          onSave={() => setShowSaveDialog(true)}
          optimizing={optimizing}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <StatsPanel stats={stats} assignedCount={assignedCount} totalSlots={totalSlots} baseline={baselineStats} />
          </div>

          <div className="lg:col-span-5">
            <Card className="glass-panel border-border/40">
              <CardHeader className="p-4 border-b border-border/30 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" />
                  Esquema de Hardpoints
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <HardpointSchematic
                  ship={ship}
                  slotAssignments={slotAssignments}
                  componentMap={componentMap}
                  onSlotClick={setSelectedSlot}
                  onClearSlot={clearSlotAssignment}
                  onMoveComponent={handleMoveComponent}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="glass-panel border-border/40 h-full">
              <CardHeader className="p-4 border-b border-border/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Métricas del Loadout
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <LoadoutRadarChart
                  stats={{
                    totalDps: stats.totalDps,
                    shieldHp: stats.shieldHp,
                    hullHp: ship.hull_hp || 0,
                    powerOutput: stats.powerOutput,
                    coolingRate: stats.coolingRate,
                  }}
                  shipStats={{
                    hull_hp: ship.hull_hp || 0,
                    scm_speed: ship.scm_speed || 0,
                    max_speed: ship.max_speed || 0,
                    shield_hp: stats.shieldHp,
                    totalDps: stats.totalDps,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs internas: Compra + Shopping List */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="glass-panel border border-border/40 p-1 bg-muted/30 rounded-xl">
            <TabsIndicator className="bg-background/80 backdrop-blur-sm border border-border/40 rounded-lg shadow-sm" />
            <TabsTrigger value="summary" className="relative z-10 rounded-lg font-semibold">
              <Zap className="h-4 w-4 mr-1.5" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="shopping" className="relative z-10 rounded-lg font-semibold">
              <ShoppingCart className="h-4 w-4 mr-1.5" /> Comprar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <Card className="glass-panel border-border/40">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold">Resumen de Compra</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Coste Total Loadout</span>
                      <span className="font-mono font-bold text-amber-400">{stats.totalCost.toLocaleString()} aUEC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Mejoras Instaladas</span>
                      <span className="font-mono font-bold">{assignedCount} / {totalSlots}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shopping" className="mt-4">
            <ShoppingList components={equippedComponentList} />
          </TabsContent>
        </Tabs>
      </TabsContent>

      {/* ===== TAB: ESPECIFICACIONES ===== */}
      <TabsContent value="specs" className="mt-4">
        <ShipStatsVisualizations ship={ship} />
      </TabsContent>

      {/* ===== TAB: UBICACIONES ===== */}
      <TabsContent value="locations" className="mt-4">
        <ShipBuyLocations locations={locations} wikelo={wikelo} />
      </TabsContent>

      {/* ===== DIALOGS ===== */}
      <ComponentPickerDialog
        slot={selectedSlot}
        components={pickerComponents}
        loading={loadingComponents}
        equippedId={selectedSlot ? slotAssignments[selectedSlot.id] : null}
        onSelect={(comp) => {
          if (selectedSlot) {
            setSlotAssignment(selectedSlot.id, comp.id);
            setSelectedSlot(null);
          }
        }}
        onClose={() => setSelectedSlot(null)}
      />

      <SaveLoadoutDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        ship={ship}
        onSave={handleSaveLoadout}
      />

      <LoadLoadoutDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        loadouts={savedLoadouts}
        ship={ship}
        onSelect={handleLoadPreset}
        onImport={handleImport}
      />

      <OptimizerDialog
        open={showOptimizer}
        onOpenChange={setShowOptimizer}
        onOptimize={handleOptimize}
        optimizing={optimizing}
      />
    </Tabs>
  );
}
