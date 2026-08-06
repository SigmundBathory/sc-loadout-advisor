export interface Ship {
  id: string;
  name: string;
  class_name: string;
  manufacturer: Manufacturer;
  classification: string;
  crew: number;
  mass: number;
  cargo_capacity: number;
  scm_speed: number;
  max_speed: number;
  hull_hp: number;
  shield_hp: number;
  image_url?: string;
  hardpoints: Hardpoint[];
  dps?: number;
  price_auec?: number;
  is_buyable?: boolean;
}

export interface Manufacturer {
  name: string;
  code: string;
}

export interface Hardpoint {
  id: string;
  name: string;
  slot_type: SlotType;
  size: number;
  max_size: number;
  component_id?: string;
}

export type SlotType =
  | "weapon"
  | "shield"
  | "power_plant"
  | "cooler"
  | "quantum_drive"
  | "missile"
  | "radar"
  | "thruster";

export interface Component {
  id: string;
  name: string;
  class_name: string;
  manufacturer: Manufacturer;
  type: ComponentType;
  size: number;
  class: string;
  stats: ComponentStats;
  price_auec?: number;
  buy_locations: BuyLocation[];
  image_url?: string;
}

export type ComponentType =
  | "Weapon"
  | "Shield"
  | "PowerPlant"
  | "Cooler"
  | "QuantumDrive"
  | "Missile"
  | "MissileRack"
  | "Radar"
  | "EMP"
  | "QED"
  | "FlightController"
  | "LifeSupport";

export interface ComponentStats {
  // Common
  grade?: number;
  // Weapons
  dps?: number;
  alpha?: number;
  fire_rate?: number;
  range?: number;
  velocity?: number;
  ammo?: number;
  penetration?: number;
  damage_type?: string;
  // Shields
  hp?: number;
  max_hp?: number;
  regen_rate?: number;
  regen_delay?: number;
  decay_ratio?: number;
  resistance_phys?: number;
  resistance_energy?: number;
  resistance_distort?: number;
  absorption?: Record<string, { min: number; max: number }>;
  resistance?: Record<string, { min: number; max: number }>;
  // Power Plants
  output?: number;
  power_segment_generation?: number;
  // Coolers
  cooling_rate?: number;
  suppression_ir?: number;
  suppression_heat?: number;
  // Quantum Drives
  fuel_capacity?: number;
  spool_time?: number;
  quantum_fuel_claimed?: number;
  travel_speed?: number;
  cooldown?: number;
  fuel_efficiency?: number;
  // Radars
  sensitivity_ir?: number;
  sensitivity_cs?: number;
  sensitivity_em?: number;
  // Flight Controllers
  scm_speed?: number;
  max_speed?: number;
  boost_forward?: number;
  pitch?: number;
  yaw?: number;
  roll?: number;
  // Emission
  emission_ir?: number;
  emission_em_min?: number;
  emission_em_max?: number;
}

export interface BuyLocation {
  location_name: string;
  system: string;
  planet_moon?: string;
  shop_name: string;
  shop_type: string;
  price: number;
}

export interface Loadout {
  id: string;
  name: string;
  ship_id: string;
  components: Record<string, string>; // slot_id -> component_id
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

export interface FilterPreset {
  name: string;
  label: string;
  weights: FilterWeights;
}

export interface FilterWeights {
  speed: number;
  range: number;
  dps: number;
  defense: number;
  cost: number;
}

export interface ComponentScore {
  dps: number;
  defense: number;
  speed: number;
  range: number;
  efficiency: number;
  cost: number;
}

export interface SyncMeta {
  id: number;
  wiki_version: string;
  uex_version: string;
  last_sync_at: string;
  last_prices_sync_at: string;
  sync_status: "ok" | "syncing" | "error";
}

export interface ShipComparison {
  ship: Ship;
  loadout: Loadout;
  stats: LoadoutStats;
}

export interface LoadoutStats {
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
}
