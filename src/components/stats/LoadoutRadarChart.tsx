"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_COLOR } from "@/lib/chartColors";

interface LoadoutRadarChartProps {
  stats: {
    totalDps: number;
    shieldHp: number;
    hullHp: number;
    powerOutput: number;
  };
  shipStats: {
    hull_hp: number;
    scm_speed: number;
    max_speed: number;
  };
}

export default function LoadoutRadarChart({ stats, shipStats }: LoadoutRadarChartProps) {
  const maxValues = {
    dps: 12000,
    shield: 120000,
    hull: 150000,
    speed: 1200,
    power: 25000,
  };

  const data = [
    {
      stat: "DPS",
      value: Math.min(100, Math.round((stats.totalDps / maxValues.dps) * 100)),
      raw: `${stats.totalDps.toFixed(0)} DPS`,
    },
    {
      stat: "Escudos",
      value: Math.min(100, Math.round((stats.shieldHp / maxValues.shield) * 100)),
      raw: `${stats.shieldHp.toLocaleString()} HP`,
    },
    {
      stat: "Casco",
      value: Math.min(100, Math.round((stats.hullHp / maxValues.hull) * 100)),
      raw: `${stats.hullHp.toLocaleString()} HP`,
    },
    {
      stat: "Velocidad",
      value: Math.min(100, Math.round((shipStats.scm_speed / maxValues.speed) * 100)),
      raw: `${shipStats.scm_speed} m/s`,
    },
    {
      stat: "Energía",
      value: Math.min(100, Math.round((stats.powerOutput / maxValues.power) * 100)),
      raw: `${stats.powerOutput.toLocaleString()} W`,
    },
  ];

  return (
    <div className="w-full space-y-1">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
        Radar de Balance de Nave
      </h4>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <defs>
              <radialGradient id="radarFill" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor={CHART_COLOR(0)} stopOpacity={0.5} />
                <stop offset="100%" stopColor={CHART_COLOR(0)} stopOpacity={0.08} />
              </radialGradient>
            </defs>
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
            />
            <Radar
              name="Perfil"
              dataKey="value"
              stroke={CHART_COLOR(0)}
              strokeWidth={2}
              fill="url(#radarFill)"
              fillOpacity={1}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="glass-panel p-2.5 rounded-xl text-xs border border-border/50 shadow-xl space-y-1">
                      <div className="font-bold text-foreground">{item.stat}</div>
                      <div className="text-primary font-mono font-semibold">{item.raw}</div>
                      <div className="text-[10px] text-muted-foreground">Puntuación: {item.value}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
