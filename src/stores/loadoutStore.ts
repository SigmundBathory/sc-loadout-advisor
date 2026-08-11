import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Ship, Loadout, FilterWeights } from "@/lib/types";

// Clave para guardar el loadout actual en localStorage
const CURRENT_LOADOUT_KEY = "sc-loadout-current";

// Funcion para guardar el loadout actual en localStorage
function saveCurrentLoadoutToLocalStorage(loadout: {
  shipId: string;
  components: Record<string, string>;
  name: string;
  isOptimized: boolean;
  optimizedPreset: string;
  stats?: any;
}) {
  try {
    localStorage.setItem(CURRENT_LOADOUT_KEY, JSON.stringify(loadout));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
}

// Funcion para cargar el loadout actual desde localStorage
function loadCurrentLoadoutFromLocalStorage(): {
  shipId: string;
  components: Record<string, string>;
  name: string;
  isOptimized: boolean;
  optimizedPreset: string;
  stats?: any;
} | null {
  try {
    const data = localStorage.getItem(CURRENT_LOADOUT_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Failed to load from localStorage:", e);
  }
  return null;
}

// Funcion para limpiar el loadout actual de localStorage
function clearCurrentLoadoutFromLocalStorage() {
  try {
    localStorage.removeItem(CURRENT_LOADOUT_KEY);
  } catch (e) {
    console.warn("Failed to clear localStorage:", e);
  }
}

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
  selectedShip: Ship | null;
  loadoutName: string;
}) {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    const { loadedLoadout, slotAssignments, lastOptimizedPreset, selectedShip, loadoutName } = state;
    
    // Siempre guardar en localStorage como fallback
    if (selectedShip && Object.keys(slotAssignments).length > 0) {
      saveCurrentLoadoutToLocalStorage({
        shipId: selectedShip.id,
        components: slotAssignments,
        name: loadoutName || loadedLoadout?.name || "Unnamed Loadout",
        isOptimized: !!lastOptimizedPreset,
        optimizedPreset: lastOptimizedPreset || "",
        stats: loadedLoadout?.stats,
      });
    } else if (!selectedShip && Object.keys(slotAssignments).length === 0) {
      // Si no hay nave seleccionada ni asignaciones, limpiar el localStorage
      clearCurrentLoadoutFromLocalStorage();
    }
    
    // Intentar guardar en el servidor si hay un loadout cargado
    if (loadedLoadout?.id && !loadedLoadout.id.startsWith("imported_")) {
      try {
        fetch("/api/loadouts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: loadedLoadout.id,
            components: slotAssignments,
            is_optimized: !!lastOptimizedPreset,
            optimized_preset: lastOptimizedPreset || "",
          }),
        }).catch(() => {
          // Si falla el guardado en servidor, ya tenemos el fallback en localStorage
        });
      } catch {
        // silent fail — fallback to localStorage already done
      }
    }
  }, 2000);
}

export const useLoadoutStore = create<LoadoutStore>()(
  persist(
    (set, get) => ({
      selectedShip: null,
      setSelectedShip: (ship) => {
        set({ selectedShip: ship });
        // Si se selecciona una nave, intentar cargar el loadout guardado para esa nave
        if (ship) {
          const saved = loadCurrentLoadoutFromLocalStorage();
          if (saved && saved.shipId === ship.id) {
            set({
              slotAssignments: saved.components || {},
              loadoutName: saved.name || "",
              lastOptimizedPreset: saved.optimizedPreset || "",
            });
          }
        }
      },

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
      resetAllSlots: () => {
        set({ slotAssignments: {}, loadoutName: "" });
        clearCurrentLoadoutFromLocalStorage();
      },

      loadoutName: "",
      setLoadoutName: (name) => {
        set({ loadoutName: name });
        // Guardar en localStorage cuando se cambia el nombre
        const state = get();
        if (state.selectedShip && Object.keys(state.slotAssignments).length > 0) {
          saveCurrentLoadoutToLocalStorage({
            shipId: state.selectedShip.id,
            components: state.slotAssignments,
            name: name,
            isOptimized: !!state.lastOptimizedPreset,
            optimizedPreset: state.lastOptimizedPreset || "",
            stats: state.loadedLoadout?.stats,
          });
        }
      },

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
      // Cargar el loadout guardado al inicializar
      onRehydrateStorage: () => (state) => {
        // Intentar cargar el loadout desde localStorage
        const saved = loadCurrentLoadoutFromLocalStorage();
        if (saved && state) {
          // Si hay un loadout guardado, actualizar el estado
          return {
            ...state,
            slotAssignments: saved.components || state.slotAssignments || {},
            loadoutName: saved.name || state.loadoutName || "",
            lastOptimizedPreset: saved.optimizedPreset || state.lastOptimizedPreset || "",
          };
        }
        return state;
      },
    }
  )
);
