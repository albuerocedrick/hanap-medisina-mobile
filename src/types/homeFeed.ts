/**
 * src/types/homeFeed.ts
 *
 * TypeScript interfaces for the Home Feed aggregation document.
 *
 * These types represent the structure of the `system_config/home_feed`
 * Firestore document and are used across:
 *   - src/services/firebaseFeed.ts (reads & validates the document)
 *   - src/store/useFeedStore.ts (persists and exposes the data)
 *   - src/components/home/ (renders each section)
 *
 * Phase 6 — Read-Only: The mobile app ONLY reads this document.
 * All writes must be done via Firebase Console or the Admin SDK.
 */

// ─────────────────────────────────────────────
// PLANT OF THE DAY
// ─────────────────────────────────────────────

/**
 * The curated plant featured as a large hero card on the Home Tab.
 * `id` maps directly to a document ID in the `plants` Firestore collection.
 */
export interface PlantOfTheDay {
  /** Corresponds to the plant document ID in the `plants` collection. */
  id: string;
  name: string;
  scientificName: string;
  /** Short description shown on the hero card overlay. */
  subtitle: string;
  /** Cloudinary URL for the full-bleed hero image. */
  heroImageUrl: string;
}

// ─────────────────────────────────────────────
// CATEGORY CHIP
// ─────────────────────────────────────────────

/**
 * A single category chip displayed in the horizontal filter row.
 * `id` must match the exact category strings stored on plant documents
 * (e.g. "Coughs", "Wounds", "Skin") so filtering works correctly.
 */
export interface FeedCategory {
  /** Exact string match to plant.categories[] values in Firestore. */
  id: string;
  /** Human-readable display label (e.g. "Coughs & Colds"). */
  name: string;
  /** A valid Feather icon name (e.g. "thermometer", "wind", "droplet"). */
  icon: string;
}

// ─────────────────────────────────────────────
// FEATURED PLANT
// ─────────────────────────────────────────────

/**
 * A plant shown in the horizontal "Featured Plants" scroll row.
 * Only preview fields are stored here — full details are fetched
 * from the `plants` collection when the user taps the card.
 */
export interface FeaturedPlant {
  /** Corresponds to the plant document ID in the `plants` collection. */
  id: string;
  name: string;
  scientificName: string;
  /** Cloudinary URL for the small square card thumbnail. */
  thumbnailUrl: string;
}

// ─────────────────────────────────────────────
// TRIVIA ITEM
// ─────────────────────────────────────────────

/**
 * A single daily trivia fact.
 * The array contains 7 items (one per day of the week).
 * The app selects today's fact via: weeklyTrivia[new Date().getDay()]
 * This rotates the trivia daily without any network calls.
 */
export interface TriviaItem {
  /** Unique identifier for this trivia item (e.g. "t0"–"t6"). */
  id: string;
  /** The trivia text displayed to the user. */
  text: string;
}

// ─────────────────────────────────────────────
// HOME FEED DATA (root document shape)
// ─────────────────────────────────────────────

/**
 * The complete shape of the `system_config/home_feed` Firestore document.
 * This is validated and returned by `getHomeFeed()` in firebaseFeed.ts.
 */
export interface HomeFeedData {
  plantOfTheDay: PlantOfTheDay;
  categories: FeedCategory[];
  featuredPlants: FeaturedPlant[];
  /** Always 7 items — one fact per day of the week (index 0 = Sunday). */
  weeklyTrivia: TriviaItem[];
}
