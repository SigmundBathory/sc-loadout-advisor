"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLoadoutStore } from "@/stores/loadoutStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Upload, Wand2, ShoppingCart, Zap, Settings } from "lucide-react";
import LoadoutRadarChart from "@/components/stats/LoadoutRadarChart";
import ShoppingList from "@/components/budget/ShoppingList";
import ShipInfoCard from "./ShipInfoCard";
import StatsPanel from "./StatsPanel";
import SlotList from "./SlotList";
import ComponentPickerDialog from "./ComponentPickerDialog";
import SaveLoadoutDialog from "./SaveLoadoutDialog";
import LoadLoadoutDialog from "./LoadLoadoutDialog";
import OptimizerDialog from "./OptimizerDialog";
import type { Ship, Loadout, Hardpoint } from "@/lib/types";
import { calculateLoadoutStats } from "@/lib/optimizer/loadoutStats";
import { optimizeAssignments } from "@/lib/optimizer/optimizeLive";
import { useShipComponents, useLoadoutsByShip } from "@/lib/api/client";
import { decodeLoadoutShare, type ImportedLoadout } from "@/lib/loadout/share";

export default function LoadoutBuilder({ ship }: { ship: Ship }) {
  const router = useRouter();
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

  // Auto-load the most recent saved loadout for this ship
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

  // Deep-link support: apply a shared loadout from the URL hash (#loadout=SCLA:...)
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
      return validTypes.some(t => t.toLowerCase() === c.type.toLowerCase());
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
      setOptimizing(false);
    }, 1200);
  };

  const handleSaveLoadout = async (name: string) => {
    const isOptimized = !!lastOptimizedPreset || !!loadedLoadout?.is_optimized;
    const loadoutStats = calculateLoadoutStats(ship, slotAssignments, componentMap);
    const newLoadout: Loadout = {
      id: `loadout_${Date.now()}`,
      name,
      ship_id: ship.id,
      components: { ...slotAssignments },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
      is_optimized: isOptimized,
      optimized_preset: lastOptimizedPreset || loadedLoadout?.optimized_preset || "",
      stats: loadoutStats,
    };

    addSavedLoadout(newLoadout);

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
        newLoadout.id = data.loadout?.id || newLoadout.id;
        addSavedLoadout(newLoadout);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => router.push("/ships")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Naves
        </Button>

        {(loadedLoadout || lastOptimizedPreset) && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground max-w-[240px] truncate">
              {loadedLoadout?.name || ship.name}
            </span>
            {lastOptimizedPreset || loadedLoadout?.is_optimized ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                <Wand2 className="h-3 w-3 mr-1" />
                Optimizada
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-500/30">
                Estándar
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 border-border/40 text-xs font-medium hover:bg-muted/40"
            onClick={() => setShowLoadDialog(true)}
          >
            <Upload className="h-4 w-4" />
            Cargar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 border-border/40 text-xs font-medium hover:bg-muted/40"
            onClick={() => setShowOptimizer(true)}
            disabled={optimizing}
          >
            <Wand2 className="h-4 w-4" />
            {optimizing ? "Optimizando..." : "Optimizar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 border-border/40 text-xs font-medium hover:bg-muted/40"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <ShipInfoCard ship={ship} />
          <StatsPanel stats={stats} assignedCount={assignedCount} totalSlots={totalSlots} baseline={baselineStats} />
        </div>

        <div className="lg:col-span-5">
          <Card className="glass-panel border-border/40">
            <CardHeader className="p-4 border-b border-border/30 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Configuración Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <SlotList
                ship={ship}
                slotAssignments={slotAssignments}
                componentMap={componentMap}
                onSlotClick={setSelectedSlot}
                onClearSlot={clearSlotAssignment}
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

      <Tabs defaultValue="loadout" className="w-full">
        <TabsList className="glass-panel border border-border/40 p-1 bg-muted/30 rounded-xl">
          <TabsTrigger
            value="loadout"
            className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-semibold"
          >
            <Zap className="h-4 w-4 mr-2" /> Loadout
          </TabsTrigger>
          <TabsTrigger
            value="shopping"
            className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-semibold"
          >
            <ShoppingCart className="h-4 w-4 mr-2" /> Comprar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loadout" className="mt-4">
          <Card className="glass-panel border-border/40">
            <CardHeader className="p-4 border-b border-border/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Compra y Optimización
              </CardTitle>
            </CardHeader>
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
    </div>
  );
}
