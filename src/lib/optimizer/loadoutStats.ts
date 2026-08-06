import type { Ship, Component, LoadoutStats } from "../types";

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
  const hull_hp = ship.hull_hp;
  const scm_speed = ship.scm_speed;
  const max_speed = ship.max_speed;
  let qt_range = 0;
  let qt_fuel = 0;
  let total_cost = 0;
  let power_output = 0;
  const power_demand = 0;
  let cooling_rate = 0;

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
      case "QuantumDrive":
        qt_range = s.quantum_fuel_claimed || 0;
        qt_fuel = s.fuel_capacity || 0;
        break;
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
    qt_range,
    qt_fuel,
    total_cost,
    power_output,
    power_demand,
    cooling_rate,
  };
}
