import type { Component, FilterWeights, ComponentScore, Ship } from "../types";
import { getCompatibleComponents } from "../db/queries";
export { calculateLoadoutStats } from "./loadoutStats";

export const FILTER_PRESETS: { name: string; label: string; weights: FilterWeights }[] = [
  {
    name: "fastest",
    label: "Mas Rapida",
    weights: { speed: 0.4, range: 0.3, dps: 0.1, defense: 0.1, cost: 0.1 },
  },
  {
    name: "max_range",
    label: "Mayor Alcance",
    weights: { speed: 0.2, range: 0.4, dps: 0.1, defense: 0.1, cost: 0.2 },
  },
  {
    name: "best_weapons",
    label: "Mejor Armamento",
    weights: { speed: 0.1, range: 0.1, dps: 0.5, defense: 0.2, cost: 0.1 },
  },
  {
    name: "best_defense",
    label: "Mejor Defensa",
    weights: { speed: 0.1, range: 0.1, dps: 0.2, defense: 0.5, cost: 0.1 },
  },
  {
    name: "cheapest",
    label: "Mas Barata",
    weights: { speed: 0.1, range: 0.1, dps: 0.15, defense: 0.15, cost: 0.5 },
  },
  {
    name: "balanced",
    label: "Equilibrado",
    weights: { speed: 0.2, range: 0.2, dps: 0.2, defense: 0.2, cost: 0.2 },
  },
];

// Normalized max values for scoring (community-known ceiling values)
const MAX_VALUES = {
  dps: 3000,
  defense: 20000,
  speed: 1500,
  range: 500,
  cost: 1000000,
  efficiency: 100,
};

export function scoreComponent(
  component: Component,
  slotType: string
): ComponentScore {
  const s = component.stats;
  const price = component.price_auec || 50000;

  let dps = 0;
  let defense = 0;
  let speed = 0;
  let range = 0;
  let efficiency = 0;
  let cost = 0;

  switch (slotType) {
    case "weapon":
      dps = normalize(s.dps || 0, MAX_VALUES.dps);
      cost = 1 - normalize(price, MAX_VALUES.cost);
      break;
    case "shield":
      defense = normalize(s.hp || 0, MAX_VALUES.defense);
      efficiency = normalize(s.regen_rate || 0, 2000);
      cost = 1 - normalize(price, MAX_VALUES.cost);
      break;
    case "power_plant":
      efficiency = normalize(s.output || 0, 100);
      cost = 1 - normalize(price, MAX_VALUES.cost);
      break;
    case "cooler":
      efficiency = normalize(s.cooling_rate || 0, 100);
      cost = 1 - normalize(price, MAX_VALUES.cost);
      break;
    case "quantum_drive":
      speed = normalize(s.travel_speed || 0, MAX_VALUES.speed);
      range = normalize(s.quantum_fuel_claimed || 0, MAX_VALUES.range);
      cost = 1 - normalize(price, MAX_VALUES.cost);
      break;
    case "missile":
      dps = normalize(s.alpha || 0, MAX_VALUES.dps);
      cost = 1 - normalize(price, MAX_VALUES.cost);
      break;
    default:
      cost = 1 - normalize(price, MAX_VALUES.cost);
  }

  return {
    dps: clamp(dps * 100),
    defense: clamp(defense * 100),
    speed: clamp(speed * 100),
    range: clamp(range * 100),
    efficiency: clamp(efficiency * 100),
    cost: clamp(cost * 100),
  };
}

function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

function clamp(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function calculateWeightedScore(
  scores: ComponentScore,
  weights: FilterWeights
): number {
  const totalWeight =
    weights.speed + weights.range + weights.dps + weights.defense + weights.cost;
  if (totalWeight === 0) return 0;

  return (
    (scores.dps * weights.dps +
      scores.defense * weights.defense +
      scores.speed * weights.speed +
      scores.range * weights.range +
      scores.cost * weights.cost) /
    totalWeight
  );
}

export function optimizeLoadout(
  ship: Ship,
  weights: FilterWeights,
  maxBudget?: number,
  targetSlotTypes?: string[]
): {
  selected: { slotId: string; component: Component; score: number }[];
  totalScore: number;
  totalCost: number;
  explanation: string[];
} {
  const selected: { slotId: string; component: Component; score: number }[] = [];
  const explanation: string[] = [];
  let totalCost = 0;

  // Group hardpoints by slot type
  const slotGroups = new Map<string, typeof ship.hardpoints>();
  for (const hp of ship.hardpoints) {
    if (targetSlotTypes && targetSlotTypes.length > 0 && !targetSlotTypes.includes(hp.slot_type)) {
      continue;
    }
    const existing = slotGroups.get(hp.slot_type) || [];
    existing.push(hp);
    slotGroups.set(hp.slot_type, existing);
  }


  // Process each slot type
  for (const [slotType, slots] of slotGroups) {
    for (const slot of slots) {
      const compatible = getCompatibleComponents(ship.id, slotType, slot.max_size || slot.size);

      if (compatible.length === 0) {
        explanation.push(`${slot.name}: Sin componentes compatibles disponibles`);
        continue;
      }

      // Score each compatible component
      const scored = compatible.map((comp) => ({
        component: comp,
        score: scoreComponent(comp, slotType),
        weightedScore: calculateWeightedScore(
          scoreComponent(comp, slotType),
          weights
        ),
      }));

      // Sort by weighted score descending
      scored.sort((a, b) => b.weightedScore - a.weightedScore);

      // Pick the best one (respecting budget if set)
      let best = scored[0];
      if (maxBudget) {
        for (const option of scored) {
          const price = option.component.price_auec || 0;
          if (totalCost + price <= maxBudget) {
            best = option;
            break;
          }
        }
      }

      const price = best.component.price_auec || 0;
      totalCost += price;

      selected.push({
        slotId: slot.id,
        component: best.component,
        score: best.weightedScore,
      });

      const scoreLabel =
        best.weightedScore >= 80
          ? "EXCELENTE"
          : best.weightedScore >= 60
          ? "BUENO"
          : best.weightedScore >= 40
          ? "REGULAR"
          : "BAJO";
      explanation.push(
        `${slot.name}: ${best.component.name} (${scoreLabel} - ${Math.round(best.weightedScore)}/100)`
      );
    }
  }

  const totalScore =
    selected.length > 0
      ? selected.reduce((sum, s) => sum + s.score, 0) / selected.length
      : 0;

  return { selected, totalScore, totalCost, explanation };
}
