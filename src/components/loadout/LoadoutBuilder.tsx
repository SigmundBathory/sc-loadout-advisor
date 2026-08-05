"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLoadoutStore } from "@/stores/loadoutStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Upload, Wand2, RotateCcw, ShoppingCart, Crosshair, Shield, Zap, Settings } from "lucide-react";
import LoadoutRadarChart from "@/components/stats/LoadoutRadarChart";
import ShoppingList from "@/components/budget/ShoppingList";
import ShipInfoCard from "./ShipInfoCard";
import StatsPanel from "./StatsPanel";
import SlotList from "./SlotList";
import ComponentPickerDialog from "./ComponentPickerDialog";
import SaveLoadoutDialog from "./SaveLoadoutDialog";
import LoadLoadoutDialog from "./LoadLoadoutDialog";
import OptimizerDialog from "./OptimizerDialog";
import type { Ship, Component, Loadout, Hardpoint } from "@/lib/types";

export default function LoadoutBuilder({ ship }: { ship: Ship }) {
  const router = useRouter();
  const { slotAssignments, setSlotAssignment, clearSlotAssignment, savedLoadouts, setSavedLoadouts, addSavedLoadout } = useLoadoutStore();
  const [selectedSlot, setSelectedSlot] = useState<Hardpoint | null>(null);
  const [availableComponents, setAvailableComponents] = useState<Component[]>([]);
  const [componentMap, setComponentMap] = useState<Map<string, Component>>(new Map());
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

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

  const equippedComponentList = useMemo(() => {
    return Array.from(componentMap.values());
  }, [componentMap]);

  useEffect(() => {
    if (!ship.hardpoints.length) return;

    const fetchComponents = async () => {
      setLoadingComponents(true);
      try {
        const ids = ship.hardpoints.map(hp => hp.component_id).filter(Boolean);
        if (ids.length > 0) {
          const res = await fetch(`/api/components?ids=${ids.join(",")}`);
          if (res.ok) {
            const data = await res.json();
            const components: Component[] = data.components || [];
            setAvailableComponents(components);
            const map = new Map<string, Component>();
            components.forEach(c => map.set(c.id, c));
            setComponentMap(map);
          }
        }
      } finally {
        setLoadingComponents(false);
      }
    };

    fetchComponents();
  }, [ship.hardpoints]);

  const loadComponentPicker = useCallback(() => {
    if (!selectedSlot) return null;

    const compsForSlot = availableComponents.filter((c) => {
      const slotTypeMap: Record<string, string[]> = {
        weapon: ["Weapon"],
        turret: ["Weapon"],
        shield: ["Shield"],
        powerplant: ["PowerPlant"],
        cooler: ["Cooler"],
        quantumdrive: ["QuantumDrive"],
        radar: ["Radar"],
        flight_controller: ["FlightController"],
        lifesupport: ["LifeSupport"],
      };
      const validTypes = slotTypeMap[selectedSlot.slot_type] || [selectedSlot.slot_type];
      return validTypes.some(t => t.toLowerCase() === c.type.toLowerCase());
    });

    return compsForSlot;
  }, [selectedSlot, availableComponents]);

  const pickerComponents = loadComponentPicker() || [];

  const handleOptimize = (preset: string) => {
    setOptimizing(true);
    setTimeout(() => {
      const bestComponents = new Map<string, string>();
      ship.hardpoints.forEach((hp) => {
        const slotType = hp.slot_type.toLowerCase();
        const validTypes: Record<string, string[]> = {
          weapon: ["weapon"],
          turret: ["weapon"],
          shield: ["shield"],
          powerplant: ["powerplant"],
          cooler: ["cooler"],
          quantumdrive: ["quantumdrive"],
          radar: ["radar"],
          flight_controller: ["flightcontroller"],
          lifesupport: ["lifesupport"],
        };
        const types = validTypes[slotType] || [slotType];
        const compatible = availableComponents.filter(c => types.includes(c.type.toLowerCase()));

        if (compatible.length > 0) {
          const scored = compatible.map(comp => {
            let score = 0;
            const dps = comp.stats.dps || 0;
            const hp = comp.stats.hp || 0;
            const output = comp.stats.output || 0;
            const range = comp.stats.range || 0;
            const speed = comp.stats.travel_speed || 0;

            switch (preset) {
              case "fastest":
                if (comp.type === "QuantumDrive") score = speed || range;
                else if (comp.type === "PowerPlant") score = output;
                else score = output + dps * 0.5;
                break;
              case "max_range":
                if (comp.type === "QuantumDrive") score = range;
                else if (comp.type === "PowerPlant") score = output;
                else score = range + hp * 0.5;
                break;
              case "best_weapons":
                if (comp.type === "Weapon") score = dps * 10;
                else if (comp.type === "Shield") score = hp * 2;
                else if (comp.type === "PowerPlant") score = output;
                else score = 1;
                break;
              case "best_defense":
                if (comp.type === "Shield") score = hp * 10;
                else if (comp.type === "PowerPlant") score = output;
                else score = hp + output * 0.5;
                break;
              case "cheapest":
                score = 500000 - (comp.price_auec || 0);
                break;
              case "balanced":
              default:
                score = dps * 2 + hp / 5 + output / 50 + speed / 50000 + (comp.stats.regen_rate || 0) / 10;
                break;
            }
            return { comp, score };
          });

          scored.sort((a, b) => b.score - a.score);
          bestComponents.set(hp.id, scored[0].comp.id);
        }
      });

      bestComponents.forEach((compId, slotId) => {
        setSlotAssignment(slotId, compId);
      });

      setOptimizing(false);
    }, 1200);
  };

  const handleSaveLoadout = async (name: string) => {
    const newLoadout: Loadout = {
      id: `loadout_${Date.now()}`,
      name,
      ship_id: ship.id,
      components: { ...slotAssignments },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
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
          is_template: false,
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
          <StatsPanel stats={stats} assignedCount={assignedCount} totalSlots={totalSlots} />
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
        slotAssignments={slotAssignments}
        onSave={handleSaveLoadout}
      />

      <LoadLoadoutDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        loadouts={savedLoadouts}
        onSelect={handleLoadPreset}
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
