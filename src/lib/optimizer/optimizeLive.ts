import type { Ship, Component } from "../types";

const SLOT_TYPE_MAP: Record<string, string[]> = {
  weapon: ["weapon"],
  turret: ["weapon"],
  shield: ["shield"],
  power_plant: ["powerplant"],
  powerplant: ["powerplant"],
  cooler: ["cooler"],
  quantum_drive: ["quantumdrive"],
  quantumdrive: ["quantumdrive"],
};

export function gradeValue(comp: Component): number {
  const rawGrade = comp.stats.grade;
  if (typeof rawGrade === "string") {
    return ({ A: 1, B: 2, C: 3, D: 4 } as Record<string, number>)[rawGrade.toUpperCase()] || 3;
  }
  return Number(rawGrade) || 3;
}

export function gradeBonus(comp: Component): number {
  return Math.max(0, (4 - gradeValue(comp)) * 0.15);
}

/**
 * Estimates fuel consumption rate per Mkm (microSCU/Mkm) for scoring purposes.
 */
function getFuelRatePerMkm(comp: Component): number {
  const s = comp.stats;
  if (s.fuel_consumption_scu_per_gm && s.fuel_consumption_scu_per_gm > 0) {
    return s.fuel_consumption_scu_per_gm / 1000;
  }
  if (s.fuel_rate && s.fuel_rate > 0) {
    return s.fuel_rate;
  }
  if (s.fuel_efficiency && s.fuel_efficiency > 0) {
    return 1 / s.fuel_efficiency;
  }
  const speed = s.travel_speed || 0;
  if (speed > 0) {
    const baseRate = comp.size === 1 ? 0.07 : comp.size === 2 ? 0.18 : comp.size === 3 ? 0.4 : 1.0;
    return baseRate * (speed / 150000);
  }
  return 0.08;
}

export function scoreForPreset(preset: string, comp: Component): number {
  const s = comp.stats;
  const dps = s.dps || 0;
  const hp = s.hp || 0;
  const maxHp = s.max_hp || hp;
  const regen = s.regen_rate || 0;
  const output = s.output || 0;
  const range = s.range || 0;
  const speed = s.travel_speed || 0;
  const spoolTime = s.spool_time || 0;
  const cooling = s.cooling_rate || 0;
  const suppressionIr = s.suppression_ir || 0;
  const suppressionHeat = s.suppression_heat || 0;
  const sensitivityEm = s.sensitivity_em || 0;
  const sensitivityIr = s.sensitivity_ir || 0;
  const scmSpeed = s.scm_speed || 0;
  const boostFwd = s.boost_forward || 0;
  const pitch = s.pitch || 0;
  const yaw = s.yaw || 0;
  const roll = s.roll || 0;
  const emissionEm = s.emission_em_max || 0;
  const emissionIr = s.emission_ir || 0;
  const price = comp.price_auec || 0;
  const gb = gradeBonus(comp);
  const type = comp.type;

  let score = 0;
  switch (preset) {
    case "fastest":
      if (type === "QuantumDrive") {
        // Prioritize raw travel speed, slightly penalize spool time
        score = (speed / 100000) * (1 + gb) - (spoolTime || 0) * 5;
      } else if (type === "PowerPlant") {
        // High output supports sustained high speed
        score = (output / 1000) * (1 + gb);
      } else {
        score = (output / 1000) * (1 + gb) + dps * 0.3;
      }
      break;
    case "max_range":
      if (type === "QuantumDrive") {
        const rate = getFuelRatePerMkm(comp);
        const estRange = rate > 0 ? (2500 / rate) : 5000; // Using size-2 tank as baseline
        score = (estRange / 100) * (1 + gb);
      } else if (type === "PowerPlant") {
        score = (output / 1000) * (1 + gb);
      } else if (type === "Radar") {
        score = (range / 1000) * (1 + gb) + (sensitivityEm + sensitivityIr) * 10;
      } else {
        score = (range / 1000) * (1 + gb) + hp * 0.001;
      }
      break;
    case "best_weapons":
      if (type === "Weapon") {
        score = dps * 10 * (1 + gb) + (s.alpha || 0) * 2 + (s.fire_rate || 0) * 0.5;
      } else if (type === "Shield") {
        score = (hp + regen * 5) * (1 + gb);
      } else if (type === "PowerPlant") {
        score = (output / 100) * (1 + gb);
      } else {
        score = 1;
      }
      break;
    case "best_defense":
      if (type === "Shield") {
        const absorptionVal = s.absorption
          ? Object.values(s.absorption).reduce((sum, v) => sum + (v.max || 0), 0)
          : 0;
        score = (maxHp * 2 + regen * 10 + absorptionVal * 100) * (1 + gb);
      } else if (type === "PowerPlant") {
        score = (output / 100) * (1 + gb);
      } else if (type === "Cooler") {
        score = (cooling / 100000 + suppressionIr * 10 + suppressionHeat * 10) * (1 + gb);
      } else if (type === "Radar") {
        score = (sensitivityIr * 100 + sensitivityEm * 100) * (1 + gb);
      } else {
        score = hp * 0.5 + output * 0.01;
      }
      break;
    case "cheapest":
      score = Math.max(0, 1000000 - price);
      break;
    case "stealth":
      if (type === "Cooler") {
        score = (suppressionIr * 20 + suppressionHeat * 20 + cooling / 1000) * (1 + gb) - emissionIr * 0.1;
      } else if (type === "Shield") {
        score = (regen * 5 - emissionEm * 0.01) * (1 + gb);
      } else if (type === "PowerPlant") {
        score = (output / 1000 - emissionEm * 0.01) * (1 + gb);
      } else if (type === "Radar") {
        score = -(sensitivityEm + sensitivityIr) * 10;
      } else {
        score = -emissionEm * 0.01;
      }
      break;
    case "balanced":
    default: {
      const offense = dps * 3 + (s.alpha || 0) * 1.5;
      const defense = hp * 0.4 + regen * 3 + maxHp * 0.2;
      const utility = output * 0.02 + cooling * 0.00001 + speed * 0.00001;
      const efficiency = regen / Math.max(1, hp * 0.01) + output / Math.max(1, price * 0.001);
      const maneuver = (scmSpeed + boostFwd + pitch + yaw + roll) / 50;
      const stealthPenalty = emissionEm * 0.001 + emissionIr * 0.001;
      score = (offense + defense + utility + efficiency * 100 + maneuver) * (1 + gb) - stealthPenalty;
      break;
    }
  }
  return score;
}

/**
 * Picks the best compatible component for every hardpoint given the current
 * preset and an already-fetched list of candidate components.
 * Allows duplicate components across multiple slots of the same type.
 */
export function optimizeAssignments(
  ship: Ship,
  availableComponents: Component[],
  preset: string
): Map<string, string> {
  const bestComponents = new Map<string, string>();

  ship.hardpoints.forEach((hp) => {
    const slotKey = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
    const types = SLOT_TYPE_MAP[slotKey] || [hp.slot_type.toLowerCase()];
    const maxSize = hp.max_size || hp.size;
    const compatible = availableComponents.filter(
      (c) => types.includes(c.type.toLowerCase()) && c.size <= maxSize
    );

    if (compatible.length > 0) {
      const scored = compatible
        .map((comp) => {
          const baseScore = scoreForPreset(preset, comp);
          // Size preference: prefer components that match the slot size
          const sizeRatio = comp.size / maxSize;
          const sizeBonus = sizeRatio * 0.1;
          return { comp, score: baseScore * (1 + sizeBonus) };
        })
        .sort((a, b) => b.score - a.score);
      bestComponents.set(hp.id, scored[0].comp.id);
    }
  });

  return bestComponents;
}