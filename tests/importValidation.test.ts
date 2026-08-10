import { describe, expect, it } from "vitest";
import { parseImportText, validateImportData } from "@/lib/importValidation";

describe("importValidation", () => {
  it("rejects records without a stable identity", () => {
    const result = validateImportData({ ships: [{ name: "Unknown" }] });
    expect(result.errors).toContain("ships/vehicles[0] no tiene id, uuid o class_name");
  });

  it("rejects duplicate component and weapon identities", () => {
    const result = validateImportData({
      components: [{ id: "laser", name: "Laser", type: "Weapon" }],
      weapons: [{ id: "laser", name: "Laser weapon" }],
    });
    expect(result.errors.some((error) => error.includes("Duplicado entre componentes y armas"))).toBe(true);
  });

  it("accepts the supported vehicle and port aliases", () => {
    const result = validateImportData({
      vehicles: [{ class_name: "ship-1", name: "Ship", ports: [{ name: "gun_s1" }] }],
    });
    expect(result.errors).toEqual([]);
    expect(result.hardpoints).toBe(1);
  });

  it("rejects invalid JSON before persistence", () => {
    const result = parseImportText("{invalid");
    expect(result.errors).toEqual(["Invalid JSON file"]);
  });
});
