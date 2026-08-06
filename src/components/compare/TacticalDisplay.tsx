"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Download, GitCompare, Trophy, Shield, Zap, Gauge } from "lucide-react";
import type { TacticalConfigEntry, LoadoutStats } from "./types";

interface TacticalDisplayProps {
  configs: TacticalConfigEntry[];
  onRemove: (id: string) => void;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function TacticalDisplay({ configs, onRemove }: TacticalDisplayProps) {
  const radarData = useMemo(() => {
    const maxDps = Math.max(...configs.map((c) => liveStats(c).total_dps || 0), 1);
    const maxShield = Math.max(...configs.map((c) => liveStats(c).shield_hp || c.ship.shield_hp || 0), 1);
    const maxHull = Math.max(...configs.map((c) => liveStats(c).hull_hp || c.ship.hull_hp || 0), 1);
    const maxSpeed = Math.max(...configs.map((c) => liveStats(c).scm_speed || c.ship.scm_speed || 0), 1);
    const maxQt = Math.max(...configs.map((c) => liveStats(c).qt_range || 0), 1);

    return buildRadarRows(configs, { maxDps, maxShield, maxHull, maxSpeed, maxQt });
  }, [configs]);

  const winner = useMemo(() => {
    if (configs.length === 0) return null;
    return configs.reduce((best, curr) => {
      const bestScore = scoreConfig(best);
      const currScore = scoreConfig(curr);
      return currScore > bestScore ? curr : best;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs]);

  function scoreConfig(c: TacticalConfigEntry): number {
    const s = liveStats(c);
    return (
      (s.total_dps || 0) * 0.3 +
      (s.shield_hp || c.ship.shield_hp || 0) * 0.2 +
      (s.hull_hp || c.ship.hull_hp || 0) * 0.15 +
      (s.scm_speed || c.ship.scm_speed || 0) * 0.15 +
      (s.qt_range || 0) * 0.1 +
      (s.power_output || 0) * 0.1
    );
  }

  function liveStats(entry: TacticalConfigEntry): LoadoutStats {
    return entry.stats;
  }

  function configLabel(entry: TacticalConfigEntry): string {
    return entry.loadout?.name || "Estándar";
  }

  const handleExport = () => {
    const headers = ["Stat", ...configs.map((c) => c.ship.name)];
    const rows = radarData.map((row) => [
      row.stat,
      ...configs.map((_, i) => String(row[`ship${i}` as keyof typeof row] ?? 0)),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tactical-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {configs.map((cfg, idx) => {
          const s = liveStats(cfg);
          const isWinner = winner?.id === cfg.id;
          return (
            <motion.div
              key={cfg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`
                relative rounded-xl border p-4 transition-all
                ${isWinner
                  ? "bg-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/10"
                  : "bg-card/50 border-border/40"
                }
              `}
            >
              {isWinner && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="text-[10px] px-2 py-0.5 bg-amber-500 text-white">
                    <Trophy className="h-3 w-3 mr-1" />
                    MEJOR
                  </Badge>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <div>
                    <p className="font-bold text-sm text-foreground">{cfg.ship.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cfg.ship.classification}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(cfg.id)}
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <StatItem icon={<Zap className="h-3 w-3 text-red-400" />} label="DPS:" value={`${(s.total_dps || 0).toLocaleString()}`} />
                <StatItem icon={<Shield className="h-3 w-3 text-emerald-400" />} label="Escudos:" value={`${(s.shield_hp || cfg.ship.shield_hp || 0).toLocaleString()}`} />
                <StatItem icon={<Gauge className="h-3 w-3 text-blue-400" />} label="SCM:" value={`${(s.scm_speed || cfg.ship.scm_speed || 0).toLocaleString()}`} />
                <StatItem icon={<Shield className="h-3 w-3 text-orange-400" />} label="Casco:" value={`${(s.hull_hp || cfg.ship.hull_hp || 0).toLocaleString()}`} />
              </div>

              {isWinner && (
                <div className="mt-3 pt-3 border-t border-amber-500/30">
                  <p className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Puntuación táctica más alta
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              Análisis Táctico
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 text-xs"
              onClick={handleExport}
              disabled={configs.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="stat" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              {configs.map((cfg, i) => (
                <Radar
                  key={cfg.id}
                  name={`${cfg.ship.name} · ${configLabel(cfg)}`}
                  dataKey={`ship${i}`}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.15}
                  strokeWidth={2}
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

      <Card>
        <CardHeader>
          <CardTitle>Comparación Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b">
                  <th className="text-left p-2 text-muted-foreground">Característica</th>
                  {configs.map((cfg, i) => (
                    <th key={cfg.id} className="text-right p-2">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i] }} />
                        <span className="font-semibold">{cfg.ship.name}</span>
                      </div>
                      <span className="block text-[10px] font-normal text-muted-foreground">
                        {cfg.ship.manufacturer.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tacticalRows.map(({ label, get }) => (
                  <tr key={label} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-2 text-muted-foreground">{label}</td>
                    {configs.map((cfg) => (
                      <td key={cfg.id} className="p-2 text-right font-mono">
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
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}

type RadarRow = { stat: string } & Record<string, number>;

function buildRadarRows(
  configs: TacticalConfigEntry[],
  maxes: { maxDps: number; maxShield: number; maxHull: number; maxSpeed: number; maxQt: number }
): RadarRow[] {
  const { maxDps, maxShield, maxHull, maxSpeed, maxQt } = maxes;

  const rows: RadarRow[] = [
    {
      stat: "Poder de Fuego",
      ...Object.fromEntries(configs.map((c, i) => [`ship${i}`, (liveStats(c).total_dps || 0) / maxDps])),
    } as RadarRow,
    {
      stat: "Resistencia",
      ...Object.fromEntries(
        configs.map((c, i) => [
          `ship${i}`,
          ((liveStats(c).shield_hp || c.ship.shield_hp || 0) / maxShield) * 0.6 +
            ((liveStats(c).hull_hp || c.ship.hull_hp || 0) / maxHull) * 0.4,
        ])
      ),
    } as RadarRow,
    {
      stat: "Movilidad",
      ...Object.fromEntries(
        configs.map((c, i): [string, number] => [`ship${i}`, (liveStats(c).scm_speed || c.ship.scm_speed || 0) / maxSpeed])
      ),
    } as RadarRow,
    {
      stat: "Autonomía QT",
      ...Object.fromEntries(
        configs.map((c, i): [string, number] => [`ship${i}`, (liveStats(c).qt_range || 0) / maxQt])
      ),
    } as RadarRow,
    {
      stat: "Eficiencia",
      ...Object.fromEntries(
        configs.map((c, i): [string, number] => {
          const s = liveStats(c);
          const cost = s.total_cost || 0;
          const dps = s.total_dps || 0;
          return [`ship${i}`, cost > 0 ? Math.min(1, dps / (cost / 1000)) : 0];
        })
      ),
    } as RadarRow,
    {
      stat: "Potencia",
      ...Object.fromEntries(
        configs.map((c, i): [string, number] => [`ship${i}`, (liveStats(c).power_output || 0) / 20000])
      ),
    } as RadarRow,
  ];

  return rows;
}

function liveStats(entry: TacticalConfigEntry): LoadoutStats {
  return entry.stats;
}

const tacticalRows = [
  { label: "Nave", get: (c: TacticalConfigEntry) => c.ship.name },
  { label: "DPS Total", get: (c: TacticalConfigEntry) => (liveStats(c).total_dps || 0).toLocaleString() },
  { label: "HP Escudos", get: (c: TacticalConfigEntry) => (liveStats(c).shield_hp || c.ship.shield_hp || 0).toLocaleString() },
  { label: "HP Casco", get: (c: TacticalConfigEntry) => (liveStats(c).hull_hp || c.ship.hull_hp || 0).toLocaleString() },
  { label: "Velocidad SCM", get: (c: TacticalConfigEntry) => `${(liveStats(c).scm_speed || c.ship.scm_speed || 0).toLocaleString()} m/s` },
  { label: "Velocidad Máxima", get: (c: TacticalConfigEntry) => `${(liveStats(c).max_speed || c.ship.max_speed || 0).toLocaleString()} m/s` },
  { label: "Alcance QT", get: (c: TacticalConfigEntry) => `${(liveStats(c).qt_range || 0).toLocaleString()} SCU` },
  { label: "Potencia", get: (c: TacticalConfigEntry) => `${(liveStats(c).power_output || 0).toLocaleString()} W` },
  { label: "Enfriamiento", get: (c: TacticalConfigEntry) => `${(liveStats(c).cooling_rate || 0).toLocaleString()} c/s` },
  { label: "Coste Loadout", get: (c: TacticalConfigEntry) => (liveStats(c).total_cost ? `${liveStats(c).total_cost.toLocaleString()} aUEC` : "—") },
];
