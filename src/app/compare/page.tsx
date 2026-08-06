"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/components/Breadcrumb";
import TacticalDisplay from "@/components/compare/TacticalDisplay";
import type { Ship, Loadout } from "@/lib/types";
import type { TacticalConfigEntry } from "@/components/compare/types";
import { GitCompare, Plus, X, Wand2, Link2 } from "lucide-react";
import { AnimatedIcon } from "@/components/motion/AnimatedIcon";
import { useShips, useAllLoadouts } from "@/lib/api/client";
import { encodeCompareShare, decodeCompareShare, copyShareUrl } from "@/lib/loadout/share";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function ComparePage() {
  const [configs, setConfigs] = useState<TacticalConfigEntry[]>([]);
  const [search, setSearch] = useState("");
  const { data: shipsData } = useShips(true);
  const ships = shipsData?.ships || [];
  const { data: loadoutsData } = useAllLoadouts();

  const loadoutsByShip = useMemo(() => {
    const map: Record<string, Loadout[]> = {};
    (loadoutsData?.loadouts || []).forEach((l: Loadout) => {
      if (!map[l.ship_id]) map[l.ship_id] = [];
      map[l.ship_id].push(l);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""))
    );
    return map;
  }, [loadoutsData]);

  const [shareFeedback, setShareFeedback] = useState("");
  const [hashRestored, setHashRestored] = useState(false);
  const initializedRef = useRef(false);
  const idCounter = useRef(0);
  const nextId = () => `cfg_${++idCounter.current}`;

  // Restore a shared compare from the URL hash (#compare=SCLA:...).
  // Runs once on mount to avoid state updates during render.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    if (ships.length > 0 && !hashRestored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHashRestored(true);
      if (typeof window !== "undefined") {
        const hash = window.location.hash;
        if (hash.startsWith("#compare=")) {
          const decoded = decodeCompareShare(hash.slice("#compare=".length));
          if (decoded && decoded.entries.length > 0) {
            const byId = new Map(ships.map((s) => [s.id, s]));
            const restored = decoded.entries
              .filter((e) => byId.has(e.ship.id))
              .map((e, i) => {
                const ship = byId.get(e.ship.id)!;
                return {
                  id: `cfg_shared_${i}`,
                  ship,
                  loadout: null,
                  assignments: { ...e.components },
                  stats: {
                    total_dps: 0,
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
                  isOptimized: false,
                };
              });
            if (restored.length > 0) {
              setConfigs(restored.slice(0, 4));
              window.history.replaceState(null, "", window.location.pathname);
            }
          }
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = async () => {
    if (configs.length === 0) return;
    const token = encodeCompareShare(
      configs.map((c) => ({ ship: c.ship, components: c.assignments }))
    );
    const url = `${window.location.origin}${window.location.pathname}#compare=${token}`;
    const ok = await copyShareUrl(url);
    setShareFeedback(ok ? "¡Enlace de comparación copiado!" : "No se pudo copiar el enlace.");
    setTimeout(() => setShareFeedback(""), 2500);
  };

  const filteredShips = ships.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.manufacturer.name.toLowerCase().includes(search.toLowerCase())
  );

  function addConfig(ship: Ship) {
    if (configs.length >= 4) return;
    const loadouts = loadoutsByShip[ship.id] || [];
    const loadout = loadouts.length > 0 ? loadouts[0] : null;
    const entry: TacticalConfigEntry = {
      id: nextId(),
      ship,
      loadout,
      assignments: loadout?.components ? { ...loadout.components } : {},
      stats: {
        total_dps: 0,
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
          ? (loadoutsByShip[c.ship.id] || []).find((l: Loadout) => l.id === loadoutId) || null
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

  return (
    <div className="flex-1 flex flex-col">
      <main className="container mx-auto px-4 py-6 flex-1 space-y-6">
        <Breadcrumb items={[{ label: "Comparar Naves" }]} />

        {/* Config Selection */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Comparar configuraciones (nave + loadout)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Añade una nave varias veces para comparar configuraciones distintas (Estándar vs
                  optimizada). Usa el editor para cambiar componentes en tiempo real.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {shareFeedback && (
                  <span className="text-xs text-emerald-400 font-medium">{shareFeedback}</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 text-xs"
                  onClick={handleShare}
                  disabled={configs.length === 0}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Compartir
                </Button>
              </div>
            </div>
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
                      className="native-select text-xs bg-transparent p-0 pr-5 text-muted-foreground cursor-pointer"
                      title="Elegir configuración"
                    >
                      <option value="">Estándar (stock)</option>
                      {(loadoutsByShip[cfg.ship.id] || []).map((l: Loadout) => (
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
          <TacticalDisplay configs={configs} onRemove={removeConfig} />
        ) : (
          <Card className="min-h-[300px] flex items-center justify-center glass-panel border-border/40">
            <CardContent className="text-center text-muted-foreground space-y-3">
              <AnimatedIcon className="h-12 w-12 mx-auto mb-4 text-primary/50">
                <GitCompare className="h-full w-full" />
              </AnimatedIcon>
              <p className="font-medium text-foreground">Selecciona al menos 2 configuraciones para comparar</p>
              <p className="text-xs max-w-sm mx-auto">
                Escribe el nombre de una nave en el campo de búsqueda de arriba. Puedes añadir la misma
                nave varias veces para comparar Estándar vs. configuraciones optimizadas.
              </p>
              <Input
                placeholder="Buscar nave para comenzar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs mx-auto mt-2"
                autoFocus
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
