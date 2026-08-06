import { describe, it, expect, beforeAll } from "vitest";
import {
  encodeLoadoutShare,
  decodeLoadoutShare,
  encodeCompareShare,
  decodeCompareShare,
  serializeLoadoutForExport,
  parseLoadoutImport,
  isLoadoutToken,
} from "@/lib/loadout/share";

beforeAll(() => {
  // btoa/atob exist in Node 16+, but TextEncoder/TextDecoder need globalThis in
  // some environments. Vitest runs on Node which provides both.
  if (typeof globalThis.btoa === "undefined") {
    (globalThis as Record<string, unknown>).btoa = (s: string) => Buffer.from(s, "binary").toString("base64");
  }
  if (typeof globalThis.atob === "undefined") {
    (globalThis as Record<string, unknown>).atob = (s: string) => Buffer.from(s, "base64").toString("binary");
  }
});

describe("share token roundtrip", () => {
  it("encodes and decodes a loadout", () => {
    const token = encodeLoadoutShare(
      { id: "ship-1", name: "Avenger" },
      { slot_1: "comp-a", slot_2: "comp-b" },
      { name: "My Build", optimized: true, preset: "balanced" }
    );
    expect(token.startsWith("SCLA:")).toBe(true);
    const decoded = decodeLoadoutShare(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.ship.id).toBe("ship-1");
    expect(decoded!.components).toEqual({ slot_1: "comp-a", slot_2: "comp-b" });
    expect(decoded!.name).toBe("My Build");
    expect(decoded!.optimized).toBe(true);
    expect(decoded!.preset).toBe("balanced");
  });

  it("returns null for a garbage token", () => {
    expect(decodeLoadoutShare("not-a-token")).toBeNull();
    expect(decodeLoadoutShare("SCLA:@@@")).toBeNull();
  });

  it("returns null for an empty token", () => {
    expect(decodeLoadoutShare("")).toBeNull();
  });

  it("isLoadoutToken detects valid tokens", () => {
    const token = encodeLoadoutShare({ id: "x", name: "y" }, { a: "b" });
    expect(isLoadoutToken(token)).toBe(true);
    expect(isLoadoutToken("nope")).toBe(false);
  });
});

describe("compare share token roundtrip", () => {
  it("encodes and decodes compare entries", () => {
    const entries: { ship: { id: string; name: string }; components: Record<string, string> }[] = [
      { ship: { id: "s1", name: "Avenger" }, components: { a: "x" } },
      { ship: { id: "s2", name: "Arrow" }, components: { b: "y" } },
    ];
    const token = encodeCompareShare(entries);
    const decoded = decodeCompareShare(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.entries).toHaveLength(2);
    expect(decoded!.entries[0].ship.name).toBe("Avenger");
    expect(decoded!.entries[1].components).toEqual({ b: "y" });
  });

  it("rejects a loadout token as a compare token", () => {
    const token = encodeLoadoutShare({ id: "x", name: "y" }, { a: "b" });
    expect(decodeCompareShare(token)).toBeNull();
  });
});

describe("export / import JSON", () => {
  const loadout = {
    id: "l1",
    name: "PVP",
    ship_id: "ship-1",
    components: { a: "x" },
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    is_favorite: false,
    is_optimized: true,
    optimized_preset: "fastest",
    stats: { total_dps: 1200 },
  };

  it("serializes and parses a full export", () => {
    const json = serializeLoadoutForExport(loadout as unknown as import("@/lib/types").Loadout);
    const imported = parseLoadoutImport(json);
    expect(imported).not.toBeNull();
    expect(imported!.name).toBe("PVP");
    expect(imported!.ship_id).toBe("ship-1");
    expect(imported!.components).toEqual({ a: "x" });
    expect(imported!.is_optimized).toBe(true);
    expect(imported!.optimized_preset).toBe("fastest");
  });

  it("parses a bare loadout object", () => {
    const imported = parseLoadoutImport(JSON.stringify({ name: "B", ship_id: "s", components: { x: "y" } }));
    expect(imported?.name).toBe("B");
  });

  it("returns null for invalid JSON", () => {
    expect(parseLoadoutImport("not json")).toBeNull();
    expect(parseLoadoutImport(JSON.stringify({ foo: 1 }))).toBeNull();
  });

  it("rejects import when ship_id is missing", () => {
    expect(parseLoadoutImport(JSON.stringify({ name: "B", components: {} }))).toBeNull();
  });
});
