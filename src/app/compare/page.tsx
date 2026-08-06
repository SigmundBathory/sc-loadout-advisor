"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SyncIndicator from "@/components/sync/SyncIndicator";
import Breadcrumb from "@/components/Breadcrumb";
import CompareEditor from "@/components/compare/CompareEditor";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Ship, Loadout, LoadoutStats } from "@/lib/types";
import { GitCompare, Plus, X, Wand2 } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface ConfigEntry {
  id: string;
  ship: Ship;
  loadout: Loadout | null;
  assignments: Record<string, string>;
  stats: LoadoutStats;
  isOptimized: boolean;
}

function configLabel(entry: ConfigEntry): string {
  if (entry.loadout) return entry.loadout.name;
  return "Estándar";
}

function liveStats(entry: ConfigEntry): LoadoutStats {
  return entry.stats;
}

export default function ComparePage() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loadoutsByShip, setLoadoutsByShip] = useState<Record<string, Loadout[]>>({});

  useEffect(() => {
    fetch("/api/ships?withDps=true")
      .then((r) => r.json())
      .then((d) => setShips(d.ships || []));
  }, []);

  useEffect(() => {
    fetch("/api/loadouts")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, Loadout[]> = {};
        (d.loadouts || []).forEach((l: Loadout) => {
          if (!map[l.ship_id]) map[l.ship_id] = [];
          map[l.ship_id].push(l);
        });
        Object.values(map).forEach((list) =>
          list.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
        );
        setLoadoutsByShip(map);
      })
      .catch(() => {});
  }, []);

  const filteredShips = ships.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.manufacturer.name.toLowerCase().includes(search.toLowerCase())
  );

  function addConfig(ship: Ship) {
    if (configs.length >= 4) return;
    const loadouts = loadoutsByShip[ship.id] || [];
    const loadout = loadouts.length > 0 ? loadouts[0] : null;
    const entry: ConfigEntry = {
      id: `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ship,
      loadout,
      assignments: loadout?.components ? { ...loadout.components } : {},
      stats: {
        total_dps: (ship as any).dps || 0,
        sustained_dps: 0,
        burst_dps: 0,
        missile_dps: 0,
        shield_hp: ship.shield_hp,
        shield_regen: 0,
        hull_hp: ship.hull_hp,
        scm_speed: ship.scm_speed,
        max_speed: ship.max_speed,
        qt_range: 0,
        qt_fuel: 0,
        total_cost: 0,
        power_output: 0,
        power_demand: 0,
        cooling_rate: 0,
      },
      isOptimized: !!loadout?.is_optimized,
    };
    setConfigs([...configs, entry]);
    setSearch("");
  }

  function removeConfig(id: string) {
    setConfigs(configs.filter((c) => c.id !== id));
  }

  function changeLoadout(id: string, loadoutId: string) {
    setConfigs(
      configs.map((c) => {
        if (c.id !== id) return c;
        const loadout = loadoutId
          ? (loadoutsByShip[c.ship.id] || []).find((l) => l.id === loadoutId) || null
          : null;
        const assignments = loadout?.components ? { ...loadout.components } : {};
        return {
          ...c,
          loadout,
          assignments,
          isOptimized: !!loadout?.is_optimized,
        };
      })
    );
  }

  function handleEditorChange(
    id: string,
    assignments: Record<string, string>,
    stats: LoadoutStats
  ) {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, assignments, stats } : c))
    );
  }

  const radarData = [
    {
      stat: "DPS",
      ...Object.fromEntries(
        configs.map((c, i) => [`ship${i}`, (liveStats(c).total_dps || 0) / 10])
      ),
    },
    {
      stat: "Escudos",
      ...Object.fromEntries(
        configs.map((c, i) => [`ship${i}`, liveStats(c).shield_hp / 100])
      ),
    },
    {
      stat: "Casco",
      ...Object.fromEntries(
        configs.map((c, i) => [`ship${i}`, (liveStats(c).hull_hp || c.ship.hull_hp) / 1000])
      ),
    },
    {
      stat: "Velocidad",
      ...Object.fromEntries(
        configs.map((c, i) => [`ship${i}`, (liveStats(c).scm_speed || c.ship.scm_speed) / 10])
      ),
    },
    {
      stat: "Tripulacion",
      ...Object.fromEntries(
        configs.map((c, i) => [`ship${i}`, c.ship.crew * 10])
      ),
    },
  ];

  const tableRows = useMemo(
    () => [
      { label: "Nave", get: (c: ConfigEntry) => c.ship.name, bold: true },
      { label: "Configuración", get: (c: ConfigEntry) => configLabel(c) },
      { label: "Fabricante", get: (c: ConfigEntry) => c.ship.manufacturer.name },
      { label: "Clasificacion", get: (c: ConfigEntry) => c.ship.classification },
      { label: "Crew", get: (c: ConfigEntry) => c.ship.crew.toString() },
      { label: "Masa (kg)", get: (c: ConfigEntry) => c.ship.mass?.toLocaleString() },
      { label: "SCM Speed", get: (c: ConfigEntry) => `${c.ship.scm_speed} m/s` },
      { label: "Max Speed", get: (c: ConfigEntry) => `${c.ship.max_speed} m/s` },
      { label: "Hull HP", get: (c: ConfigEntry) => (liveStats(c).hull_hp || c.ship.hull_hp)?.toLocaleString() },
      { label: "Shield HP", get: (c: ConfigEntry) => liveStats(c).shield_hp?.toLocaleString() },
      { label: "Regen Escudo", get: (c: ConfigEntry) => liveStats(c).shield_regen?.toLocaleString() },
      { label: "Cargo (SCU)", get: (c: ConfigEntry) => c.ship.cargo_capacity.toString() },
      { label: "Slots", get: (c: ConfigEntry) => c.ship.hardpoints?.length?.toString() || "0" },
      {
        label: "DPS (loadout)",
        get: (c: ConfigEntry) => liveStats(c).total_dps?.toLocaleString(),
      },
      {
        label: "Potencia (loadout)",
        get: (c: ConfigEntry) => liveStats(c).power_output?.toLocaleString(),
      },
      {
        label: "Refrigeracion (loadout)",
        get: (c: ConfigEntry) => liveStats(c).cooling_rate?.toLocaleString(),
      },
      {
        label: "Alcance QT (loadout)",
        get: (c: ConfigEntry) => liveStats(c).qt_range?.toLocaleString(),
      },
      {
        label: "Costo (loadout)",
        get: (c: ConfigEntry) =>
          liveStats(c).total_cost ? `${liveStats(c).total_cost.toLocaleString()} aUEC` : "—",
      },
      {
        label: "Tipo",
        get: (c: ConfigEntry) =>
          c.isOptimized ? "Optimizada" : c.loadout ? "Manual" : "Estándar",
      },
    ],
    []
  );

  return (
    <div className="flex-1 flex flex-col">
      <main className="container mx-auto px-4 py-6 flex-1 space-y-6">
        <Breadcrumb items={[{ label: "Comparar Naves" }]} />

        {/* Config Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Comparar configuraciones (nave + loadout)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Añade una nave varias veces para comparar configuraciones distintas (Estándar vs
              optimizada). Usa el editor para cambiar componentes en tiempo real.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {configs.map((cfg, idx) => (
                <div
                  key={cfg.id}
                  className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{cfg.ship.name}</span>
                    <select
                      value={cfg.loadout?.id || ""}
                      onChange={(e) => changeLoadout(cfg.id, e.target.value)}
                      className="text-xs bg-transparent border-none p-0 m-0 focus:outline-none text-muted-foreground cursor-pointer"
                      title="Elegir configuración"
                    >
                      <option value="">Estándar (stock)</option>
                      {(loadoutsByShip[cfg.ship.id] || []).map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.is_optimized ? "⚡ " : ""}
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeConfig(cfg.id)}
                    className="ml-1 hover:bg-muted rounded p-0.5 text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {configs.length < 4 && (
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
                    onClick={() => addConfig(ship)}
                  >
                    <Plus className="h-3 w-3" />
                    <span>{ship.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {ship.manufacturer.name}
                    </span>
                    {loadoutsByShip[ship.id]?.length ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Wand2 className="h-2.5 w-2.5" />
                        {loadoutsByShip[ship.id].length} loadout
                        {loadoutsByShip[ship.id].length > 1 ? "s" : ""}
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {configs.length >= 2 ? (
          <>
            {/* Live editors per config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {configs.map((cfg, idx) => (
                <Card key={cfg.id} className="border-border/40">
                  <CardHeader className="p-4 border-b border-border/30 flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      {cfg.ship.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {configLabel(cfg)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CompareEditor
                      ship={cfg.ship}
                      initialLoadout={cfg.loadout}
                      onChange={(assignments, stats) => handleEditorChange(cfg.id, assignments, stats)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

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
                      {configs.map((cfg, i) => (
                        <Radar
                          key={cfg.id}
                          name={`${cfg.ship.name} · ${configLabel(cfg)}`}
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
                          {configs.map((cfg, i) => (
                            <th key={cfg.id} className="text-right p-2">
                              <span className="inline-flex items-center gap-1.5 justify-end">
                                <span
                                  className="h-2 w-2 rounded-full inline-block"
                                  style={{ backgroundColor: COLORS[i] }}
                                />
                                {cfg.ship.name}
                              </span>
                              <span className="block text-[10px] font-normal text-muted-foreground">
                                {configLabel(cfg)}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map(({ label, get, bold }) => (
                          <tr key={label} className="border-b border-border/50">
                            <td className="p-2 text-muted-foreground">{label}</td>
                            {configs.map((cfg) => (
                              <td
                                key={cfg.id}
                                className={`p-2 text-right font-mono ${bold ? "font-bold" : ""}`}
                              >
                                {get(cfg)}
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
          </>
        ) : (
          <Card className="min-h-[300px] flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona al menos 2 configuraciones para comparar</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
