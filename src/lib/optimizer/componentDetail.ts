import type { Component, ComponentStats } from "@/lib/types";

export interface StatRow {
  label: string;
  value: number;
  format?: string;
  lowerBetter?: boolean;
}

const n = (v: number | undefined): number => v ?? 0;

const gradeToNumber = (g: ComponentStats["grade"]): number =>
  typeof g === "string" ? ({ A: 1, B: 2, C: 3, D: 4 } as Record<string, number>)[g.toUpperCase()] || 3 : g ?? 3;

function fmt(v: number, digits = 0): string {
  return v.toLocaleString("es-ES", { maximumFractionDigits: digits });
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

/**
 * Quantum Drive max range formula:
 * range_gm = (fuel_capacity_scu * fuel_efficiency) / fuel_consumption_scu_per_gm
 * range_au = range_gm / 149.598  (1 AU = 149.598 Gm)
 *
 * fuel_capacity varies per SHIP, not per drive. We show range per 100 SCU as reference.
 * The actual range = (ship_fuel_capacity * efficiency) / consumption.
 */
function calcQdRangePer100Scu(efficiency: number, consumption: number): number {
  if (consumption <= 0) return 0;
  return (100 * efficiency) / consumption; // in Gm
}

function formatGm(gm: number): string {
  if (gm <= 0) return "—";
  const au = gm / 149.598;
  if (au >= 1) return `${fmt(au, 1)} AU`;
  return `${fmt(gm, 0)} Gm`;
}

/** Returns the relevant stat rows for a component type, in display order. */
export function componentDetailRows(comp: Component): StatRow[] {
  const s: ComponentStats = comp.stats;
  switch (comp.type) {
    case "Weapon":
      return [
        { label: "DPS", value: n(s.dps), format: fmt(n(s.dps)) },
        { label: "Alpha", value: n(s.alpha), format: fmt(n(s.alpha)) },
        { label: "Cadencia", value: n(s.fire_rate), format: `${fmt(n(s.fire_rate))} RPM` },
        { label: "Alcance", value: n(s.range), format: `${fmt(n(s.range) / 1000, 1)} km` },
        { label: "Capacidad", value: n(s.capacity), format: `${fmt(n(s.capacity))} disp.` },
      ];
    case "Shield": {
      const res = s.resistance || {};
      const physRes = res.physical || { min: 0, max: 0 };
      const energyRes = res.energy || { min: 0, max: 0 };
      const distortRes = res.distortion || { min: 0, max: 0 };
      return [
        { label: "HP", value: n(s.hp), format: fmt(n(s.hp)) },
        { label: "Regen", value: n(s.regen_rate), format: `${fmt(n(s.regen_rate))}/s` },
        { label: "Delay regen", value: n(s.regen_time), format: `${fmt(n(s.regen_time), 2)}s`, lowerBetter: true },
        { label: "Delay downed", value: n(s.regen_delay_downed), format: `${fmt(n(s.regen_delay_downed), 1)}s`, lowerBetter: true },
        { label: "Delay damage", value: n(s.regen_delay_damage), format: `${fmt(n(s.regen_delay_damage), 1)}s`, lowerBetter: true },
        { label: "Decay", value: n(s.decay_ratio), format: pct(n(s.decay_ratio)), lowerBetter: true },
        { label: "Resist. fisico", value: physRes.max, format: pct(physRes.max) },
        { label: "Resist. energia", value: energyRes.max, format: pct(energyRes.max) },
        { label: "Resist. distorsion", value: distortRes.max, format: pct(distortRes.max) },
      ];
    }
    case "PowerPlant":
      return [
        { label: "Segmentos", value: n(s.power_segment_generation), format: `${fmt(n(s.power_segment_generation))} seg/s` },
        { label: "Firma EM", value: n(s.emission_em_max), format: fmt(n(s.emission_em_max)), lowerBetter: true },
        { label: "Firma IR", value: n(s.emission_ir), format: fmt(n(s.emission_ir)), lowerBetter: true },
        { label: "Overheat", value: n(s.overheat_threshold), format: `${fmt(n(s.overheat_threshold), 0)}°C` },
        { label: "HP componente", value: n(s.component_hp), format: fmt(n(s.component_hp)) },
      ];
    case "Cooler":
      return [
        { label: "Enfriamiento", value: n(s.cooling_rate), format: `${fmt(n(s.cooling_rate))} c/s` },
        { label: "Firma EM", value: n(s.emission_em_max), format: fmt(n(s.emission_em_max)), lowerBetter: true },
        { label: "Firma IR", value: n(s.emission_ir), format: fmt(n(s.emission_ir)), lowerBetter: true },
      ];
    case "QuantumDrive": {
      const eff = n(s.fuel_efficiency);
      const consumption = n(s.fuel_consumption_scu_per_gm);
      const rangePer100 = calcQdRangePer100Scu(eff, consumption);
      return [
        { label: "Velocidad QT", value: n(s.travel_speed), format: `${fmt(n(s.travel_speed) / 1e6, 1)} Gkm/s` },
        { label: "Alcance @100SCU", value: rangePer100, format: formatGm(rangePer100) },
        { label: "Tiempo 10GM", value: n(s.travel_time_10gm), format: n(s.travel_time_10gm) > 0 ? `${fmt(n(s.travel_time_10gm))}s` : "—" },
        { label: "Disconnect", value: n(s.disconnect_range), format: n(s.disconnect_range) > 0 ? `${fmt(n(s.disconnect_range))} km` : "—" },
        { label: "Eficiencia", value: eff, format: fmt(eff, 2) },
        { label: "Consumo", value: consumption, format: consumption > 0 ? `${fmt(consumption, 4)} SCU/Gm` : "—", lowerBetter: true },
        { label: "Fuel rate", value: n(s.fuel_rate), format: `${fmt(n(s.fuel_rate) * 1e9, 2)} nSCU/s`, lowerBetter: true },
        { label: "Spool", value: n(s.spool_time), format: `${fmt(n(s.spool_time), 1)}s`, lowerBetter: true },
        { label: "Cooldown", value: n(s.cooldown), format: `${fmt(n(s.cooldown), 1)}s`, lowerBetter: true },
      ];
    }
    case "Radar":
      return [
        { label: "Alcance", value: n(s.detection_range) || n(s.range), format: `${fmt((n(s.detection_range) || n(s.range)) / 1000, 1)} km` },
        { label: "Sens. EM", value: n(s.sensitivity_em), format: pct(n(s.sensitivity_em)) },
        { label: "Sens. IR", value: n(s.sensitivity_ir), format: pct(n(s.sensitivity_ir)) },
        { label: "Sens. CS", value: n(s.sensitivity_cs), format: pct(n(s.sensitivity_cs)) },
      ];
    case "FlightController":
      return [
        { label: "SCM", value: n(s.scm_speed), format: `${fmt(n(s.scm_speed))} m/s` },
        { label: "Max", value: n(s.max_speed), format: `${fmt(n(s.max_speed))} m/s` },
        { label: "Boost", value: n(s.boost_forward), format: `${fmt(n(s.boost_forward))} m/s` },
        { label: "Pitch", value: n(s.pitch), format: `${fmt(n(s.pitch))} °/s` },
        { label: "Yaw", value: n(s.yaw), format: `${fmt(n(s.yaw))} °/s` },
        { label: "Roll", value: n(s.roll), format: `${fmt(n(s.roll))} °/s` },
      ];
    case "LifeSupport":
      return [
        { label: "Grado", value: gradeToNumber(s.grade), format: `G${fmt(gradeToNumber(s.grade))}` },
        { label: "Salida", value: n(s.output), format: `${fmt(n(s.output))} u/s` },
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
        { label: "Grado", value: gradeToNumber(s.grade), format: `G${fmt(gradeToNumber(s.grade))}` },
        { label: "Salida", value: n(s.output), format: fmt(n(s.output)) },
        { label: "HP", value: n(s.hp), format: fmt(n(s.hp)) },
      ];
  }
}
