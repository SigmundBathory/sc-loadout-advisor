"use client";

import { useQuery } from "@tanstack/react-query";
import type { Ship, Component, Loadout } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useShips(filters?: { manufacturer?: string; classification?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.manufacturer) params.set("manufacturer", filters.manufacturer);
  if (filters?.classification) params.set("classification", filters.classification);
  if (filters?.search) params.set("search", filters.search);

  return useQuery<{ ships: Ship[] }>({
    queryKey: ["ships", filters],
    queryFn: () => fetchJson(`/api/ships?${params}`),
  });
}

export function useShipsWithDps(filters?: { manufacturer?: string; classification?: string; search?: string }) {
  const params = new URLSearchParams();
  params.set("withDps", "true");
  if (filters?.manufacturer) params.set("manufacturer", filters.manufacturer);
  if (filters?.classification) params.set("classification", filters.classification);
  if (filters?.search) params.set("search", filters.search);

  return useQuery<{ ships: Ship[] }>({
    queryKey: ["ships", "dps", filters],
    queryFn: () => fetchJson(`/api/ships?${params}`),
  });
}

export function useShip(id: string) {
  return useQuery<{ ship: Ship }>({
    queryKey: ["ship", id],
    queryFn: () => fetchJson(`/api/ships/${id}`),
    enabled: !!id,
  });
}

export function useComponents(filters?: { type?: string; size?: number; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.size) params.set("size", String(filters.size));
  if (filters?.search) params.set("search", filters.search);

  return useQuery<{ components: Component[] }>({
    queryKey: ["components", filters],
    queryFn: () => fetchJson(`/api/components?${params}`),
  });
}

export function useLoadouts() {
  return useQuery<{ loadouts: Loadout[] }>({
    queryKey: ["loadouts"],
    queryFn: () => fetchJson("/api/loadouts"),
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: ["sync"],
    queryFn: () => fetchJson("/api/sync"),
    refetchInterval: 5000,
  });
}

export function useVersions() {
  return useQuery({
    queryKey: ["versions"],
    queryFn: () => fetchJson("/api/versions"),
  });
}
