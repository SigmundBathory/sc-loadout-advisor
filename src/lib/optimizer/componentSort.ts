import type { Component } from "../types";

/**
 * Defines how components of each type are sorted in the picker, and which
 * trade-off stats are surfaced so the user can compare (e.g. a quantum drive
 * with more range vs. more speed at higher fuel consumption).
 */
interface SortConfig {
  /** Primary stat used for sorting (higher = first) */
  primary: (s: Component["stats"]) => number;
  /** Short label for the primary stat */
  primaryLabel: string;
  /** Returns a human-friendly summary of the primary stat */
  formatPrimary?: (v: number) => string;
  /** Secondary stats shown as trade-off info: [label, value] */
  tradeoffs: {
    label: string;
    value: (s: Component["stats"]) => number;
    format?: (v: number) => string;
    /** true = lower is better (green when lower) */
    lowerBetter?: boolean;
  }[];
}

const n = (v: number | undefined): number => v ?? 0;

/** Normalize a component grade to a numeric value (A/B/C/D letters → 1-4). */
const gradeToNumber = (g: Component["stats"]["grade"]): number =>
  typeof g === "string" ? ({ A: 1, B: 2, C: 3, D: 4 } as Record<string, number>)[g.toUpperCase()] || 3 : g ?? 3;

export const SORT_CONFIGS: Record<string, SortConfig> = {
  QuantumDrive: {
    primary: (s) => {
      const eff = n(s.fuel_efficiency);
      const consumption = n(s.fuel_consumption_scu_per_gm);
      return consumption > 0 ? (100 * eff) / consumption : eff * 1e8;
    },
    primaryLabel: "Alcance @100SCU",
    formatPrimary: (v) => {
      const au = v / 149.598;
      if (au >= 1) return `${au.toFixed(1)} AU`;
      return `${v.toFixed(0)} Gm`;
    },
    tradeoffs: [
      { label: "Velocidad", value: (s) => n(s.travel_speed), format: (v) => `${(v / 1e6).toFixed(1)} Gkm/s` },
      { label: "Consumo", value: (s) => n(s.fuel_consumption_scu_per_gm), format: (v) => (v > 0 ? `${v.toFixed(4)} SCU/Gm` : "—"), lowerBetter: true },
      { label: "Spool", value: (s) => n(s.spool_time), format: (v) => `${v.toFixed(1)}s`, lowerBetter: true },
      { label: "Cooldown", value: (s) => n(s.cooldown), format: (v) => `${v.toFixed(1)}s`, lowerBetter: true },
    ],
  },
  Weapon: {
    primary: (s) => n(s.dps),
    primaryLabel: "DPS",
    tradeoffs: [
      { label: "Alpha", value: (s) => n(s.alpha), format: (v) => v.toFixed(0) },
      { label: "Cadencia", value: (s) => n(s.fire_rate), format: (v) => `${v.toFixed(0)} RPM` },
      { label: "Alcance", value: (s) => n(s.range), format: (v) => `${(v / 1000).toFixed(1)} km` },
    ],
  },
  Shield: {
    primary: (s) => n(s.hp),
    primaryLabel: "HP",
    tradeoffs: [
      { label: "Regen", value: (s) => n(s.regen_rate), format: (v) => `${v.toFixed(0)}/s` },
      { label: "Delay", value: (s) => n(s.regen_time), format: (v) => `${v.toFixed(2)}s`, lowerBetter: true },
      { label: "Grado", value: (s) => gradeToNumber(s.grade) },
    ],
  },
  PowerPlant: {
    primary: (s) => n(s.power_segment_generation),
    primaryLabel: "Segmentos",
    formatPrimary: (v) => `${v} seg/s`,
    tradeoffs: [
      { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
    ],
  },
  Cooler: {
    primary: (s) => n(s.cooling_rate),
    primaryLabel: "Enfriamiento",
    formatPrimary: (v) => `${v.toLocaleString()} c/s`,
    tradeoffs: [
      { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
      { label: "Firma IR", value: (s) => n(s.emission_ir), format: (v) => v.toLocaleString(), lowerBetter: true },
    ],
  },
  Radar: {
    primary: (s) => n(s.range),
    primaryLabel: "Alcance",
    formatPrimary: (v) => `${(v / 1000).toFixed(1)} km`,
    tradeoffs: [
      { label: "Sens. EM", value: (s) => n(s.sensitivity_em), format: (v) => `${(v * 100).toFixed(0)}%` },
      { label: "Sens. IR", value: (s) => n(s.sensitivity_ir), format: (v) => `${(v * 100).toFixed(0)}%` },
    ],
  },
  FlightController: {
    primary: (s) => n(s.scm_speed),
    primaryLabel: "SCM Speed",
    tradeoffs: [
      { label: "Boost", value: (s) => n(s.boost_forward), format: (v) => v.toFixed(0) },
      { label: "Pitch", value: (s) => n(s.pitch), format: (v) => v.toFixed(0) },
      { label: "Yaw", value: (s) => n(s.yaw), format: (v) => v.toFixed(0) },
    ],
  },
  LifeSupport: {
    primary: (s) => gradeToNumber(s.grade),
    primaryLabel: "Grado",
    formatPrimary: (v) => `G${v}`,
    tradeoffs: [
      { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
    ],
  },
  Missile: {
    primary: (s) => n(s.alpha),
    primaryLabel: "Alpha",
    tradeoffs: [{ label: "Alcance", value: (s) => n(s.range), format: (v) => `${(v / 1000).toFixed(1)} km` }],
  },
  EMP: {
    primary: (s) => n(s.range),
    primaryLabel: "Alcance",
    tradeoffs: [],
  },
};

/**
 * Returns the sort config for a component type (falls back to a generic one).
 */
export function getSortConfig(type: string): SortConfig {
  return (
    SORT_CONFIGS[type] || {
      primary: (s) => n(s.dps) || n(s.output) || n(s.hp) || 0,
      primaryLabel: "Stat",
      tradeoffs: [],
    }
  );
}

/**
 * Sorts a list of compatible components by their primary stat (descending).
 * When a currently-equipped component is provided, it is moved to the top and
 * marked, so the user can see it and the immediately-next options right below.
 */
export function sortComponentsForSlot(
  components: Component[],
  type: string,
  equippedId?: string | null
): Component[] {
  const config = getSortConfig(type);
  const sorted = [...components].sort(
    (a, b) => config.primary(b.stats) - config.primary(a.stats)
  );
  if (equippedId) {
    const idx = sorted.findIndex((c) => c.id === equippedId);
    if (idx > 0) {
      const [cur] = sorted.splice(idx, 1);
      sorted.unshift(cur);
    }
  }
  return sorted;
}

export interface TradeoffStat {
  label: string;
  value: number;
  format?: string;
  lowerBetter?: boolean;
}

/**
 * Builds the primary stat value + the trade-off stats shown for a component.
 */
export function componentStatSummary(comp: Component): {
  primary: number;
  primaryLabel: string;
  primaryFormatted: string;
  tradeoffs: TradeoffStat[];
} {
  const config = getSortConfig(comp.type);
  const primary = config.primary(comp.stats);
  return {
    primary,
    primaryLabel: config.primaryLabel,
    primaryFormatted: config.formatPrimary
      ? config.formatPrimary(primary)
      : primary.toLocaleString(),
    tradeoffs: config.tradeoffs
      .filter((t) => typeof t.value === "function")
      .map((t) => ({
        label: t.label,
        value: t.value(comp.stats),
        format: t.format ? t.format(t.value(comp.stats)) : t.value(comp.stats).toLocaleString(),
        lowerBetter: t.lowerBetter,
      })),
  };
}
