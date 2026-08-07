import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Ship, Loadout, FilterWeights } from "@/lib/types";

interface LoadoutStore {
  // Current ship
  selectedShip: Ship | null;
  setSelectedShip: (ship: Ship | null) => void;

  // Current loadout
  currentLoadout: Loadout | null;
  setCurrentLoadout: (loadout: Loadout | null) => void;

  // Loadout currently loaded in the builder (may differ from saved currentLoadout)
  loadedLoadout: Loadout | null;
  setLoadedLoadout: (loadout: Loadout | null) => void;
  lastOptimizedPreset: string;
  setLastOptimizedPreset: (preset: string) => void;

  // Slot assignments: slotId -> componentId
  slotAssignments: Record<string, string>;
  setSlotAssignment: (slotId: string, componentId: string) => void;
  clearSlotAssignment: (slotId: string) => void;
  resetAllSlots: () => void;

  // Loadout name
  loadoutName: string;
  setLoadoutName: (name: string) => void;

  // Filter weights for optimizer
  filterWeights: FilterWeights;
  setFilterWeights: (weights: FilterWeights) => void;

  // Max budget
  maxBudget: number | undefined;
  setMaxBudget: (budget: number | undefined) => void;

  // Saved loadouts
  savedLoadouts: Loadout[];
  setSavedLoadouts: (loadouts: Loadout[]) => void;
  addSavedLoadout: (loadout: Loadout) => void;
  removeSavedLoadout: (id: string) => void;

  // Sync state
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  syncProgress: string;
  setSyncProgress: (progress: string) => void;
  lastSyncVersion: string;
  setLastSyncVersion: (version: string) => void;

  // Auto-save: track last auto-save timestamp to debounce
  lastAutoSaveAt: number;
}

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

function debounceAutoSave(state: {
  loadedLoadout: Loadout | null;
  slotAssignments: Record<string, string>;
  lastOptimizedPreset: string;
}) {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(async () => {
    const { loadedLoadout, slotAssignments, lastOptimizedPreset } = state;
    if (!loadedLoadout?.id || loadedLoadout.id.startsWith("imported_")) return;
    try {
      await fetch("/api/loadouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: loadedLoadout.id,
          components: slotAssignments,
          is_optimized: !!lastOptimizedPreset,
          optimized_preset: lastOptimizedPreset || "",
        }),
      });
    } catch {
      // silent fail — user can still save manually
    }
  }, 2000);
}

export const useLoadoutStore = create<LoadoutStore>()(
  persist(
    (set) => ({
      selectedShip: null,
      setSelectedShip: (ship) => set({ selectedShip: ship }),

      currentLoadout: null,
      setCurrentLoadout: (loadout) =>
        set({
          currentLoadout: loadout,
          slotAssignments: loadout?.components || {},
          loadoutName: loadout?.name || "",
        }),

      loadedLoadout: null,
      setLoadedLoadout: (loadout) => set({ loadedLoadout: loadout }),
      lastOptimizedPreset: "",
      setLastOptimizedPreset: (preset) => set({ lastOptimizedPreset: preset }),

      slotAssignments: {},
      setSlotAssignment: (slotId, componentId) => {
        set((state) => {
          const next = { ...state.slotAssignments, [slotId]: componentId };
          debounceAutoSave({ ...state, slotAssignments: next });
          return { slotAssignments: next };
        });
      },
      clearSlotAssignment: (slotId) =>
        set((state) => {
          const newAssignments = { ...state.slotAssignments };
          delete newAssignments[slotId];
          debounceAutoSave({ ...state, slotAssignments: newAssignments });
          return { slotAssignments: newAssignments };
        }),
      resetAllSlots: () => set({ slotAssignments: {}, loadoutName: "" }),

      loadoutName: "",
      setLoadoutName: (name) => set({ loadoutName: name }),

      filterWeights: { speed: 0.2, range: 0.2, dps: 0.2, defense: 0.2, cost: 0.2 },
      setFilterWeights: (weights) => set({ filterWeights: weights }),

      maxBudget: undefined,
      setMaxBudget: (budget) => set({ maxBudget: budget }),

      savedLoadouts: [],
      setSavedLoadouts: (loadouts) => set({ savedLoadouts: loadouts }),
      addSavedLoadout: (loadout) =>
        set((state) => ({
          savedLoadouts: [loadout, ...state.savedLoadouts.filter((l) => l.id !== loadout.id)],
        })),
      removeSavedLoadout: (id) =>
        set((state) => ({
          savedLoadouts: state.savedLoadouts.filter((l) => l.id !== id),
        })),

      isSyncing: false,
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),
      syncProgress: "",
      setSyncProgress: (progress) => set({ syncProgress: progress }),
      lastSyncVersion: "",
      setLastSyncVersion: (version) => set({ lastSyncVersion: version }),

      lastAutoSaveAt: 0,
    }),
    {
      name: "sc-loadout-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedShip: state.selectedShip,
        slotAssignments: state.slotAssignments,
        loadoutName: state.loadoutName,
        savedLoadouts: state.savedLoadouts,
        filterWeights: state.filterWeights,
        loadedLoadout: state.loadedLoadout,
        lastOptimizedPreset: state.lastOptimizedPreset,
      }),
    }
  )
);
