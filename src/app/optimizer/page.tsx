"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsIndicator } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useLoadoutStore } from "@/stores/loadoutStore";
import { Wand2, Gauge, ShoppingCart, Zap } from "lucide-react";
import ShipSelector from "@/components/optimizer/ShipSelector";
import PresetSliders from "@/components/optimizer/PresetSliders";
import SlotTypeSelector from "@/components/optimizer/SlotTypeSelector";
import BudgetInput from "@/components/optimizer/BudgetInput";
import ResultHeader from "@/components/optimizer/ResultHeader";
import ComponentListTab from "@/components/optimizer/ComponentListTab";
import LoadoutRadarChart from "@/components/stats/LoadoutRadarChart";
import ShoppingList from "@/components/budget/ShoppingList";
import Breadcrumb from "@/components/Breadcrumb";
import { AnimatedIcon } from "@/components/motion/AnimatedIcon";
import type { Component, OptimizeResult } from "@/lib/types";

export default function OptimizerPage() {
  const router = useRouter();
  const [selectedShipId, setSelectedShipId] = useState("");
  const [activePreset, setActivePreset] = useState("balanced");
  const [weights, setWeights] = useState({ dps: 20, defense: 20, speed: 20, range: 20, cost: 20 });
  const [selectedSlotTypes, setSelectedSlotTypes] = useState<string[]>(["weapon", "shield", "quantum_drive", "power_plant", "cooler", "missile"]);
  const [maxBudget, setMaxBudget] = useState<number | undefined>();
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  const { addSavedLoadout, setCurrentLoadout } = useLoadoutStore();

  function toggleSlotType(slotType: string) {
    if (selectedSlotTypes.includes(slotType)) {
      if (selectedSlotTypes.length === 1) return;
      setSelectedSlotTypes(selectedSlotTypes.filter((t) => t !== slotType));
    } else {
      setSelectedSlotTypes([...selectedSlotTypes, slotType]);
    }
  }

  async function handleOptimize() {
    if (!selectedShipId) return;
    setOptimizing(true);
    setResult(null);

    const totalWeight = weights.dps + weights.defense + weights.speed + weights.range + weights.cost || 1;
    const normalizedWeights = {
      dps: weights.dps / totalWeight,
      defense: weights.defense / totalWeight,
      speed: weights.speed / totalWeight,
      range: weights.range / totalWeight,
      cost: weights.cost / totalWeight,
    };

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ship_id: selectedShipId,
          weights: normalizedWeights,
          target_slots: selectedSlotTypes,
          max_budget: maxBudget,
          preset: activePreset,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error("Optimization failed:", e);
    }
    setOptimizing(false);
  }

  function handleApplyToBuilder() {
    if (!result?.ship || !result?.optimization?.selected) return;
    const slotAssignments: Record<string, string> = {};
    for (const sel of result.optimization.selected) {
      slotAssignments[sel.slotId] = sel.component.id;
    }
    setCurrentLoadout({
      id: `opt_${Date.now()}`,
      name: `${result.ship.name} (Optimizado)`,
      ship_id: result.ship.id,
      components: slotAssignments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
    });
    router.push(`/ships/${result.ship.id}`);
  }

  async function handleSaveLoadout() {
    if (!result?.ship || !result?.optimization?.selected) return;
    const slotAssignments: Record<string, string> = {};
    for (const sel of result.optimization.selected) {
      slotAssignments[sel.slotId] = sel.component.id;
    }
    const nameToSave = `${result.ship.name} Configuración Optimizada`;

    try {
      const res = await fetch("/api/loadouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameToSave, ship_id: result.ship.id, components: slotAssignments }),
      });
      const data = await res.json();
      if (data.loadout) {
        addSavedLoadout(data.loadout);
        setSavedMsg("¡Loadout optimizado guardado con éxito!");
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch (e) {
      console.error("Save loadout error:", e);
    }
  }

  const selectedComponentsList: Component[] =
    result?.optimization?.selected?.map((sel) => sel.component).filter(Boolean) || [];

  const qdComponent = selectedComponentsList.find((c) => c.type === "QuantumDrive");

  return (
    <div className="flex-1 flex flex-col">
      <main className="container mx-auto px-4 py-6 flex-1 space-y-6">
        <Breadcrumb items={[{ label: "Optimizador" }]} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <ShipSelector selectedShipId={selectedShipId} onSelect={setSelectedShipId} />
            <PresetSliders weights={weights} activePreset={activePreset} onPresetChange={setActivePreset} onWeightsChange={setWeights} />
            <SlotTypeSelector selectedTypes={selectedSlotTypes} onToggle={toggleSlotType} />
            <BudgetInput maxBudget={maxBudget} onBudgetChange={setMaxBudget} onOptimize={handleOptimize} disabled={!selectedShipId} optimizing={optimizing} />
          </div>

          <div className="lg:col-span-7">
            {result ? (
              <div className="space-y-5">
                <ResultHeader
                  ship={result.ship}
                  result={result}
                  qdComponent={qdComponent}
                  onApplyToBuilder={handleApplyToBuilder}
                  onSave={handleSaveLoadout}
                  savedMsg={savedMsg}
                />

                {qdComponent && (
                  <Card className="glass-panel border-cyan-500/30 bg-cyan-950/10">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-extrabold text-foreground">{qdComponent.name}</h3>
                          <p className="text-xs text-muted-foreground">{qdComponent.manufacturer?.name || "Desconocido"}</p>
                        </div>
                        <div className="text-amber-400 font-mono font-bold text-sm">
                          {qdComponent.price_auec ? `${qdComponent.price_auec.toLocaleString()} aUEC` : "N/A"}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-muted/40 p-2.5 rounded-xl border border-border/30">
                        <div>
                          <span className="text-muted-foreground text-[10px] block font-sans">Velocidad Salto</span>
                          <span className="text-cyan-300 font-bold">{qdComponent.stats?.travel_speed ? `${qdComponent.stats.travel_speed.toLocaleString()} km/s` : "Normal"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block font-sans">Tiempo Spool</span>
                          <span className="text-foreground font-bold">{qdComponent.stats?.spool_time || 3}s</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block font-sans">Capacidad Fuel</span>
                          <span className="text-amber-300 font-bold">{qdComponent.stats?.quantum_fuel_claimed ? `${qdComponent.stats.quantum_fuel_claimed} µSCU` : "Standard"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Tabs defaultValue="components" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 glass-panel p-1 rounded-2xl border-border/40">
                    <TabsIndicator className="bg-background/70 backdrop-blur-sm border border-border/40 rounded-xl shadow-sm" />
                    <TabsTrigger value="components" className="relative z-10 rounded-xl text-xs font-bold gap-1.5">
                      <Zap className="h-3.5 w-3.5" /> Componentes ({result.optimization?.selected?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="shopping" className="relative z-10 rounded-xl text-xs font-bold gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                    </TabsTrigger>
                    <TabsTrigger value="radar" className="relative z-10 rounded-xl text-xs font-bold gap-1.5">
                      <Gauge className="h-3.5 w-3.5" /> Radar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="components" className="mt-4">
                    <ComponentListTab components={result.optimization?.selected || []} />
                  </TabsContent>

                  <TabsContent value="shopping" className="mt-4">
                    <ShoppingList components={selectedComponentsList} />
                  </TabsContent>

                  <TabsContent value="radar" className="mt-4">
                    <Card className="glass-panel border-border/40 p-4">
                      <CardContent className="p-2">
                        <LoadoutRadarChart
                          stats={{
                            totalDps: result.stats?.total_dps || 0,
                            shieldHp: result.stats?.shield_hp || 0,
                            hullHp: result.ship?.hull_hp || 0,
                            powerOutput: result.stats?.power_output || 0,
                            coolingRate: result.stats?.cooling_rate || 0,
                          }}
                          shipStats={{
                            hull_hp: result.ship?.hull_hp || 0,
                            scm_speed: result.ship?.scm_speed || 0,
                            max_speed: result.ship?.max_speed || 0,
                            shield_hp: result.stats?.shield_hp || 0,
                            totalDps: result.stats?.total_dps || 0,
                          }}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="glass-panel border-border/40 min-h-[500px] flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground space-y-4 p-8">
                  <AnimatedIcon className="h-16 w-16 mx-auto text-primary/50">
                    <Wand2 className="h-full w-full" />
                  </AnimatedIcon>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">Configura tus Prioridades y Presiona &quot;Ejecutar Optimización&quot;</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Ajusta los controles de armas, defensa, viajes quantum y coste para obtener un loadout exacto con tiendas, precios y métricas completas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
