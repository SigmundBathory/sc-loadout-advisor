import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Ship, Component, Loadout, FilterWeights } from "@/lib/types";

interface LoadoutStore {
  // Current ship
  selectedShip: Ship | null;
  setSelectedShip: (ship: Ship | null) => void;

  // Current loadout
  currentLoadout: Loadout | null;
  setCurrentLoadout: (loadout: Loadout | null) => void;

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

      slotAssignments: {},
      setSlotAssignment: (slotId, componentId) =>
        set((state) => ({
          slotAssignments: { ...state.slotAssignments, [slotId]: componentId },
        })),
      clearSlotAssignment: (slotId) =>
        set((state) => {
          const newAssignments = { ...state.slotAssignments };
          delete newAssignments[slotId];
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
    }),
    {
      name: "sc-loadout-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        slotAssignments: state.slotAssignments,
        loadoutName: state.loadoutName,
        savedLoadouts: state.savedLoadouts,
        filterWeights: state.filterWeights,
      }),
    }
  )
);
