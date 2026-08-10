import type { Component } from "../types";

export type BuildProfile = "power" | "stealth" | "balanced" | "speed" | "range";

export const PROFILE_LABELS: Record<BuildProfile, { label: string; icon: string; description: string }> = {
  power: { label: "Potencia", icon: "⚡", description: "Maximizar daño y rendimiento bruto" },
  stealth: { label: "Stealth", icon: "🔇", description: "Minimizar firmas EM/IR, ser invisible" },
  balanced: { label: "Balanceado", icon: "⚖️", description: "Equilibrio entre potencia y sigilo" },
  speed: { label: "Velocidad", icon: "🚀", description: "Maximizar velocidad quantum (km/s)" },
  range: { label: "Alcance", icon: "📏", description: "Maximizar alcance quantum (Mkm)" },
};

/**
 * Defines how components of each type are sorted in the picker, and which
 * trade-off stats are surfaced so the user can compare.
 */
interface SortConfig {
  /** Primary stat used for sorting (higher = first, unless lowerBetter) */
  primary: (s: Component["stats"]) => number;
  /** Short label for the primary stat */
  primaryLabel: string;
  /** Returns a human-friendly summary of the primary stat */
  formatPrimary?: (v: number) => string;
  /** true = sort ascending (lower values first) */
  lowerBetter?: boolean;
  /** Secondary stats shown as trade-off info */
  tradeoffs: {
    label: string;
    value: (s: Component["stats"]) => number;
    format?: (v: number) => string;
    lowerBetter?: boolean;
  }[];
}

const n = (v: number | undefined): number => v ?? 0;


/** Helper to calculate quantum range from component stats */
const calcRange = (s: Component["stats"]): number => {
  const eff = n(s.fuel_efficiency);
  const c = n(s.fuel_consumption_scu_per_gm);
  return c > 0 ? (100 * eff) / c : 0;
};
const fmtRange = (v: number): string => { const au = v / 149.598; return au >= 1 ? `${au.toFixed(1)} AU` : `${v.toFixed(0)} Gm`; };

/** Combined score balancing speed and range */
const QD_SPEED_RANGE_SCORE = (s: Component["stats"]): number => {
  const speed = n(s.travel_speed);
  const range = calcRange(s);
  const speedNorm = speed / 400e6;
  const rangeNorm = range / 50000;
  return speedNorm * 50 + rangeNorm * 50;
};

/** Profile-specific sort configs. Key = component type, value = profile → config */
const PROFILE_CONFIGS: Record<string, Partial<Record<BuildProfile, SortConfig>>> = {
  Weapon: {
    power: {
      primary: (s) => n(s.dps),
      primaryLabel: "DPS",
      tradeoffs: [
        { label: "Alpha", value: (s) => n(s.alpha), format: (v) => v.toFixed(0) },
        { label: "Cadencia", value: (s) => n(s.fire_rate), format: (v) => `${v.toFixed(0)} RPM` },
        { label: "Alcance", value: (s) => n(s.range), format: (v) => `${(v / 1000).toFixed(1)} km` },
      ],
    },
    stealth: {
      primary: (s) => n(s.emission_em_max) || 99999,
      primaryLabel: "Firma EM",
      lowerBetter: true,
      tradeoffs: [
        { label: "DPS", value: (s) => n(s.dps), format: (v) => v.toFixed(0) },
        { label: "Alpha", value: (s) => n(s.alpha), format: (v) => v.toFixed(0) },
        { label: "Alcance", value: (s) => n(s.range), format: (v) => `${(v / 1000).toFixed(1)} km` },
      ],
    },
    balanced: {
      primary: (s) => n(s.dps),
      primaryLabel: "DPS",
      tradeoffs: [
        { label: "Alpha", value: (s) => n(s.alpha), format: (v) => v.toFixed(0) },
        { label: "Alcance", value: (s) => n(s.range), format: (v) => `${(v / 1000).toFixed(1)} km` },
      ],
    },
  },
  Shield: {
    power: {
      primary: (s) => n(s.hp),
      primaryLabel: "HP",
      tradeoffs: [
        { label: "Regen", value: (s) => n(s.regen_rate), format: (v) => `${v.toFixed(0)}/s` },
        { label: "Delay", value: (s) => n(s.regen_time), format: (v) => `${v.toFixed(2)}s`, lowerBetter: true },
      ],
    },
    stealth: {
      primary: (s) => n(s.emission_em_max) || 99999,
      primaryLabel: "Firma EM",
      lowerBetter: true,
      tradeoffs: [
        { label: "HP", value: (s) => n(s.hp), format: (v) => v.toLocaleString() },
        { label: "Regen", value: (s) => n(s.regen_rate), format: (v) => `${v.toFixed(0)}/s` },
      ],
    },
    balanced: {
      primary: (s) => n(s.hp),
      primaryLabel: "HP",
      tradeoffs: [
        { label: "Regen", value: (s) => n(s.regen_rate), format: (v) => `${v.toFixed(0)}/s` },
        { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
      ],
    },
  },
  PowerPlant: {
    power: {
      primary: (s) => n(s.power_segment_generation),
      primaryLabel: "Segmentos",
      formatPrimary: (v) => `${v} seg/s`,
      tradeoffs: [
        { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
      ],
    },
    stealth: {
      primary: (s) => n(s.emission_em_max) || 99999,
      primaryLabel: "Firma EM",
      lowerBetter: true,
      tradeoffs: [
        { label: "Segmentos", value: (s) => n(s.power_segment_generation), format: (v) => `${v} seg/s` },
      ],
    },
    balanced: {
      primary: (s) => n(s.power_segment_generation),
      primaryLabel: "Segmentos",
      formatPrimary: (v) => `${v} seg/s`,
      tradeoffs: [
        { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
      ],
    },
  },
  Cooler: {
    power: {
      primary: (s) => n(s.cooling_rate),
      primaryLabel: "Enfriamiento",
      formatPrimary: (v) => `${v.toLocaleString()} c/s`,
      tradeoffs: [
        { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
        { label: "Firma IR", value: (s) => n(s.emission_ir), format: (v) => v.toLocaleString(), lowerBetter: true },
      ],
    },
    stealth: {
      primary: (s) => n(s.emission_em_max) || 99999,
      primaryLabel: "Firma EM",
      lowerBetter: true,
      tradeoffs: [
        { label: "Enfriamiento", value: (s) => n(s.cooling_rate), format: (v) => v.toLocaleString() },
        { label: "Firma IR", value: (s) => n(s.emission_ir), format: (v) => v.toLocaleString(), lowerBetter: true },
      ],
    },
    balanced: {
      primary: (s) => n(s.cooling_rate),
      primaryLabel: "Enfriamiento",
      formatPrimary: (v) => `${v.toLocaleString()} c/s`,
      tradeoffs: [
        { label: "Firma EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
      ],
    },
  },
  Radar: {
    power: {
      primary: (s) => n(s.assignment_distance_max) || n(s.detection_range),
      primaryLabel: "Alcance",
      formatPrimary: (v) => `${(v / 1000).toFixed(1)} km`,
      tradeoffs: [
        { label: "Sens. EM", value: (s) => n(s.sensitivity_em), format: (v) => `${(v * 100).toFixed(0)}%` },
        { label: "Sens. IR", value: (s) => n(s.sensitivity_ir), format: (v) => `${(v * 100).toFixed(0)}%` },
      ],
    },
    range: {
      primary: (s) => n(s.assignment_distance_max) || n(s.detection_range),
      primaryLabel: "Alcance",
      formatPrimary: (v) => `${(v / 1000).toFixed(1)} km`,
      tradeoffs: [
        { label: "Sens. CS", value: (s) => n(s.sensitivity_cs), format: (v) => `${(v * 100).toFixed(0)}%` },
        { label: "Buffer", value: (s) => n(s.outside_range_buffer), format: (v) => `${v.toFixed(0)} m` },
      ],
    },
    balanced: {
      primary: (s) => (n(s.sensitivity_em) + n(s.sensitivity_ir) + n(s.sensitivity_cs)) / 3,
      primaryLabel: "Sensibilidad",
      formatPrimary: (v) => `${(v * 100).toFixed(0)}%`,
      tradeoffs: [
        { label: "Alcance", value: (s) => n(s.assignment_distance_max) || n(s.detection_range), format: (v) => `${(v / 1000).toFixed(1)} km` },
        { label: "Piercing EM", value: (s) => n(s.piercing_em), format: (v) => `${(v * 100).toFixed(0)}%` },
      ],
    },
    stealth: {
      primary: (s) => n(s.emission_em_max),
      primaryLabel: "Firma EM",
      lowerBetter: true,
      tradeoffs: [
        { label: "Sens. EM", value: (s) => n(s.sensitivity_em), format: (v) => `${(v * 100).toFixed(0)}%` },
        { label: "Alcance", value: (s) => n(s.assignment_distance_max) || n(s.detection_range), format: (v) => `${(v / 1000).toFixed(1)} km` },
      ],
    },
  },
  QuantumDrive: {
    speed: {
      primary: (s) => n(s.travel_speed),
      primaryLabel: "Velocidad",
      formatPrimary: (v) => `${(v / 1e6).toFixed(1)} Gkm/s`,
      tradeoffs: [
        { label: "Alcance", value: calcRange, format: fmtRange },
        { label: "Spool", value: (s) => n(s.spool_time), format: (v) => `${v.toFixed(1)}s`, lowerBetter: true },
        { label: "Disconnect", value: (s) => n(s.disconnect_range), format: (v) => v > 0 ? `${v.toFixed(0)} km` : "—" },
      ],
    },
    range: {
      primary: calcRange,
      primaryLabel: "Alcance",
      formatPrimary: fmtRange,
      tradeoffs: [
        { label: "Velocidad", value: (s) => n(s.travel_speed), format: (v) => `${(v / 1e6).toFixed(1)} Gkm/s` },
        { label: "Consumo", value: (s) => n(s.fuel_consumption_scu_per_gm), format: (v) => v > 0 ? `${v.toFixed(4)} SCU/Gm` : "—", lowerBetter: true },
        { label: "Spool", value: (s) => n(s.spool_time), format: (v) => `${v.toFixed(1)}s`, lowerBetter: true },
      ],
    },
    power: {
      primary: QD_SPEED_RANGE_SCORE,
      primaryLabel: "Vel + Alcance",
      formatPrimary: (v) => `${v.toFixed(0)} pts`,
      tradeoffs: [
        { label: "Velocidad", value: (s) => n(s.travel_speed), format: (v) => `${(v / 1e6).toFixed(1)} Gkm/s` },
        { label: "Alcance", value: calcRange, format: fmtRange },
        { label: "Disconnect", value: (s) => n(s.disconnect_range), format: (v) => v > 0 ? `${v.toFixed(0)} km` : "—" },
        { label: "Spool", value: (s) => n(s.spool_time), format: (v) => `${v.toFixed(1)}s`, lowerBetter: true },
      ],
    },
    stealth: {
      primary: QD_SPEED_RANGE_SCORE,
      primaryLabel: "Vel + Alcance",
      formatPrimary: (v) => `${v.toFixed(0)} pts`,
      tradeoffs: [
        { label: "Velocidad", value: (s) => n(s.travel_speed), format: (v) => `${(v / 1e6).toFixed(1)} Gkm/s` },
        { label: "Alcance", value: calcRange, format: fmtRange },
        { label: "EM", value: (s) => n(s.emission_em_max), format: (v) => v.toLocaleString(), lowerBetter: true },
        { label: "Spool", value: (s) => n(s.spool_time), format: (v) => `${v.toFixed(1)}s`, lowerBetter: true },
      ],
    },
    balanced: {
      primary: QD_SPEED_RANGE_SCORE,
      primaryLabel: "Vel + Alcance",
      formatPrimary: (v) => `${v.toFixed(0)} pts`,
      tradeoffs: [
        { label: "Velocidad", value: (s) => n(s.travel_speed), format: (v) => `${(v / 1e6).toFixed(1)} Gkm/s` },
        { label: "Alcance", value: calcRange, format: fmtRange },
        { label: "Consumo", value: (s) => n(s.fuel_consumption_scu_per_gm), format: (v) => v > 0 ? `${v.toFixed(4)} SCU/Gm` : "—", lowerBetter: true },
        { label: "Spool", value: (s) => n(s.spool_time), format: (v) => `${v.toFixed(1)}s`, lowerBetter: true },
      ],
    },
  },
};

/** Default configs for types without profile variations */
const DEFAULT_CONFIGS: Record<string, SortConfig> = {
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

export function getSortConfig(type: string, profile: BuildProfile = "balanced"): SortConfig {
  const profileConfigs = PROFILE_CONFIGS[type];
  if (profileConfigs?.[profile]) return profileConfigs[profile];
  if (profileConfigs?.balanced) return profileConfigs.balanced;
  return DEFAULT_CONFIGS[type] || { primary: (s) => n(s.dps) || n(s.hp) || 0, primaryLabel: "Stat", tradeoffs: [] };
}

export function sortComponentsForSlot(
  components: Component[],
  type: string,
  equippedId?: string | null,
  profile: BuildProfile = "balanced"
): Component[] {
  const config = getSortConfig(type, profile);
  const sorted = [...components].sort((a, b) => {
    const diff = config.primary(b.stats) - config.primary(a.stats);
    return config.lowerBetter ? -diff : diff;
  });
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
export function componentStatSummary(comp: Component, profile: BuildProfile = "balanced"): {
  primary: number;
  primaryLabel: string;
  primaryFormatted: string;
  tradeoffs: TradeoffStat[];
} {
  const config = getSortConfig(comp.type, profile);
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