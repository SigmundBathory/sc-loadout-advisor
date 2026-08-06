export interface TacticalConfigEntry {
  id: string;
  ship: {
    id: string;
    name: string;
    classification: string;
    manufacturer: { name: string };
    hardpoints: Array<{ id: string; slot_type: string; size: number; name: string }>;
    shield_hp: number;
    hull_hp: number;
    scm_speed: number;
    max_speed: number;
    crew: number;
    cargo_capacity: number;
    mass?: number;
  };
  loadout: { id?: string; name?: string; components?: Record<string, string>; is_optimized?: boolean } | null;
  assignments: Record<string, string>;
  stats: {
    total_dps: number;
    sustained_dps: number;
    burst_dps: number;
    missile_dps: number;
    shield_hp: number;
    shield_regen: number;
    hull_hp: number;
    scm_speed: number;
    max_speed: number;
    qt_range: number;
    qt_fuel: number;
    total_cost: number;
    power_output: number;
    power_demand: number;
    cooling_rate: number;
  };
  isOptimized: boolean;
}

export type { LoadoutStats } from "@/lib/types";

