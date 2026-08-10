"use client";

import { useQuery } from "@tanstack/react-query";
import type { Ship, Component, Loadout, Hardpoint } from "@/lib/types";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
  return res.json();
}

export interface ShipsResponse {
  ships: Ship[];
  manufacturers: { code: string; name: string }[];
  classifications: string[];
}

export interface LoadoutsResponse {
  loadouts: Loadout[];
}

export interface ComponentsResponse {
  components: Component[];
}

export function useShips(withDps = false) {
  return useQuery<ShipsResponse>({
    queryKey: ["ships", { withDps }],
    queryFn: () => fetcher<ShipsResponse>(`/api/ships${withDps ? "?withDps=true" : ""}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllLoadouts() {
  return useQuery<LoadoutsResponse>({
    queryKey: ["loadouts"],
    queryFn: () => fetcher<LoadoutsResponse>("/api/loadouts"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoadoutsByShip(shipId: string | undefined | null) {
  return useQuery<LoadoutsResponse>({
    queryKey: ["loadouts", "ship", shipId],
    queryFn: () =>
      fetcher<LoadoutsResponse>(
        `/api/loadouts?ship_id=${encodeURIComponent(shipId!)}`
      ),
    enabled: Boolean(shipId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Returns all components compatible with a ship, fetched once per slot
 * type+size combination and deduplicated by id. Cached for 5 minutes.
 */
export function useShipComponents(ship: Pick<Ship, "id" | "hardpoints"> | null) {
  return useQuery<Component[]>({
    queryKey: ["components", "ship", ship?.id],
    queryFn: async () => {
      if (!ship) return [];
      const slotSpecs = new Map<string, { slotType: string; slotMinSize: number; slotSize: number }>();
      ship.hardpoints.forEach((hp) => {
        const minSize = hp.size || 1;
        const maxSize = hp.max_size || minSize;
        const key = `${hp.slot_type}_${minSize}_${maxSize}`;
        if (!slotSpecs.has(key)) {
          slotSpecs.set(key, { slotType: hp.slot_type, slotMinSize: minSize, slotSize: maxSize });
        }
      });

      const all: Component[] = [];
      for (const spec of slotSpecs.values()) {
        const res = await fetch(
          `/api/components?compatibleShipId=${ship.id}&slotType=${spec.slotType}&slotMinSize=${spec.slotMinSize}&slotSize=${spec.slotSize}`
        );
        if (res.ok) {
          const data = (await res.json()) as ComponentsResponse;
          if (data.components) all.push(...data.components);
        }
      }
      return Array.from(new Map(all.map((c) => [c.id, c])).values());
    },
    enabled: Boolean(ship && ship.hardpoints.length > 0),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOptimizedShipIds() {
  const { data } = useAllLoadouts();
  const ids = new Set<string>();
  (data?.loadouts || []).forEach((l) => {
    if (l.is_optimized) ids.add(l.ship_id);
  });
  return ids;
}

export interface SyncStatusResponse {
  meta: {
    wiki_version: string;
    uex_version: string;
    last_sync_at: string;
    sync_status: string;
    selected_wiki_version: string;
  };
  shipCount: number;
  componentCount: number;
  selectedVersion: string;
}

export function useSyncStatus() {
  return useQuery<SyncStatusResponse>({
    queryKey: ["sync", "status"],
    queryFn: () => fetcher<SyncStatusResponse>("/api/sync"),
    staleTime: 30 * 1000,
  });
}

export type { Hardpoint };
