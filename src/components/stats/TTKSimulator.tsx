"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useThemeTokens } from "@/components/providers/ThemeProvider";
import { Shield, Target, Zap, Activity, Gauge, RotateCcw } from "lucide-react";

interface ShipStats {
  hullHP: number;
  shieldHP: number;
  shieldRegen: number;  // HP/s
  hullRegen: number;    // HP/s
  size: number;         // cross-section modifier
}

interface WeaponConfig {
  name: string;
  dps: number;
  damageType: "energy" | "ballistic" | "distortion";
  range: number;
  falloffStart: number;
  falloffEnd: number;
  accuracy: number;     // 0-1
  projectileSpeed: number;
}

interface TTKResult {
  timeToShieldDown: number;
  timeToHullZero: number;
  totalTTK: number;
  shieldDPS: number;
  hullDPS: number;
  distance: number;
  shotsToKill: number;
}

interface TTKSimulatorProps {
  targetShip: ShipStats;
  weapons: WeaponConfig[];
  className?: string;
}

export default function TTKSimulator({
  targetShip,
  weapons,
  className = "",
}: TTKSimulatorProps) {
  const { colors } = useThemeTokens();
  const [distance, setDistance] = useState(500);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate TTK based on current distance
  const results = useMemo((): TTKResult[] => {
    return weapons.map((weapon) => {
      // Distance falloff
      let dps = weapon.dps;
      if (distance > weapon.falloffStart && weapon.falloffEnd > weapon.falloffStart) {
        const falloffRatio = Math.min(1, (distance - weapon.falloffStart) / (weapon.falloffEnd - weapon.falloffStart));
        dps = weapon.dps * (1 - falloffRatio * 0.5);
      } else if (distance > weapon.range) {
        dps = weapon.dps * 0.5;
      }

      // Accuracy and hit probability
      const hitProb = weapon.accuracy * (1 - distance / 5000) * 0.8 + 0.2;
      const effectiveDPS = dps * hitProb * weapon.accuracy;

      // Damage type modifiers
      let shieldMultiplier = 1;
      let hullMultiplier = 1;
      if (weapon.damageType === "energy") shieldMultiplier = 1.5;
      if (weapon.damageType === "ballistic") hullMultiplier = 1.3;
      if (weapon.damageType === "distortion") shieldMultiplier = 2.5;

      const shieldDPS = effectiveDPS * shieldMultiplier;
      const hullDPS = effectiveDPS * hullMultiplier;

      // Time to kill shields
      const timeToShieldDown = targetShip.shieldHP > 0
        ? targetShip.shieldHP / Math.max(shieldDPS - targetShip.shieldRegen, 1)
        : 0;

      // Time to kill hull (after shields down)
      const timeToHullZero = targetShip.hullHP / Math.max(hullDPS - targetShip.hullRegen, 1);

      // Total TTK
      const totalTTK = timeToShieldDown + timeToHullZero;

      // Shots to kill (assuming average damage per shot)
      const avgDamagePerShot = weapon.dps / 10; // rough estimate
      const shotsToKill = Math.ceil((targetShip.shieldHP + targetShip.hullHP) / (avgDamagePerShot * hitProb));

      return {
        timeToShieldDown,
        timeToHullZero,
        totalTTK,
        shieldDPS,
        hullDPS,
        distance,
        shotsToKill,
      };
    });
  }, [distance, weapons, targetShip]);

  const bestResult = useMemo(() => results.reduce((best, curr) => curr.totalTTK < best.totalTTK ? curr : best), [results]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
  };

  const getDamageTypeColor = (type: string) => {
    switch (type) {
      case "energy": return colors.engine[500];
      case "ballistic": return colors.hull[500];
      case "distortion": return colors.caution[500];
      default: return colors.quantum[500];
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Distance Control */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" style={{ color: colors.quantum[500] }} />
              <span>Simulador TTK (Time To Kill)</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono" style={{ borderColor: colors.quantum[500], color: colors.quantum[500] }}>
              {formatTime(bestResult.totalTTK)} mejor TTK
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Distancia de combate</span>
                <span className="font-mono font-bold text-primary">
                  {distance}m
                </span>
              </label>
              <div className="w-full">
                <input
                  type="range"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  min={100}
                  max={3000}
                  step={50}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: colors.quantum[500] }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>100m (CQC)</span>
                  <span>500m (Estándar)</span>
                  <span>1000m (BVR)</span>
                  <span>3000m (Extremo)</span>
                </div>
              </div>
            </div>

            {/* Target Ship Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/30">
              <StatCard icon={Shield} label="Escudos" value={targetShip.shieldHP.toLocaleString()} unit="HP" color={colors.shield[500]} />
              <StatCard icon={Activity} label="Regen Escudos" value={targetShip.shieldRegen} unit="HP/s" color={colors.shield[400]} />
              <StatCard icon={Target} label="Casco" value={targetShip.hullHP.toLocaleString()} unit="HP" color={colors.hull[500]} />
              <StatCard icon={RotateCcw} label="Regen Casco" value={targetShip.hullRegen} unit="HP/s" color={colors.hull[400]} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weapon Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Zap className="h-5 w-5" style={{ color: colors.engine[500] }} />
          Resultados por Arma
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weapons.map((weapon, index) => {
            const result = results[index];
            const isBest = result === bestResult;
            const typeColor = getDamageTypeColor(weapon.damageType);

            return (
              <motion.div
                key={weapon.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.4 }}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                  isBest
                    ? "ring-2 ring-primary/50 bg-primary/5"
                    : "bg-card/50 border-border/30 hover:border-primary/30"
                }`}
                style={{ borderColor: isBest ? typeColor : undefined }}
              >
                {isBest && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="text-[10px] px-2 py-0.5" style={{ background: typeColor, color: colors.semantic.bg.primary }}>
                      MEJOR TTK
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground truncate">{weapon.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: typeColor, color: typeColor }}>
                        {weapon.damageType.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{weapon.range}m alcance</span>
                      <span>{weapon.dps.toLocaleString()} DPS base</span>
                      <span>{Math.round(weapon.accuracy * 100)}% precisión</span>
                    </div>
                  </div>
                  {isBest && <motion.div className="flex-shrink-0" initial={{ scale: 0 }} animate={{ scale: 1 }}><Target className="h-6 w-6" style={{ color: typeColor }} /></motion.div>}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <MetricBox
                    label="Escudos"
                    value={formatTime(result.timeToShieldDown)}
                    icon={Shield}
                    color={colors.shield[500]}
                    subLabel={`${result.shieldDPS.toFixed(0)} DPS efec.`}
                  />
                  <MetricBox
                    label="Casco"
                    value={formatTime(result.timeToHullZero)}
                    icon={Target}
                    color={colors.hull[500]}
                    subLabel={`${result.hullDPS.toFixed(0)} DPS efec.`}
                  />
                </div>

                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: showDetails ? "auto" : 0, opacity: showDetails ? 1 : 0 }}
                  className="overflow-hidden border-t border-border/30 pt-3 space-y-2"
                >
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-3 flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      <span>DPS Escudos: <span className="font-mono text-primary" style={{ color: colors.shield[500] }}>{result.shieldDPS.toFixed(0)}</span></span>
                      <span className="mx-2">|</span>
                      <span>DPS Casco: <span className="font-mono text-primary" style={{ color: colors.hull[500] }}>{result.hullDPS.toFixed(0)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RotateCcw className="h-3 w-3" />
                      <span>Disparos estimados: <span className="font-mono font-bold">{result.shotsToKill}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-3 w-3" style={{ color: typeColor }} />
                      <span>Tipo: <span className="font-mono capitalize">{weapon.damageType}</span></span>
                    </div>
                  </div>
                </motion.div>

                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full mt-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                  style={{
                    background: showDetails ? `${typeColor}20` : colors.semantic.surface.primary,
                    color: showDetails ? typeColor : colors.semantic.text.secondary,
                    borderColor: typeColor,
                  }}
                >
                  <RotateCcw className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                  {showDetails ? "Ocultar detalles" : "Ver detalles"}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/30">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Gauge className="h-5 w-5" style={{ color: colors.quantum[500] }} />
              Resumen Óptimo
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Mejor TTK Total"
                value={formatTime(bestResult.totalTTK)}
                icon={Gauge}
                color={colors.quantum[500]}
              />
              <SummaryCard
                label="Escudos Caen"
                value={formatTime(bestResult.timeToShieldDown)}
                icon={Shield}
                color={colors.shield[500]}
              />
              <SummaryCard
                label="Casco Cero"
                value={formatTime(bestResult.timeToHullZero)}
                icon={Target}
                color={colors.hull[500]}
              />
              <SummaryCard
                label="Disparos Estimados"
                value={bestResult.shotsToKill.toString()}
                icon={Zap}
                color={colors.engine[500]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/30 rounded-xl p-4 text-center"
    >
      <Icon className="h-5 w-5 mx-auto mb-2" style={{ color }} />
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="font-bold text-lg font-mono"
        style={{ color }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </motion.span>
      <span className="text-xs text-muted-foreground ml-1">{unit}</span>
    </motion.div>
  );
}

function MetricBox({ label, value, icon: Icon, color, subLabel }: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  subLabel: string;
}) {
  return (
    <div className="bg-muted/30 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="font-bold font-mono text-lg"
        style={{ color }}
      >
        {value}
      </motion.div>
      <p className="text-[10px] text-muted-foreground">{subLabel}</p>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/30 rounded-xl p-4 text-center"
    >
      <Icon className="h-5 w-5 mx-auto mb-2" style={{ color }} />
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="font-bold text-xl font-mono"
        style={{ color }}
      >
        {value}
      </motion.span>
    </motion.div>
  );
}

