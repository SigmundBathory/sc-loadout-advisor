"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, X, BarChart3, Table2 } from "lucide-react";
import LoadoutRadarChart from "@/components/stats/LoadoutRadarChart";
import type { Loadout, Ship, Component } from "@/lib/types";
import { useAllLoadouts, useShips } from "@/lib/api/client";

interface LoadoutComparison {
  loadout: {
    id: string;
    name: string;
    ship_id: string;
    is_optimized: boolean;
    optimized_preset: string;
  };
  stats: any;
  components: Array<{ slotId: string; component: Component | undefined }>;
}

export default function ComparePage() {
  const router = useRouter();
  const { data: loadoutsData, isLoading: loadingLoadouts } = useAllLoadouts();
  const { data: shipsData, isLoading: loadingShips } = useShips();
  
  const [selectedLoadoutIds, setSelectedLoadoutIds] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<LoadoutComparison[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  
  const allLoadouts = useMemo(() => loadoutsData?.loadouts || [], [loadoutsData]);
  const allShips = useMemo(() => shipsData?.ships || [], [shipsData]);
  
  const shipMap = useMemo(() => {
    const map = new Map<string, Ship>();
    allShips.forEach((ship) => map.set(ship.id, ship));
    return map;
  }, [allShips]);
  
  // Cargar comparaciones cuando se seleccionan loadouts
  useEffect(() => {
    if (selectedLoadoutIds.length === 0) {
      setComparisons([]);
      return;
    }
    
    async function fetchComparisons() {
      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loadoutIds: selectedLoadoutIds }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setComparisons(data.comparisons || []);
        }
      } catch (error) {
        console.error("Error fetching comparisons:", error);
      }
    }
    
    fetchComparisons();
  }, [selectedLoadoutIds]);
  
  const handleAddLoadout = (loadoutId: string) => {
    if (selectedLoadoutIds.length >= 4) return;
    if (selectedLoadoutIds.includes(loadoutId)) return;
    setSelectedLoadoutIds([...selectedLoadoutIds, loadoutId]);
  };
  
  const handleRemoveLoadout = (loadoutId: string) => {
    setSelectedLoadoutIds(selectedLoadoutIds.filter((id) => id !== loadoutId));
  };
  
  const getShipName = (shipId: string) => {
    const ship = shipMap.get(shipId);
    return ship?.name || "Unknown Ship";
  };
  
  const getLoadoutName = (loadoutId: string) => {
    const loadout = allLoadouts.find((l) => l.id === loadoutId);
    return loadout?.name || "Unknown Loadout";
  };
  
  // Calcular stats máximos para el radar chart
  const maxStats = useMemo(() => {
    if (comparisons.length === 0) return null;
    
    let maxDps = 0;
    let maxShieldHp = 0;
    let maxShieldRegen = 0;
    let maxCoolingRate = 0;
    let maxQtRange = 0;
    let maxQtSpeed = 0;
    let maxCost = 0;
    
    for (const comp of comparisons) {
      maxDps = Math.max(maxDps, comp.stats.total_dps || 0);
      maxShieldHp = Math.max(maxShieldHp, comp.stats.shield_hp || 0);
      maxShieldRegen = Math.max(maxShieldRegen, comp.stats.shield_regen || 0);
      maxCoolingRate = Math.max(maxCoolingRate, comp.stats.cooling_rate || 0);
      maxQtRange = Math.max(maxQtRange, comp.stats.qt_range || 0);
      maxQtSpeed = Math.max(maxQtSpeed, comp.stats.qt_speed || 0);
      maxCost = Math.max(maxCost, comp.stats.total_cost || 0);
    }
    
    return {
      maxDps: maxDps || 1,
      maxShieldHp: maxShieldHp || 1,
      maxShieldRegen: maxShieldRegen || 1,
      maxCoolingRate: maxCoolingRate || 1,
      maxQtRange: maxQtRange || 1,
      maxQtSpeed: maxQtSpeed || 1,
      maxCost: maxCost || 1,
    };
  }, [comparisons]);
  
  if (loadingLoadouts || loadingShips) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Comparador de Loadouts</h1>
        </div>
        <p>Cargando loadouts...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Comparador de Loadouts</h1>
      </div>
      
      {/* Selector de loadouts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Loadouts para Comparar (máximo 4)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              onValueChange={(value: string | null) => {
                if (value && !selectedLoadoutIds.includes(value)) {
                  handleAddLoadout(value);
                }
              }}
              disabled={selectedLoadoutIds.length >= 4}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar un loadout..." />
              </SelectTrigger>
              <SelectContent>
                {allLoadouts.map((loadout) => (
                  <SelectItem
                    key={loadout.id}
                    value={loadout.id}
                    disabled={selectedLoadoutIds.includes(loadout.id)}
                  >
                    {loadout.name} - {getShipName(loadout.ship_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex flex-wrap gap-2">
              {selectedLoadoutIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
                >
                  <span className="text-sm">{getLoadoutName(id)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveLoadout(id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modo de visualización */}
      {selectedLoadoutIds.length > 0 && (
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === "chart" ? "default" : "outline"}
            onClick={() => setViewMode("chart")}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Gráfico Radar
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className="gap-2"
          >
            <Table2 className="h-4 w-4" />
            Tabla de Comparación
          </Button>
        </div>
      )}
      
      {/* Visualización de comparaciones */}
      {selectedLoadoutIds.length > 0 && comparisons.length > 0 && viewMode === "chart" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comparisons.map((comparison, index) => (
            <Card key={comparison.loadout.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{comparison.loadout.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {getShipName(comparison.loadout.ship_id)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LoadoutRadarChart
                  stats={{
                    totalDps: comparison.stats.total_dps || 0,
                    shieldHp: comparison.stats.shield_hp || 0,
                    shieldRegen: comparison.stats.shield_regen || 0,
                    hullHp: comparison.stats.hull_hp || 0,
                    coolingRate: comparison.stats.cooling_rate || 0,
                    quantumSpeed: comparison.stats.qt_speed || 0,
                    quantumRange: comparison.stats.qt_range || 0,
                  }}
                  shipShieldHp={0}
                  shipHullHp={0}
                  maxStats={maxStats || undefined}
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between">
                      <span>DPS Total:</span>
                      <span className="font-mono">{Math.round(comparison.stats.total_dps || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HP Escudo:</span>
                      <span className="font-mono">{Math.round(comparison.stats.shield_hp || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regen Escudo:</span>
                      <span className="font-mono">{Math.round(comparison.stats.shield_regen || 0)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Enfriamiento:</span>
                      <span className="font-mono">{Math.round(comparison.stats.cooling_rate || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alcance QT:</span>
                      <span className="font-mono">{Math.round(comparison.stats.qt_range || 0)} Mkm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coste Total:</span>
                      <span className="font-mono">{(comparison.stats.total_cost || 0).toLocaleString()} aUEC</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedLoadoutIds.length > 0 && comparisons.length > 0 && viewMode === "table" && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación Detallada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Loadout</th>
                    <th className="text-right p-2">DPS</th>
                    <th className="text-right p-2">HP Escudo</th>
                    <th className="text-right p-2">Regen</th>
                    <th className="text-right p-2">Enfriamiento</th>
                    <th className="text-right p-2">Alcance QT</th>
                    <th className="text-right p-2">Coste</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((comparison) => (
                    <tr key={comparison.loadout.id} className="border-b">
                      <td className="p-2">
                        <div className="font-medium">{comparison.loadout.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getShipName(comparison.loadout.ship_id)}
                        </div>
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Math.round(comparison.stats.total_dps || 0)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Math.round(comparison.stats.shield_hp || 0)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Math.round(comparison.stats.shield_regen || 0)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Math.round(comparison.stats.cooling_rate || 0)}
                      </td>
                      <td className="text-right p-2 font-mono">
                        {Math.round(comparison.stats.qt_range || 0)} Mkm
                      </td>
                      <td className="text-right p-2 font-mono">
                        {(comparison.stats.total_cost || 0).toLocaleString()} aUEC
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedLoadoutIds.length > 0 && comparisons.length === 0 && (
        <p className="text-muted-foreground">
          No se encontraron loadouts para comparar. Selecciona loadouts válidos.
        </p>
      )}
      
      {selectedLoadoutIds.length === 0 && (
        <Card className="text-center p-8">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Selecciona de 2 a 4 loadouts para compararlos lado a lado.
            </p>
            <p className="text-sm text-muted-foreground">
              Puedes comparar estadísticas como DPS, HP de escudo, regeneración, 
              enfriamiento, alcance cuántico y coste total.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
