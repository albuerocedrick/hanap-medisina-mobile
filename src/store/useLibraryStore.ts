/**
 * store/useLibraryStore.ts
 *
 * Single source of truth for the Library tab, plant details, favorites,
 * and the offline data gate.
 *
 * Phase 3:
 *  - Fetches plant list and categories from Firestore (online only).
 *  - Persists full Plant objects as favorites to AsyncStorage.
 *  - `getDisplayedPlants()` automatically gates between online list
 *    and offline favorites-only view.
 *  - Search and filter run client-side (zero extra reads).
 *
 * Phase 4:
 *  - `syncQueue` slot and all its actions are pre-defined here.
 *    The sync engine (useSyncStore) will call `addToSyncQueue` after
 *    every offline scan, and `processSyncQueue` / `clearSyncQueue`
 *    after a successful backend handshake.
 *  - `useNetworkStore.setHasPendingSync()` is called automatically
 *    whenever the queue grows or shrinks.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  getAllCategories,
  getAllPlants,
  getPlantsByCategory,
  getPlantsByIds,
  Plant,
  PlantSummary,
  searchPlantsLocally,
} from "../services/firebaseLibrary";
import { useNetworkStore } from "./useNetworkStore";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

/**
 * Phase 4 pre-wire: one queued offline scan.
 * Populated by the Scan tab after a TFLite identification when offline.
 * Mirrors the payload the Express backend expects on sync.
 */
export interface ScanQueueItem {
  /** Client-generated UUID. Used for deduplication on retry. */
  queueId: string;
  /** Local filesystem URI from Vision Camera. Uploaded to Cloudinary on sync. */
  imageUri: string;
  /** Firestore document ID of the identified plant. */
  plantId: string;
  /** TFLite model confidence score (0–1). */
  confidence: number;
  /** ISO timestamp of when the scan was performed offline. */
  scannedAt: string;
  /** True while a sync attempt is in progress (prevents duplicate sends). */
  isSyncing: boolean;
  /** Number of failed sync attempts. Phase 4 uses this for back-off logic. */
  retryCount: number;
}

export type LibraryErrorCode =
  | "FETCH_PLANTS_FAILED"
  | "FETCH_CATEGORIES_FAILED"
  | "FAVORITES_LOAD_FAILED"
  | "FAVORITES_SAVE_FAILED"
  | "SYNC_QUEUE_ERROR"; // Phase 4

export class LibraryStoreError extends Error {
  constructor(
    public readonly code: LibraryErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LibraryStoreError";
  }
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const FAVORITES_STORAGE_KEY = "hanapmedisina_favorites";

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

interface LibraryState {
  // ── Plant List ────────────────────────────────────────────────────────────
  /** Full list fetched from Firestore (online mode). */
  plants: PlantSummary[];

  /** Available category strings for FilterPills. */
  categories: string[];

  /** Loading flag for the main plant list fetch. */
  isLoadingPlants: boolean;

  /** Loading flag for categories fetch. */
  isLoadingCategories: boolean;

  // ── Search & Filter ───────────────────────────────────────────────────────
  /** Raw string from SearchBar input. Filtered client-side. */
  searchQuery: string;

  /**
   * Active category filter. `null` means "All".
   * When set, triggers a Firestore category query (online)
   * or client-side filter on favorites (offline).
   */
  activeCategory: string | null;

  // ── Favorites (Offline Storage) ───────────────────────────────────────────
  /**
   * Full Plant objects persisted to AsyncStorage.
   * Storing full objects (not just IDs) ensures zero-network offline access.
   */
  favorites: Plant[];

  /**
   * Set of favorited plant IDs for O(1) membership checks.
   * Derived from `favorites` and kept in sync — never set manually.
   */
  favoriteIds: Set<string>;

  /** True while AsyncStorage is being read on app startup. */
  isLoadingFavorites: boolean;

  // ── Errors ────────────────────────────────────────────────────────────────
  plantsError: LibraryStoreError | null;
  categoriesError: LibraryStoreError | null;
  favoritesError: LibraryStoreError | null;

  // ── Phase 4 Pre-wire: Sync Queue ──────────────────────────────────────────
  /**
   * Offline scans waiting to be uploaded when connectivity is restored.
   * Persisted to AsyncStorage so the queue survives app restarts.
   * Phase 3: Always an empty array. Phase 4 populates it.
   */
  syncQueue: ScanQueueItem[];
}

interface LibraryActions {
  // ── Data Fetching ─────────────────────────────────────────────────────────

  /**
   * Fetches the full plant list from Firestore.
   * Should only be called when `isOnline` is true.
   * No-ops silently if a fetch is already in progress.
   */
  fetchPlants: () => Promise<void>;

  /**
   * Fetches plants filtered by the active category.
   * Falls back to `fetchPlants()` if `activeCategory` is null.
   */
  fetchPlantsByActiveCategory: () => Promise<void>;

  /**
   * Fetches the available category list from Firestore.
   * Called once on Library mount and cached until the app restarts.
   */
  fetchCategories: () => Promise<void>;

  // ── Search & Filter ───────────────────────────────────────────────────────

  setSearchQuery: (query: string) => void;

  /**
   * Sets the active category filter.
   * Passing `null` resets to "All" and re-fetches the full list.
   */
  setActiveCategory: (category: string | null) => void;

  /**
   * Derived selector: returns the list the Library feed should display.
   *
   * Online:  `plants` filtered by `searchQuery`.
   * Offline: `favorites` filtered by `searchQuery`.
   *
   * This is the ONLY place the online/offline gate logic lives.
   * Components never read `plants` or `favorites` directly for display.
   */
  getDisplayedPlants: () => (PlantSummary | Plant)[];

  // ── Favorites ─────────────────────────────────────────────────────────────

  /**
   * Toggles a plant in/out of favorites and persists the new list.
   * Accepts a full `Plant` so the offline cache is always complete.
   */
  toggleFavorite: (plant: Plant) => Promise<void>;

  /** Returns true if the given plant ID is currently favorited. */
  isFavorite: (plantId: string) => boolean;

  /**
   * Re-hydrates favorites from AsyncStorage.
   * Call once from the root layout on app mount.
   * Also attempts to refresh stale favorite data from Firestore when online.
   */
  loadFavorites: () => Promise<void>;

  // ── Error Management ──────────────────────────────────────────────────────

  clearErrors: () => void;

  // ── Phase 4 Pre-wire: Sync Queue Actions ──────────────────────────────────

  /**
   * Appends a new offline scan to the persistent sync queue.
   * Also signals useNetworkStore that pending syncs exist.
   * Phase 3: Defined but never called — the Scan tab calls this in Phase 4.
   */
  addToSyncQueue: (
    item: Omit<ScanQueueItem, "isSyncing" | "retryCount">,
  ) => void;

  /**
   * Marks a queue item as actively syncing (prevents duplicate sends).
   * Phase 4: Called by the sync engine before firing the Axios request.
   */
  markQueueItemSyncing: (queueId: string, isSyncing: boolean) => void;

  /**
   * Increments the retry counter for a failed sync item.
   * Phase 4: Called by the sync engine on Axios/backend error.
   */
  incrementRetryCount: (queueId: string) => void;

  /**
   * Removes a successfully synced item from the queue.
   * Phase 4: Called per-item after a confirmed backend write.
   */
  removeFromSyncQueue: (queueId: string) => void;

  /**
   * Wipes the entire queue after a full sync session completes.
   * Phase 4: Called after all items in a batch are confirmed.
   */
  clearSyncQueue: () => void;
}

type LibraryStore = LibraryState & LibraryActions;

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/** Wraps a FirebaseLibraryError (or unknown) into a LibraryStoreError. */
function wrapError(
  code: LibraryErrorCode,
  message: string,
  cause: unknown,
): LibraryStoreError {
  return new LibraryStoreError(code, message, cause);
}

/** Updates useNetworkStore's pending sync flag based on current queue length. */
function syncPendingFlag(queueLength: number): void {
  useNetworkStore.getState().setHasPendingSync(queueLength > 0);
}

// ─────────────────────────────────────────────
// STORE
// Persist is scoped to only the fields that must survive app restarts:
// favorites and syncQueue. Volatile state (plants, categories, UI state)
// is intentionally excluded and re-fetched fresh each session.
// ─────────────────────────────────────────────

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      plants: [],
      categories: [],
      isLoadingPlants: false,
      isLoadingCategories: false,
      searchQuery: "",
      activeCategory: null,
      favorites: [],
      favoriteIds: new Set<string>(),
      isLoadingFavorites: false,
      plantsError: null,
      categoriesError: null,
      favoritesError: null,
      syncQueue: [], // Phase 4: starts empty

      // ── Data Fetching ──────────────────────────────────────────────────────

      fetchPlants: async () => {
        if (get().isLoadingPlants) return;

        set({ isLoadingPlants: true, plantsError: null });

        try {
          const plants = await getAllPlants();
          set({ plants, isLoadingPlants: false });
        } catch (err) {
          const error = wrapError(
            "FETCH_PLANTS_FAILED",
            "Could not load the plant library. Please check your connection.",
            err,
          );
          console.error("[useLibraryStore] fetchPlants:", error.message, err);
          set({ isLoadingPlants: false, plantsError: error });
        }
      },

      fetchPlantsByActiveCategory: async () => {
        const { activeCategory } = get();

        // No active filter — just fetch everything
        if (!activeCategory) {
          return get().fetchPlants();
        }

        if (get().isLoadingPlants) return;

        set({ isLoadingPlants: true, plantsError: null });

        try {
          const plants = await getPlantsByCategory(activeCategory);
          set({ plants, isLoadingPlants: false });
        } catch (err) {
          const error = wrapError(
            "FETCH_PLANTS_FAILED",
            `Could not load plants for category "${activeCategory}".`,
            err,
          );
          console.error(
            "[useLibraryStore] fetchPlantsByActiveCategory:",
            error.message,
            err,
          );
          set({ isLoadingPlants: false, plantsError: error });
        }
      },

      fetchCategories: async () => {
        // Only fetch once per session unless cleared
        if (get().categories.length > 0 || get().isLoadingCategories) return;

        set({ isLoadingCategories: true, categoriesError: null });

        try {
          const categories = await getAllCategories();
          set({ categories, isLoadingCategories: false });
        } catch (err) {
          const error = wrapError(
            "FETCH_CATEGORIES_FAILED",
            "Could not load plant categories.",
            err,
          );
          console.error(
            "[useLibraryStore] fetchCategories:",
            error.message,
            err,
          );
          set({ isLoadingCategories: false, categoriesError: error });
        }
      },

      // ── Search & Filter ────────────────────────────────────────────────────

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setActiveCategory: (category) => {
        set({ activeCategory: category });
        // Trigger a fresh Firestore fetch for the new category.
        // getDisplayedPlants() will re-derive on next render.
        get().fetchPlantsByActiveCategory();
      },

      getDisplayedPlants: () => {
        const { plants, favorites, searchQuery } = get();
        const isOnline = useNetworkStore.getState().isOnline;

        // ── Offline gate ───────────────────────────────────────────────────
        // When offline, ONLY show favorites regardless of any other state.
        const sourceList: PlantSummary[] = isOnline
          ? plants
          : favorites.map((f) => ({
              id: f.id,
              name: f.name,
              scientificName: f.scientificName,
              imageUrl: f.imageUrl,
              categories: f.categories,
            }));

        // ── Client-side search ─────────────────────────────────────────────
        return searchPlantsLocally(sourceList, searchQuery);
      },

      // ── Favorites ──────────────────────────────────────────────────────────

      toggleFavorite: async (plant: Plant) => {
        const { favorites } = get();
        const isCurrentlyFavorited = get().isFavorite(plant.id);

        let updatedFavorites: Plant[];

        if (isCurrentlyFavorited) {
          updatedFavorites = favorites.filter((f) => f.id !== plant.id);
        } else {
          // Store the full Plant object for complete offline access
          updatedFavorites = [...favorites, plant];
        }

        const updatedIds = new Set(updatedFavorites.map((f) => f.id));

        // Optimistic update — UI responds instantly
        set({ favorites: updatedFavorites, favoriteIds: updatedIds });

        // Persist to AsyncStorage in the background
        try {
          await AsyncStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(updatedFavorites),
          );
        } catch (err) {
          // Rollback optimistic update on storage failure
          const rollbackIds = new Set(favorites.map((f) => f.id));
          set({ favorites, favoriteIds: rollbackIds });

          const error = wrapError(
            "FAVORITES_SAVE_FAILED",
            `Could not save favorite for "${plant.name}". Please try again.`,
            err,
          );
          console.error(
            "[useLibraryStore] toggleFavorite:",
            error.message,
            err,
          );
          set({ favoritesError: error });
        }
      },

      isFavorite: (plantId: string) => {
        return get().favoriteIds.has(plantId);
      },

      loadFavorites: async () => {
        set({ isLoadingFavorites: true, favoritesError: null });

        try {
          const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
          const stored: Plant[] = raw ? JSON.parse(raw) : [];

          const favoriteIds = new Set(stored.map((f) => f.id));
          set({ favorites: stored, favoriteIds, isLoadingFavorites: false });

          // ── Stale-while-revalidate: refresh cached favorites from Firestore ──
          // When online, silently re-fetch full plant objects so cached data
          // stays current (e.g. imageUrl or details updated in Firestore).
          const isOnline = useNetworkStore.getState().isOnline;
          if (isOnline && stored.length > 0) {
            const ids = stored.map((f) => f.id);
            getPlantsByIds(ids)
              .then((freshPlants) => {
                if (freshPlants.length > 0) {
                  const freshIds = new Set(freshPlants.map((p) => p.id));
                  set({ favorites: freshPlants, favoriteIds: freshIds });
                  AsyncStorage.setItem(
                    FAVORITES_STORAGE_KEY,
                    JSON.stringify(freshPlants),
                  ).catch((e) =>
                    console.warn(
                      "[useLibraryStore] Silent favorites refresh save failed:",
                      e,
                    ),
                  );
                }
              })
              .catch((e) =>
                // Non-critical: stale cache is still better than nothing offline
                console.warn(
                  "[useLibraryStore] Silent favorites refresh failed:",
                  e,
                ),
              );
          }
        } catch (err) {
          const error = wrapError(
            "FAVORITES_LOAD_FAILED",
            "Could not load your saved plants. Offline access may be limited.",
            err,
          );
          console.error("[useLibraryStore] loadFavorites:", error.message, err);
          set({ isLoadingFavorites: false, favoritesError: error });
        }
      },

      // ── Error Management ───────────────────────────────────────────────────

      clearErrors: () => {
        set({
          plantsError: null,
          categoriesError: null,
          favoritesError: null,
        });
      },

      // ── Phase 4 Pre-wire: Sync Queue ───────────────────────────────────────

      addToSyncQueue: (item) => {
        const newItem: ScanQueueItem = {
          ...item,
          isSyncing: false,
          retryCount: 0,
        };

        const updatedQueue = [...get().syncQueue, newItem];
        set({ syncQueue: updatedQueue });
        syncPendingFlag(updatedQueue.length);
      },

      markQueueItemSyncing: (queueId, isSyncing) => {
        set((state) => ({
          syncQueue: state.syncQueue.map((item) =>
            item.queueId === queueId ? { ...item, isSyncing } : item,
          ),
        }));
      },

      incrementRetryCount: (queueId) => {
        set((state) => ({
          syncQueue: state.syncQueue.map((item) =>
            item.queueId === queueId
              ? { ...item, retryCount: item.retryCount + 1, isSyncing: false }
              : item,
          ),
        }));
      },

      removeFromSyncQueue: (queueId) => {
        const updatedQueue = get().syncQueue.filter(
          (item) => item.queueId !== queueId,
        );
        set({ syncQueue: updatedQueue });
        syncPendingFlag(updatedQueue.length);
      },

      clearSyncQueue: () => {
        set({ syncQueue: [] });
        syncPendingFlag(0);
      },
    }),

    // ── Persist Config ─────────────────────────────────────────────────────
    // Only persist what must survive app restarts.
    // `plants`, `categories`, and UI state are always re-fetched fresh.
    {
      name: "library-store",
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        favorites: state.favorites,
        syncQueue: state.syncQueue, // Phase 4: persists the offline scan queue
      }),

      /**
       * After rehydration from AsyncStorage, the `favoriteIds` Set must be
       * rebuilt from the restored `favorites` array because Sets are not
       * JSON-serializable and are stored as empty objects by default.
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const restoredIds = new Set(state.favorites.map((f: Plant) => f.id));
        state.favoriteIds = restoredIds;

        // Restore the pending sync flag after app restart
        syncPendingFlag(state.syncQueue.length);
      },
    },
  ),
);

// ─────────────────────────────────────────────
// SELECTOR HOOKS
// Fine-grained selectors prevent full-store re-renders.
// ─────────────────────────────────────────────

export const selectIsLoadingPlants = (s: LibraryStore) => s.isLoadingPlants;
export const selectPlantsError = (s: LibraryStore) => s.plantsError;
export const selectCategories = (s: LibraryStore) => s.categories;
export const selectActiveCategory = (s: LibraryStore) => s.activeCategory;
export const selectSearchQuery = (s: LibraryStore) => s.searchQuery;
export const selectFavorites = (s: LibraryStore) => s.favorites;
export const selectFavoritesCount = (s: LibraryStore) => s.favorites.length;
export const selectFavoritesError = (s: LibraryStore) => s.favoritesError;

/** Phase 4: sync queue selectors */
export const selectSyncQueue = (s: LibraryStore) => s.syncQueue;
export const selectSyncQueueLength = (s: LibraryStore) => s.syncQueue.length;
export const selectPendingSyncItems = (s: LibraryStore) =>
  s.syncQueue.filter((item) => !item.isSyncing && item.retryCount < 3);
