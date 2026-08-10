import { describe, it, expect } from "vitest";
import type { Component } from "@/lib/types";
import {
  sortComponentsForSlot,
  componentStatSummary,
  getSortConfig,
} from "@/lib/optimizer/componentSort";

function weapon(id: string, dps: number, name = `weapon-${id}`): Component {
  return {
    id,
    name,
    class_name: name,
    manufacturer: { name: "M", code: "M" },
    type: "Weapon",
    size: 3,
    class: "A",
    stats: { dps, grade: 1 },
    buy_locations: [],
  };
}

describe("componentSort", () => {
  it("sorts weapons by DPS descending", () => {
    const list = [weapon("a", 100), weapon("b", 400), weapon("c", 250)];
    const sorted = sortComponentsForSlot(list, "Weapon");
    expect(sorted.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("moves the equipped component to the top regardless of score", () => {
    const list = [weapon("a", 100), weapon("b", 400), weapon("c", 250)];
    const sorted = sortComponentsForSlot(list, "Weapon", "a");
    expect(sorted[0].id).toBe("a");
  });

  it("keeps the equipped component first when it is already the best", () => {
    const list = [weapon("a", 400), weapon("b", 100)];
    const sorted = sortComponentsForSlot(list, "Weapon", "a");
    expect(sorted.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("handles empty lists", () => {
    expect(sortComponentsForSlot([], "Weapon")).toEqual([]);
  });

  it("falls back to a generic config for unknown types", () => {
    const cfg = getSortConfig("UnknownType");
    expect(cfg.primaryLabel).toBe("Stat");
    expect(cfg.primary({ dps: 5 } as unknown as Component["stats"])).toBe(5);
  });

  it("summarizes a weapon with DPS primary and trade-offs", () => {
    const comp = weapon("a", 300);
    comp.stats = { ...comp.stats, alpha: 90, fire_rate: 600, range: 2000, velocity: 1200 };
    const summary = componentStatSummary(comp);
    expect(summary.primaryLabel).toBe("DPS");
    expect(summary.primary).toBe(300);
    expect(summary.primaryFormatted).toBe("300");
    const labels = summary.tradeoffs.map((t) => t.label);
    expect(labels).toContain("Alpha");
    expect(labels).toContain("Alcance");
  });

  it("formats a quantum drive primary using AU range formatting", () => {
    const comp: Component = {
      id: "qd",
      name: "QD",
      class_name: "qd",
      manufacturer: { name: "M", code: "M" },
      type: "QuantumDrive",
      size: 2,
      class: "B",
      stats: { fuel_efficiency: 10, fuel_consumption_scu_per_gm: 0.01 },
      buy_locations: [],
    };
    const summary = componentStatSummary(comp, "range");
    expect(summary.primaryLabel).toBe("Alcance");
    expect(summary.primaryFormatted).toContain("AU");
  });
});
