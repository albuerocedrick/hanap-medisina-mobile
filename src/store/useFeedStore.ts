/**
 * src/store/useFeedStore.ts
 *
 * Single source of truth for Home Tab feed data.
 *
 * Manages the fetch → persist → hydrate lifecycle for the
 * `system_config/home_feed` Firestore aggregation document.
 *
 * Phase 6 — Offline-First Strategy:
 *  - On launch: Zustand rehydrates all feed data instantly from AsyncStorage.
 *  - In background: fetchHomeFeed() silently updates state from Firestore.
 *  - On failure: Stale cached data is preserved — never wiped on error.
 *  - Trivia: getTodayTrivia() rotates daily using new Date().getDay() — no network needed.
 *
 * Read/Write Split:
 *  - This store ONLY reads from Firestore via firebaseFeed.ts.
 *  - All writes to system_config/home_feed go through Firebase Console or Admin SDK.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getHomeFeed, FirebaseFeedError } from "../services/firebaseFeed";
import {
  FeaturedPlant,
  FeedCategory,
  PlantOfTheDay,
  TriviaItem,
} from "../types/homeFeed";

// ─────────────────────────────────────────────
// ERROR TYPE
// ─────────────────────────────────────────────

export type FeedStoreErrorCode =
  | "FETCH_FAILED"
  | "NOT_FOUND"
  | "INVALID_DATA";

export class FeedStoreError extends Error {
  constructor(
    public readonly code: FeedStoreErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FeedStoreError";
  }
}

// ─────────────────────────────────────────────
// STATE & ACTIONS INTERFACES
// ─────────────────────────────────────────────

interface FeedState {
  /** The curated hero plant for the Home Tab. Null until first successful fetch. */
  plantOfTheDay: PlantOfTheDay | null;

  /** Category chips shown on the Home Tab. Empty until first successful fetch. */
  categories: FeedCategory[];

  /** Featured plant cards shown in the horizontal scroll row. */
  featuredPlants: FeaturedPlant[];

  /**
   * 7 trivia facts — one per day of the week (index 0 = Sunday).
   * Rotated offline via getTodayTrivia().
   */
  weeklyTrivia: TriviaItem[];

  /** True while the Firestore fetch is in-flight. */
  isLoadingFeed: boolean;

  /**
   * Set on fetch failure. Does NOT clear existing cached data.
   * Stale-while-error: the UI still renders last known good data.
   */
  feedError: FeedStoreError | null;

  /**
   * Unix timestamp (ms) of the last successful fetch.
   * Useful for showing a "Last updated X minutes ago" label if needed.
   */
  lastFetchedAt: number | null;
}

interface FeedActions {
  /**
   * Fetches the home feed from Firestore and updates all state fields.
   *
   * Behaviour:
   *  - Guards against concurrent in-flight fetches.
   *  - On success: updates all fields and sets lastFetchedAt = Date.now().
   *  - On failure: sets feedError. Does NOT clear existing cached data.
   */
  fetchHomeFeed: () => Promise<void>;

  /**
   * Returns the trivia fact for today based on the day of the week.
   * Uses new Date().getDay() (0 = Sunday, 6 = Saturday).
   * Returns null if the weeklyTrivia array is empty (not yet fetched).
   */
  getTodayTrivia: () => TriviaItem | null;

  /** Clears the feedError field without affecting any cached data. */
  clearFeedError: () => void;
}

type FeedStore = FeedState & FeedActions;

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useFeedStore = create<FeedStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      plantOfTheDay: null,
      categories: [],
      featuredPlants: [],
      weeklyTrivia: [],
      isLoadingFeed: false,
      feedError: null,
      lastFetchedAt: null,

      // ── Actions ────────────────────────────────────────────────────────────

      fetchHomeFeed: async () => {
        // Guard: prevent duplicate concurrent fetches
        if (get().isLoadingFeed) return;

        set({ isLoadingFeed: true, feedError: null });

        try {
          const feedData = await getHomeFeed();

          set({
            plantOfTheDay: feedData.plantOfTheDay,
            categories: feedData.categories,
            featuredPlants: feedData.featuredPlants,
            weeklyTrivia: feedData.weeklyTrivia,
            isLoadingFeed: false,
            feedError: null,
            lastFetchedAt: Date.now(),
          });
        } catch (err) {
          // Map FirebaseFeedError codes to FeedStoreError codes
          let code: FeedStoreErrorCode = "FETCH_FAILED";
          let message = "Could not load the home feed. Showing cached content.";

          if (err instanceof FirebaseFeedError) {
            if (err.code === "NOT_FOUND") {
              code = "NOT_FOUND";
              message = "Home feed config not found. Please contact support.";
            } else if (err.code === "INVALID_DATA") {
              code = "INVALID_DATA";
              message = "Home feed data is malformed. Please contact support.";
            }
          }

          const storeError = new FeedStoreError(code, message, err);
          console.error("[useFeedStore] fetchHomeFeed failed:", message, err);

          // CRITICAL: Do NOT clear existing cached data on failure.
          // Stale data is always better than an empty screen.
          set({ isLoadingFeed: false, feedError: storeError });
        }
      },

      getTodayTrivia: () => {
        const { weeklyTrivia } = get();
        if (!weeklyTrivia || weeklyTrivia.length === 0) return null;

        // new Date().getDay() returns 0 (Sun) through 6 (Sat).
        // weeklyTrivia has 7 items seeded with ids t0–t6 mapping to these days.
        const dayIndex = new Date().getDay();
        return weeklyTrivia[dayIndex] ?? null;
      },

      clearFeedError: () => {
        set({ feedError: null });
      },
    }),

    // ── Persist Config ───────────────────────────────────────────────────────
    // Persist ALL feed data fields so the Home Tab renders instantly on
    // next app launch without waiting for a network round-trip.
    // isLoadingFeed and feedError are runtime-only — never persisted.
    {
      name: "hanapmedisina-feed-store",
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        plantOfTheDay: state.plantOfTheDay,
        categories: state.categories,
        featuredPlants: state.featuredPlants,
        weeklyTrivia: state.weeklyTrivia,
        lastFetchedAt: state.lastFetchedAt,
      }),
    },
  ),
);

// ─────────────────────────────────────────────
// SELECTOR HOOKS
// Fine-grained selectors prevent full-store re-renders.
// ─────────────────────────────────────────────

export const selectPlantOfTheDay = (s: FeedStore) => s.plantOfTheDay;
export const selectFeedCategories = (s: FeedStore) => s.categories;
export const selectFeaturedPlants = (s: FeedStore) => s.featuredPlants;
export const selectIsLoadingFeed = (s: FeedStore) => s.isLoadingFeed;
export const selectFeedError = (s: FeedStore) => s.feedError;
export const selectLastFetchedAt = (s: FeedStore) => s.lastFetchedAt;
