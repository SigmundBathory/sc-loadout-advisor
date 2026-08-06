import type { Component, ComponentStats } from "@/lib/types";

export interface StatRow {
  label: string;
  value: number;
  format?: string;
  lowerBetter?: boolean;
}

const n = (v: number | undefined): number => v ?? 0;

function fmt(v: number, digits = 0): string {
  return v.toLocaleString("es-ES", { maximumFractionDigits: digits });
}

/** Returns the relevant stat rows for a component type, in display order. */
export function componentDetailRows(comp: Component): StatRow[] {
  const s: ComponentStats = comp.stats;
  switch (comp.type) {
    case "Weapon":
      return [
        { label: "DPS", value: n(s.dps), format: fmt(n(s.dps)) },
        { label: "Alpha (daño/disparo)", value: n(s.alpha), format: fmt(n(s.alpha)) },
        { label: "Cadencia", value: n(s.fire_rate), format: `${fmt(n(s.fire_rate))}/min` },
        { label: "Alcance", value: n(s.range), format: `${fmt(n(s.range) / 1000, 1)} km` },
        { label: "Velocidad proyectil", value: n(s.velocity), format: `${fmt(n(s.velocity) / 1000)} m/s` },
        { label: "Munición", value: n(s.ammo), format: fmt(n(s.ammo)) },
        { label: "Penetración", value: n(s.penetration), format: `${fmt(n(s.penetration), 1)} m` },
        { label: "Tipo de daño", value: 0, format: s.damage_type || "—" },
      ];
    case "Shield":
      return [
        { label: "HP", value: n(s.hp), format: fmt(n(s.hp)) },
        { label: "Regen", value: n(s.regen_rate), format: `${fmt(n(s.regen_rate))}/s` },
        { label: "Delay de regen", value: n(s.regen_delay), format: `${fmt(n(s.regen_delay), 1)}s`, lowerBetter: true },
        { label: "Resist. físico", value: n(s.resistance_phys), format: `${fmt(n(s.resistance_phys))}%` },
        { label: "Resist. energía", value: n(s.resistance_energy), format: `${fmt(n(s.resistance_energy))}%` },
        { label: "Resist. distorsión", value: n(s.resistance_distort), format: `${fmt(n(s.resistance_distort))}%` },
      ];
    case "PowerPlant":
      return [
        { label: "Salida", value: n(s.output), format: `${fmt(n(s.output))} W` },
        { label: "Firma EM", value: n(s.emission_em_max), format: fmt(n(s.emission_em_max)), lowerBetter: true },
        { label: "Firma IR", value: n(s.emission_ir), format: fmt(n(s.emission_ir)), lowerBetter: true },
      ];
    case "Cooler":
      return [
        { label: "Enfriamiento", value: n(s.cooling_rate), format: `${fmt(n(s.cooling_rate))} c/s` },
        { label: "Supres. IR", value: n(s.suppression_ir), format: fmt(n(s.suppression_ir)) },
        { label: "Supres. calor", value: n(s.suppression_heat), format: fmt(n(s.suppression_heat)) },
      ];
    case "QuantumDrive":
      return [
        { label: "Alcance", value: n(s.quantum_fuel_claimed) || n(s.fuel_efficiency) * 1e8, format: formatRange(n(s.quantum_fuel_claimed) || n(s.fuel_efficiency) * 1e8) },
        { label: "Velocidad QT", value: n(s.travel_speed), format: `${fmt(n(s.travel_speed) / 1e6, 1)} Gkm/s` },
        { label: "Consumo", value: n(s.fuel_consumption_scu_per_gm), format: n(s.fuel_consumption_scu_per_gm) > 0 ? `${fmt(n(s.fuel_consumption_scu_per_gm), 4)} SCU/Gm` : "—", lowerBetter: true },
        { label: "Fuel rate", value: n(s.fuel_rate), format: `${fmt(n(s.fuel_rate), 2)} SCU/s`, lowerBetter: true },
        { label: "Spool time", value: n(s.spool_time), format: `${fmt(n(s.spool_time), 1)}s`, lowerBetter: true },
        { label: "Cooldown", value: n(s.cooldown), format: `${fmt(n(s.cooldown), 1)}s`, lowerBetter: true },
      ];
    case "Radar":
      return [
        { label: "Alcance", value: n(s.range), format: `${fmt(n(s.range) / 1000, 1)} km` },
        { label: "Sens. EM", value: n(s.sensitivity_em), format: `${fmt(n(s.sensitivity_em) * 100)}%` },
        { label: "Sens. IR", value: n(s.sensitivity_ir), format: `${fmt(n(s.sensitivity_ir) * 100)}%` },
        { label: "Sens. CS", value: n(s.sensitivity_cs), format: `${fmt(n(s.sensitivity_cs) * 100)}%` },
      ];
    case "FlightController":
      return [
        { label: "SCM speed", value: n(s.scm_speed), format: `${fmt(n(s.scm_speed))} m/s` },
        { label: "Max speed", value: n(s.max_speed), format: `${fmt(n(s.max_speed))} m/s` },
        { label: "Boost", value: n(s.boost_forward), format: fmt(n(s.boost_forward)) },
        { label: "Pitch", value: n(s.pitch), format: fmt(n(s.pitch)) },
        { label: "Yaw", value: n(s.yaw), format: fmt(n(s.yaw)) },
        { label: "Roll", value: n(s.roll), format: fmt(n(s.roll)) },
      ];
    case "LifeSupport":
      return [
        { label: "Salida", value: n(s.output), format: `${fmt(n(s.output))} W` },
        { label: "Firma EM", value: n(s.emission_em_max), format: fmt(n(s.emission_em_max)), lowerBetter: true },
      ];
    case "Missile":
    case "MissileRack":
      return [
        { label: "Alpha", value: n(s.alpha), format: fmt(n(s.alpha)) },
        { label: "Alcance", value: n(s.range), format: `${fmt(n(s.range) / 1000, 1)} km` },
      ];
    case "EMP":
      return [
        { label: "Alcance", value: n(s.range), format: `${fmt(n(s.range) / 1000, 1)} km` },
        { label: "Firma EM", value: n(s.emission_em_max), format: fmt(n(s.emission_em_max)), lowerBetter: true },
      ];
    default:
      return [
        { label: "Grado", value: n(s.grade), format: fmt(n(s.grade)) },
        { label: "Salida", value: n(s.output), format: fmt(n(s.output)) },
        { label: "HP", value: n(s.hp), format: fmt(n(s.hp)) },
      ];
  }
}

function formatRange(v: number): string {
  if (v >= 1e8) return `${(v / 1e12).toFixed(2)} AU`;
  if (v >= 100000) return `${(v / 1000000).toFixed(2)}M km`;
  return v.toFixed(1);
}
