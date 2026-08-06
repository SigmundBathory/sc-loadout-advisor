import type { Loadout, Ship } from "@/lib/types";

const PREFIX = "SCLA:";

interface SharePayload {
  v: 1;
  type: "loadout" | "compare";
  name?: string;
  ship: { id: string; name: string };
  components: Record<string, string>;
  optimized?: boolean;
  preset?: string;
}

interface CompareEntryPayload {
  ship: { id: string; name: string };
  components: Record<string, string>;
}

interface ComparePayload {
  v: 1;
  type: "compare";
  entries: CompareEntryPayload[];
}

function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64(input: string): string {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Serializes a loadout (ship + slot assignments) to a compact shareable token. */
export function encodeLoadoutShare(
  ship: Pick<Ship, "id" | "name">,
  components: Record<string, string>,
  opts?: { name?: string; optimized?: boolean; preset?: string }
): string {
  const payload: SharePayload = {
    v: 1,
    type: "loadout",
    ship: { id: ship.id, name: ship.name },
    components,
    ...(opts?.name ? { name: opts.name } : {}),
    ...(opts?.optimized ? { optimized: true } : {}),
    ...(opts?.preset ? { preset: opts.preset } : {}),
  };
  return PREFIX + encodeBase64(JSON.stringify(payload));
}

/** Decodes a loadout share token. Returns null when invalid or not a loadout. */
export function decodeLoadoutShare(token: string): SharePayload | null {
  try {
    if (!token.startsWith(PREFIX)) return null;
    const json = decodeBase64(token.slice(PREFIX.length));
    const data = JSON.parse(json);
    if (data.v !== 1 || data.type !== "loadout") return null;
    if (!data.ship?.id || typeof data.components !== "object") return null;
    return data as SharePayload;
  } catch {
    return null;
  }
}

/** Serializes compare configurations (list of ship + assignments) into a URL token. */
export function encodeCompareShare(entries: { ship: Pick<Ship, "id" | "name">; components: Record<string, string> }[]): string {
  const payload: ComparePayload = {
    v: 1,
    type: "compare",
    entries: entries.map((e) => ({
      ship: { id: e.ship.id, name: e.ship.name },
      components: e.components,
    })),
  };
  return PREFIX + encodeBase64(JSON.stringify(payload));
}

/** Decodes a compare share token. */
export function decodeCompareShare(token: string): ComparePayload | null {
  try {
    if (!token.startsWith(PREFIX)) return null;
    const json = decodeBase64(token.slice(PREFIX.length));
    const data = JSON.parse(json);
    if (data.v !== 1 || data.type !== "compare") return null;
    if (!Array.isArray(data.entries)) return null;
    return data as ComparePayload;
  } catch {
    return null;
  }
}

/** Builds the shareable URL hash for a loadout. */
export function loadoutShareUrl(
  ship: Pick<Ship, "id" | "name">,
  components: Record<string, string>,
  opts?: { name?: string; optimized?: boolean; preset?: string }
): string {
  const token = encodeLoadoutShare(ship, components, opts);
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.hash = `loadout=${token}`;
    return url.toString();
  }
  return `#loadout=${token}`;
}

/** Copies a share URL to the clipboard and returns whether it succeeded. */
export async function copyShareUrl(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export function serializeLoadoutForExport(loadout: Loadout): string {
  return JSON.stringify(
    {
      app: "sc-loadout-advisor",
      version: 1,
      exportType: "loadout",
      loadout: {
        name: loadout.name,
        ship_id: loadout.ship_id,
        components: loadout.components,
        is_optimized: loadout.is_optimized || false,
        optimized_preset: loadout.optimized_preset || "",
        stats: loadout.stats,
      },
    },
    null,
    2
  );
}

export interface ImportedLoadout {
  name: string;
  ship_id: string;
  components: Record<string, string>;
  is_optimized?: boolean;
  optimized_preset?: string;
  stats?: Loadout["stats"];
}

export function parseLoadoutImport(text: string): ImportedLoadout | null {
  try {
    const data = JSON.parse(text);
    if (data?.app === "sc-loadout-advisor" && data?.version === 1 && data?.loadout) {
      return normalizeImported(data.loadout);
    }
    if (data?.name && data?.ship_id && data?.components) {
      return normalizeImported(data);
    }
    return null;
  } catch {
    return null;
  }
}

interface RawImport {
  name: unknown;
  ship_id: unknown;
  components: unknown;
  is_optimized?: unknown;
  optimized_preset?: unknown;
  stats?: unknown;
}

function normalizeImported(raw: RawImport): ImportedLoadout | null {
  if (typeof raw.name !== "string" || typeof raw.ship_id !== "string") return null;
  if (typeof raw.components !== "object" || raw.components === null) return null;
  const components: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw.components)) {
    if (typeof v === "string" && typeof k === "string") components[k] = v;
  }
  return {
    name: raw.name,
    ship_id: raw.ship_id,
    components,
    is_optimized: !!raw.is_optimized,
    optimized_preset: typeof raw.optimized_preset === "string" ? raw.optimized_preset : "",
    stats: (typeof raw.stats === "object" && raw.stats !== null
      ? raw.stats
      : undefined) as ImportedLoadout["stats"],
  };
}

export function downloadFile(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function isLoadoutToken(token: string): boolean {
  return decodeLoadoutShare(token) !== null;
}

export type { SharePayload, ComparePayload };
