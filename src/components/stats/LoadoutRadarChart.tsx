"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";
import { CHART_COLOR } from "@/lib/chartColors";

interface LoadoutRadarChartProps {
  stats: {
    totalDps: number;
    shieldHp: number;
    shieldRegen: number;
    hullHp: number;
    coolingRate: number;
  };
  shipShieldHp: number;
  shipHullHp: number;
  maxStats?: {
    maxDps?: number;
    maxShieldHp?: number;
    maxShieldRegen?: number;
    maxCoolingRate?: number;
  };
}

export default function LoadoutRadarChart({ stats, shipShieldHp, shipHullHp, maxStats }: LoadoutRadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const maxValues = useMemo(() => {
    const dpsMax = maxStats?.maxDps || Math.max(3000, stats.totalDps * 1.2);
    const shieldMax = maxStats?.maxShieldHp || Math.max(1000, shipShieldHp * 1.3, stats.shieldHp);
    const regenMax = maxStats?.maxShieldRegen || Math.max(500, stats.shieldRegen * 1.2);
    const hullMax = Math.max(1000, shipHullHp * 1.2);
    const coolingMax = maxStats?.maxCoolingRate || Math.max(50, stats.coolingRate * 1.2);

    return {
      dps: Math.max(dpsMax, 1),
      shield: Math.max(shieldMax, 1),
      regen: Math.max(regenMax, 1),
      hull: Math.max(hullMax, 1),
      cooling: Math.max(coolingMax, 1),
    };
  }, [stats, shipShieldHp, shipHullHp, maxStats]);

  const data = [
    {
      stat: "DPS",
      value: Math.min(100, Math.round((stats.totalDps / maxValues.dps) * 100)),
      raw: `${stats.totalDps.toLocaleString()} DPS`,
    },
    {
      stat: "Escudos",
      value: Math.min(100, Math.round((stats.shieldHp / maxValues.shield) * 100)),
      raw: `${stats.shieldHp.toLocaleString()} HP`,
    },
    {
      stat: "Regen",
      value: Math.min(100, Math.round((stats.shieldRegen / maxValues.regen) * 100)),
      raw: `${stats.shieldRegen.toLocaleString()} /s`,
    },
    {
      stat: "Casco",
      value: Math.min(100, Math.round((stats.hullHp / maxValues.hull) * 100)),
      raw: `${stats.hullHp.toLocaleString()} HP`,
    },
    {
      stat: "Enfriamiento",
      value: Math.min(100, Math.round((stats.coolingRate / maxValues.cooling) * 100)),
      raw: `${stats.coolingRate.toLocaleString()} c/s`,
    },
  ];

  return (
    <div className="w-full space-y-1">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
        Radar de Balance de Nave
      </h4>
      <div ref={containerRef} className="h-[220px] w-full">
        {width > 0 && (
          <RadarChart width={width} height={220} data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
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
              isAnimationActive={true}
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
        )}
      </div>
    </div>
  );
}
