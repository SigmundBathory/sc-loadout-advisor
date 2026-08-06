import { describe, it, expect } from "vitest";
import type { Ship, Component } from "@/lib/types";
import {
  gradeValue,
  gradeBonus,
  scoreForPreset,
  optimizeAssignments,
} from "@/lib/optimizer/optimizeLive";

function makeComponent(id: string, type: Component["type"], partial: Partial<Component["stats"]> = {}): Component {
  return {
    id,
    name: id,
    class_name: id,
    manufacturer: { name: "M", code: "M" },
    type,
    size: 2,
    class: "A",
    stats: { grade: 1, ...partial },
    buy_locations: [],
  };
}

const ship: Ship = {
  id: "ship",
  name: "Test Ship",
  class_name: "test",
  manufacturer: { name: "M", code: "M" },
  classification: "Fighter",
  crew: 1,
  mass: 10000,
  cargo_capacity: 0,
  scm_speed: 200,
  max_speed: 1100,
  hull_hp: 5000,
  shield_hp: 2500,
  hardpoints: [
    { id: "hp_weapon1", name: "W1", slot_type: "weapon", size: 3, max_size: 3 },
    { id: "hp_shield", name: "S", slot_type: "shield", size: 2, max_size: 2 },
    { id: "hp_qt", name: "QT", slot_type: "quantum_drive", size: 2, max_size: 2 },
  ],
};

describe("gradeValue", () => {
  it("handles numeric grades", () => {
    expect(gradeValue(makeComponent("a", "Weapon", { grade: 1 }))).toBe(1);
    expect(gradeValue(makeComponent("b", "Weapon", { grade: 4 }))).toBe(4);
  });

  it("maps letter grades", () => {
    expect(
      gradeValue({ ...makeComponent("a", "Weapon"), stats: { grade: "A" } } as unknown as Component)
    ).toBe(1);
    expect(
      gradeValue({ ...makeComponent("b", "Weapon"), stats: { grade: "C" } } as unknown as Component)
    ).toBe(3);
  });

  it("defaults to grade 3 when missing", () => {
    expect(gradeValue({ ...makeComponent("a", "Weapon"), stats: {} } as unknown as Component)).toBe(3);
  });
});

describe("gradeBonus", () => {
  it("is 0 for the worst grade", () => {
    expect(gradeBonus(makeComponent("a", "Weapon", { grade: 4 }))).toBe(0);
  });
  it("is positive for better grades", () => {
    expect(gradeBonus(makeComponent("a", "Weapon", { grade: 1 }))).toBeGreaterThan(0);
  });
});

describe("scoreForPreset", () => {
  it("prefers higher DPS weapons on best_weapons", () => {
    const weak = makeComponent("weak", "Weapon", { dps: 100 });
    const strong = makeComponent("strong", "Weapon", { dps: 900 });
    expect(scoreForPreset("best_weapons", strong)).toBeGreaterThan(scoreForPreset("best_weapons", weak));
  });

  it("prefers cheaper components on cheapest", () => {
    const cheap = { ...makeComponent("c", "Shield"), price_auec: 1000 };
    const pricey = { ...makeComponent("p", "Shield"), price_auec: 999999 };
    expect(scoreForPreset("cheapest", cheap)).toBeGreaterThan(scoreForPreset("cheapest", pricey));
  });

  it("returns a numeric score for every preset/type combination", () => {
    const presets = ["fastest", "max_range", "best_weapons", "best_defense", "cheapest", "stealth", "balanced"];
    const types: Component["type"][] = ["Weapon", "Shield", "PowerPlant", "Cooler", "QuantumDrive", "Radar", "FlightController", "LifeSupport"];
    for (const preset of presets) {
      for (const type of types) {
        const score = scoreForPreset(preset, makeComponent("x", type, { dps: 10, hp: 10, output: 10 }));
        expect(typeof score).toBe("number");
        expect(Number.isFinite(score)).toBe(true);
      }
    }
  });
});

describe("optimizeAssignments", () => {
  it("picks the best weapon and shield for each hardpoint", () => {
    const components = [
      makeComponent("w-strong", "Weapon", { dps: 500 }),
      makeComponent("w-weak", "Weapon", { dps: 50 }),
      makeComponent("s-strong", "Shield", { hp: 10000 }),
      makeComponent("s-weak", "Shield", { hp: 100 }),
      makeComponent("q-fast", "QuantumDrive", { travel_speed: 400000 }),
      makeComponent("q-slow", "QuantumDrive", { travel_speed: 100000 }),
    ];
    const result = optimizeAssignments(ship, components, "best_weapons");
    expect(result.get("hp_weapon1")).toBe("w-strong");
    expect(result.get("hp_shield")).toBe("s-strong");
    expect(result.get("hp_qt")).toBe("q-fast");
  });

  it("leaves a hardpoint empty when no compatible component exists", () => {
    const components = [makeComponent("w", "Weapon", { dps: 100 })];
    const result = optimizeAssignments(ship, components, "balanced");
    expect(result.get("hp_weapon1")).toBe("w");
    expect(result.has("hp_shield")).toBe(false);
    expect(result.has("hp_qt")).toBe(false);
  });
});
