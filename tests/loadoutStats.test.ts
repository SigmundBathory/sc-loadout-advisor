import { describe, it, expect } from "vitest";
import type { Ship, Component } from "@/lib/types";
import { calculateLoadoutStats } from "@/lib/optimizer/loadoutStats";

const ship: Ship = {
  id: "ship",
  name: "Ship",
  class_name: "ship",
  manufacturer: { name: "M", code: "M" },
  classification: "Fighter",
  crew: 1,
  mass: 10000,
  cargo_capacity: 0,
  scm_speed: 200,
  max_speed: 1100,
  hull_hp: 5000,
  shield_hp: 2500,
  hardpoints: [],
};

function comp(id: string, type: Component["type"], partial: Partial<Component["stats"]>, price?: number): Component {
  return {
    id,
    name: id,
    class_name: id,
    manufacturer: { name: "M", code: "M" },
    type,
    size: 2,
    class: "A",
    stats: { ...partial },
    price_auec: price,
    buy_locations: [],
  };
}

describe("calculateLoadoutStats", () => {
  it("returns ship baseline stats when no components are assigned", () => {
    const stats = calculateLoadoutStats(ship, {}, new Map());
    expect(stats.hull_hp).toBe(5000);
    expect(stats.scm_speed).toBe(200);
    expect(stats.max_speed).toBe(1100);
    expect(stats.total_dps).toBe(0);
    expect(stats.total_cost).toBe(0);
  });

  it("sums weapon DPS and shield HP from assignments", () => {
    const map = new Map<string, Component>();
    map.set("w1", comp("w1", "Weapon", { dps: 300 }));
    map.set("w2", comp("w2", "Weapon", { dps: 500 }));
    map.set("sh", comp("sh", "Shield", { hp: 8000, regen_rate: 40 }));

    const stats = calculateLoadoutStats(ship, { a: "w1", b: "w2", c: "sh" }, map);
    expect(stats.total_dps).toBe(800);
    expect(stats.shield_hp).toBe(8000);
    expect(stats.shield_regen).toBe(40);
  });

  it("sums costs only for assigned components", () => {
    const map = new Map<string, Component>();
    map.set("w1", comp("w1", "Weapon", { dps: 300 }, 10000));
    map.set("w2", comp("w2", "Weapon", { dps: 300 }, 25000));
    const stats = calculateLoadoutStats(ship, { a: "w1", b: "w2" }, map);
    expect(stats.total_cost).toBe(35000);
  });

  it("ignores unknown component ids", () => {
    const stats = calculateLoadoutStats(ship, { a: "missing" }, new Map());
    expect(stats.total_dps).toBe(0);
    expect(stats.total_cost).toBe(0);
  });
});
