"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Zap, Shield, Target, Gauge, Activity, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useThemeTokens } from "@/components/providers/ThemeProvider";

interface ComponentDNAProps {
  component: {
    name: string;
    type: string;
    manufacturer: string;
    grade: string;
    size: number;
    stats: Record<string, number>;
    tradeoffs: Array<{ label: string; value: string; isPositive: boolean }>;
  };
  className?: string;
}

export function ComponentDNACard({ component, className = "" }: ComponentDNAProps) {
  const { colors } = useThemeTokens();
  const { type, stats, tradeoffs } = component;

  // Determine primary stat based on component type
  const getPrimaryStat = (type: string, stats: Record<string, number>) => {
    switch (type.toLowerCase()) {
      case "weapon":
      case "gun":
        return { label: "DPS", value: stats.dps || stats.damage_per_second || 0, color: colors.engine[500], icon: Zap };
      case "shield":
        return { label: "HP Escudo", value: stats.shield_hp || stats.hp || 0, color: colors.shield[500], icon: Shield };
      case "powerplant":
      case "power":
        return { label: "Potencia", value: stats.power_output || stats.output || 0, color: colors.quantum[500], icon: Loader2 };
      case "cooler":
        return { label: "Enfriamiento", value: stats.cooling_rate || stats.cooling || 0, color: colors.caution[500], icon: Activity };
      case "quantumdrive":
      case "quantum":
        return { label: "Velocidad QT", value: stats.quantum_speed || stats.speed || 0, color: colors.quantum[500], icon: Gauge };
      case "thruster":
        return { label: "Empuje", value: stats.thrust || stats.thrust_capacity || 0, color: colors.engine[500], icon: Target };
      default:
        const firstKey = Object.keys(stats)[0];
        return { label: firstKey, value: stats[firstKey] || 0, color: colors.quantum[500], icon: BarChart3 };
    }
  };

  const primaryStat = getPrimaryStat(type, stats);

  // Determine trade-off categories
  const tradeoffCategories = {
    pros: tradeoffs.filter(t => t.isPositive),
    cons: tradeoffs.filter(t => !t.isPositive),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm ${className}`}
      style={{ borderColor: colors.semantic.border.primary + "40" }}
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, ${primaryStat.color}10 0%, transparent 50%)`,
      }} />

      {/* Header */}
      <div className="relative p-5 pb-3 border-b border-border/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-foreground truncate">{component.name}</span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5" style={{ borderColor: primaryStat.color, color: primaryStat.color }}>
                Grado {component.grade} • Talla {component.size}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="font-medium">{component.manufacturer}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="capitalize">{component.type}</span>
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{
              background: `linear-gradient(135deg, ${primaryStat.color}20, ${primaryStat.color}05)`,
              border: `1px solid ${primaryStat.color}30`,
            }}>
              <primaryStat.icon className="h-7 w-7" style={{ color: primaryStat.color }} />
            </div>
          </div>
        </div>

        {/* Primary Stat */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stat Principal</p>
              <div className="flex items-baseline gap-2">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="font-bold text-3xl font-mono"
                  style={{ color: primaryStat.color }}
                >
                  {typeof primaryStat.value === "number" ? primaryStat.value.toLocaleString() : primaryStat.value}
                </motion.span>
                <span className="text-sm text-muted-foreground font-medium">{primaryStat.label}</span>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex-shrink-0"
            >
              <Badge variant="outline" className="text-xs px-2 py-1" style={{ borderColor: primaryStat.color, color: primaryStat.color }}>
                {component.type.toUpperCase()} • G{component.grade}
              </Badge>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-5 space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" style={{ color: colors.semantic.text.muted }} />
          Estadísticas Completas
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(component.stats).map(([key, value], index) => {
            if (key === "dps" || key === "damage_per_second" || key === "shield_hp" || key === "hp" || key === "power_output" || key === "output" || key === "cooling_rate" || key === "cooling" || key === "quantum_speed" || key === "speed" || key === "thrust" || key === "thrust_capacity") {
              return null; // Skip primary stat duplicate
            }
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
                className="bg-muted/30 rounded-xl p-3 flex flex-col items-center text-center"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </p>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  className="font-bold text-lg font-mono text-foreground"
                >
                  {typeof value === "number" ? value.toLocaleString() : value}
                </motion.span>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {key.includes("rate") || key.includes("speed") ? "/s" : key.includes("capacity") ? "SCU" : ""}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Trade-offs */}
        {(tradeoffs.length > 0) && (
          <div className="pt-4 border-t border-border/30">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" style={{ color: colors.shield[500] }} />
              <TrendingDown className="h-3.5 w-3.5" style={{ color: colors.hull[500] }} />
              Trade-offs
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {tradeoffCategories.pros.map((t, i) => (
                <motion.div
                  key={`pro-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.3 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.shield[500] }} />
                  <span className="text-sm text-green-400 font-medium">{t.label}</span>
                  <span className="ml-auto text-xs text-green-500 font-mono">{t.value}</span>
                </motion.div>
              ))}
              {tradeoffCategories.cons.map((t, i) => (
                <motion.div
                  key={`con-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.3 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.hull[500] }} />
                  <span className="text-sm text-red-400 font-medium">{t.label}</span>
                  <span className="ml-auto text-xs text-red-500 font-mono">{t.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Grade/Size indicator */}
        <div className="pt-4 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Grado</span>
              <div className="flex items-center gap-1">
                {[...component.grade].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.05 * i, duration: 0.2 }}
                    className="w-5 h-5 rounded flex items-center justify-center font-bold text-xs"
                    style={{
                      background: i < component.grade.length ? `${primaryStat.color}30` : colors.semantic.border.primary + "30",
                      color: i < component.grade.length ? primaryStat.color : colors.semantic.text.muted,
                    }}
                  >
                    {i < component.grade.length ? component.grade[i] : ""}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-muted-foreground">Talla</span>
              <div className="w-10 h-5 rounded flex items-center justify-center font-bold text-xs font-mono" style={{
                background: `${primaryStat.color}20`,
                color: primaryStat.color,
                border: `1px solid ${primaryStat.color}40`,
              }}>
                {component.size}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}