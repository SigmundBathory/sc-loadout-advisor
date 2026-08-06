"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import SyncIndicator from "@/components/sync/SyncIndicator";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Ship, Loadout } from "@/lib/types";
import { GitCompare, Plus, X } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function ComparePage() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [selectedShips, setSelectedShips] = useState<Ship[]>([]);
  const [search, setSearch] = useState("");
  const [loadoutsByShip, setLoadoutsByShip] = useState<Record<string, Loadout>>({});

  useEffect(() => {
    fetch("/api/ships?withDps=true")
      .then((r) => r.json())
      .then((d) => setShips(d.ships || []));
  }, []);

  useEffect(() => {
    fetch("/api/loadouts")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, Loadout> = {};
        (d.loadouts || []).forEach((l: Loadout) => {
          if (!map[l.ship_id] || l.updated_at > map[l.ship_id].updated_at) {
            map[l.ship_id] = l;
          }
        });
        setLoadoutsByShip(map);
      })
      .catch(() => {});
  }, []);

  function loadoutFor(ship: Ship): Loadout | undefined {
    return loadoutsByShip[ship.id];
  }

  function statsFor(ship: Ship) {
    const l = loadoutFor(ship);
    if (l?.stats) {
      return l.stats;
    }
    return {
      total_dps: (ship as any).dps || 0,
      shield_hp: ship.shield_hp,
      shield_regen: 0,
      power_output: 0,
      cooling_rate: 0,
      qt_range: 0,
      total_cost: 0,
    };
  }

  const filteredShips = ships.filter(
    (s) =>
      !selectedShips.find((ss) => ss.id === s.id) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.manufacturer.name.toLowerCase().includes(search.toLowerCase()))
  );

  function addShip(ship: Ship) {
    if (selectedShips.length < 4) {
      setSelectedShips([...selectedShips, ship]);
      setSearch("");
    }
  }

  function removeShip(shipId: string) {
    setSelectedShips(selectedShips.filter((s) => s.id !== shipId));
  }

  const radarData = [
    {
      stat: "DPS",
      ...Object.fromEntries(
        selectedShips.map((s, i) => [`ship${i}`, (statsFor(s).total_dps || 0) / 10])
      ),
    },
    {
      stat: "Escudos",
      ...Object.fromEntries(
        selectedShips.map((s, i) => [`ship${i}`, (statsFor(s).shield_hp || s.shield_hp) / 100])
      ),
    },
    {
      stat: "Casco",
      ...Object.fromEntries(
        selectedShips.map((s, i) => [`ship${i}`, s.hull_hp / 1000])
      ),
    },
    {
      stat: "Velocidad",
      ...Object.fromEntries(
        selectedShips.map((s, i) => [`ship${i}`, s.scm_speed / 10])
      ),
    },
    {
      stat: "Tripulacion",
      ...Object.fromEntries(
        selectedShips.map((s, i) => [`ship${i}`, s.crew * 10])
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <main className="container mx-auto px-4 py-6 flex-1 space-y-6">
        <Breadcrumb items={[{ label: "Comparar Naves" }]} />

        {/* Ship Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selecciona 2-4 naves para comparar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedShips.map((ship) => (
                <Badge key={ship.id} variant="default" className="gap-1 pr-1">
                  {ship.name}
                  <button
                    onClick={() => removeShip(ship.id)}
                    className="ml-1 hover:bg-primary-foreground/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedShips.length < 4 && (
                <Input
                  placeholder="Agregar nave..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 h-7 text-xs"
                />
              )}
            </div>
            {search && (
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {filteredShips.slice(0, 20).map((ship) => (
                  <div
                    key={ship.id}
                    className="p-2 hover:bg-muted cursor-pointer text-sm flex items-center gap-2"
                    onClick={() => addShip(ship)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>{ship.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {ship.manufacturer.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedShips.length >= 2 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Comparacion Visual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="stat" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    {selectedShips.map((_, i) => (
                      <Radar
                        key={i}
                        name={selectedShips[i].name}
                        dataKey={`ship${i}`}
                        stroke={COLORS[i]}
                        fill={COLORS[i]}
                        fillOpacity={0.15}
                      />
                    ))}
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stats Table */}
            <Card>
              <CardHeader>
                <CardTitle>Estadisticas Detalladas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-muted-foreground">Stat</th>
                        {selectedShips.map((s) => (
                          <th key={s.id} className="text-right p-2">
                            {s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Fabricante", get: (s: Ship) => s.manufacturer.name },
                        { label: "Clasificacion", get: (s: Ship) => s.classification },
                        { label: "Crew", get: (s: Ship) => s.crew.toString() },
                        { label: "Masa (kg)", get: (s: Ship) => s.mass?.toLocaleString() },
                        { label: "SCM Speed", get: (s: Ship) => `${s.scm_speed} m/s` },
                        { label: "Max Speed", get: (s: Ship) => `${s.max_speed} m/s` },
                        { label: "Hull HP", get: (s: Ship) => s.hull_hp?.toLocaleString() },
                        { label: "Shield HP", get: (s: Ship) => s.shield_hp?.toLocaleString() },
                        { label: "Cargo (SCU)", get: (s: Ship) => s.cargo_capacity.toString() },
                        { label: "Slots", get: (s: Ship) => s.hardpoints?.length?.toString() || "0" },
                        { label: "DPS (loadout)", get: (s: Ship) => statsFor(s).total_dps?.toLocaleString() || "—" },
                        { label: "Potencia (loadout)", get: (s: Ship) => statsFor(s).power_output?.toLocaleString() || "—" },
                        { label: "Refrigeracion (loadout)", get: (s: Ship) => statsFor(s).cooling_rate?.toLocaleString() || "—" },
                        { label: "Costo (loadout)", get: (s: Ship) => statsFor(s).total_cost ? `${statsFor(s).total_cost.toLocaleString()} aUEC` : "—" },
                        { label: "Optimizada", get: (s: Ship) => loadoutFor(s)?.is_optimized ? "Si" : "No" },
                      ].map(({ label, get }) => (
                        <tr key={label} className="border-b border-border/50">
                          <td className="p-2 text-muted-foreground">{label}</td>
                          {selectedShips.map((s) => (
                            <td key={s.id} className="p-2 text-right font-mono">
                              {get(s)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="min-h-[300px] flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona al menos 2 naves para comparar</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
