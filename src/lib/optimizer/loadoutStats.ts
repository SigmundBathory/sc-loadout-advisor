import type { Ship, Component, LoadoutStats } from "../types";

/**
 * Returns the estimated quantum fuel tank capacity (in microSCU) for a ship
 * based on its quantum drive slot size.
 */
function getQuantumTankCapacity(ship: Ship): number {
  let qdSize = 1;
  ship.hardpoints.forEach((hp) => {
    const key = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
    if (key === "quantum_drive" || key === "quantumdrive") {
      qdSize = Math.max(qdSize, hp.max_size || hp.size || 1);
    }
  });
  // Standard SC fuel tank sizes by quantum drive size (microSCU)
  return qdSize === 1 ? 580 : qdSize === 2 ? 2500 : qdSize === 3 ? 10000 : 100000;
}

/**
 * Estimates the fuel consumption rate per Mkm (microSCU/Mkm) for a quantum drive.
 */
function getFuelRatePerMkm(comp: Component): number {
  const s = comp.stats;
  // Prefer explicit fuel consumption data
  if (s.fuel_consumption_scu_per_gm && s.fuel_consumption_scu_per_gm > 0) {
    return s.fuel_consumption_scu_per_gm / 1000; // SCU/Gm → microSCU/Mkm
  }
  if (s.fuel_rate && s.fuel_rate > 0) {
    return s.fuel_rate;
  }
  if (s.fuel_efficiency && s.fuel_efficiency > 0) {
    return 1 / s.fuel_efficiency;
  }
  // Fallback: estimate based on travel speed and size
  const speed = s.travel_speed || 0;
  if (speed > 0) {
    const baseRate = comp.size === 1 ? 0.07 : comp.size === 2 ? 0.18 : comp.size === 3 ? 0.4 : 1.0;
    return baseRate * (speed / 150000);
  }
  return 0.08; // Default conservative rate
}

export function calculateLoadoutStats(
  ship: Ship,
  componentIds: Record<string, string>,
  allComponents: Map<string, Component>
): LoadoutStats {
  let total_dps = 0;
  let sustained_dps = 0;
  let burst_dps = 0;
  let missile_dps = 0;
  let shield_hp = 0;
  let shield_regen = 0;
  const hull_hp = ship.hull_hp || 0;
  const scm_speed = ship.scm_speed || 0;
  const max_speed = ship.max_speed || 0;
  let qt_speed = 0;
  let qt_range = 0;
  let qt_fuel = 0;
  let total_cost = 0;
  let power_output = 0;
  const power_demand = 0;
  let cooling_rate = 0;

  const tankCapacity = getQuantumTankCapacity(ship);
  qt_fuel = tankCapacity;

  for (const componentId of Object.values(componentIds)) {
    const comp = allComponents.get(componentId);
    if (!comp) continue;

    const s = comp.stats;
    const price = comp.price_auec || 0;
    total_cost += price;

    switch (comp.type) {
      case "Weapon":
        total_dps += s.dps || 0;
        burst_dps += s.fire_rate ? (s.alpha || 0) * (s.fire_rate / 60) : s.dps || 0;
        sustained_dps += s.dps || 0;
        break;
      case "Missile":
      case "MissileRack":
        missile_dps += s.alpha || 0;
        break;
      case "Shield":
        shield_hp += s.hp || 0;
        shield_regen += s.regen_rate || 0;
        break;
      case "PowerPlant":
        power_output += s.output || 0;
        break;
      case "Cooler":
        cooling_rate += s.cooling_rate || 0;
        break;
      case "QuantumDrive": {
        qt_speed = s.travel_speed || 0;
        const ratePerMkm = getFuelRatePerMkm(comp);
        qt_range = ratePerMkm > 0 ? Math.round(tankCapacity / ratePerMkm) : 5000;
        break;
      }
    }
  }

  return {
    total_dps,
    sustained_dps,
    burst_dps,
    missile_dps,
    shield_hp,
    shield_regen,
    hull_hp,
    scm_speed,
    max_speed,
    qt_speed,
    qt_range,
    qt_fuel,
    total_cost,
    power_output,
    power_demand,
    cooling_rate,
  };
}