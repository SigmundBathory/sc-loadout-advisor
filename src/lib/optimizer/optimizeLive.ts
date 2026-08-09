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

export function scoreForPreset(preset: string, comp: Component): number {
  const s = comp.stats;
  const dps = s.dps || 0;
  // Cap stats to reasonable ranges based on actual data distribution
  // Size 2 shields max: hp=10560, regen=2323; Size 3: hp=105600, regen=23232
  const hp = Math.min(s.hp || 0, 15000); // Cap at 15k (slightly above max size 2)
  const maxHp = Math.min(s.max_hp || hp, 15000);
  const regen = Math.min(s.regen_rate || 0, 2500); // Cap at 2500 (slightly above max size 2)
  const output = s.output || 0;
  const range = s.range || 0;
  const speed = Math.min(s.travel_speed || 0, 300000000); // Cap at 300M to avoid anomalous data
  const spoolTime = s.spool_time || 0;
  const cooling = Math.min(s.cooling_rate || 0, 50); // Cap cooling (normal max ~30-40)
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
        score = (speed / 100000) * (1 + gb) - (spoolTime || 0) * 2;
      } else if (type === "PowerPlant") {
        score = (output / 1000) * (1 + gb);
      } else {
        score = (output / 1000) * (1 + gb) + dps * 0.3;
      }
      break;
    case "max_range":
      if (type === "QuantumDrive") {
        score = (speed / 100000) * (1 + gb) * (1 + (s.fuel_efficiency || 0) / 100);
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
        score = (suppressionIr * 20 + suppressionHeat * 20 + cooling / 100000) * (1 + gb) - emissionIr * 0.1;
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
 */
export function optimizeAssignments(
  ship: Ship,
  availableComponents: Component[],
  preset: string
): Map<string, string> {
  const bestComponents = new Map<string, string>();
  const usedComponentIds = new Set<string>();

  ship.hardpoints.forEach((hp) => {
    const slotKey = hp.slot_type.toLowerCase().replace(/[-\s]/g, "_");
    const types = SLOT_TYPE_MAP[slotKey] || [hp.slot_type.toLowerCase()];
    const maxSize = hp.max_size || hp.size;
    const compatible = availableComponents.filter(
      (c) => types.includes(c.type.toLowerCase()) && c.size <= maxSize && !usedComponentIds.has(c.id)
    );

    if (compatible.length > 0) {
      const scored = compatible
        .map((comp) => {
          const baseScore = scoreForPreset(preset, comp);
          // Size preference: prefer components that match the slot size
          // Bonus of 5% per size level (so size 2 in a size 2 slot = +10% vs size 1)
          const sizeRatio = comp.size / maxSize;
          const sizeBonus = sizeRatio * 0.1;
          return { comp, score: baseScore * (1 + sizeBonus) };
        })
        .sort((a, b) => b.score - a.score);
      bestComponents.set(hp.id, scored[0].comp.id);
      usedComponentIds.add(scored[0].comp.id);
    }
  });

  return bestComponents;
}
