/**
 * src/services/firebaseFeed.ts
 *
 * Isolated Firestore READ layer for the Home Feed aggregation document.
 *
 * Rules:
 *  - NO writes happen here. The `system_config/home_feed` document is
 *    managed exclusively via Firebase Console or the Admin SDK (server-side).
 *  - Every public function returns a typed result or throws a FirebaseFeedError.
 *  - This service is called ONLY by useFeedStore.ts — never directly from components.
 *
 * Phase 6 — Single-document read pattern:
 *  A single getDoc() call to `system_config/home_feed` replaces multiple
 *  individual reads, optimizing for both performance and Firestore cost.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  FeaturedPlant,
  FeedCategory,
  HomeFeedData,
  PlantOfTheDay,
  TriviaItem,
} from "../types/homeFeed";

// ─────────────────────────────────────────────
// ERROR TYPE
// ─────────────────────────────────────────────

/** Discriminated error codes for explicit caller handling. */
export type FirebaseFeedErrorCode =
  | "NOT_FOUND"    // Document does not exist at system_config/home_feed
  | "FETCH_FAILED" // Network or Firestore SDK error
  | "INVALID_DATA"; // Document exists but fails shape validation

export class FirebaseFeedError extends Error {
  constructor(
    public readonly code: FirebaseFeedErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FirebaseFeedError";
  }
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const SYSTEM_CONFIG_COLLECTION = "system_config";
const HOME_FEED_DOC = "home_feed";

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/**
 * Validates and maps a raw Firestore document into a typed HomeFeedData object.
 * Throws FirebaseFeedError("INVALID_DATA") if any required top-level field is missing.
 */
function mapDocToHomeFeed(data: Record<string, any>): HomeFeedData {
  // ── Validate top-level required fields ──────────────────────────────────
  const requiredFields: (keyof HomeFeedData)[] = [
    "plantOfTheDay",
    "categories",
    "featuredPlants",
    "weeklyTrivia",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new FirebaseFeedError(
        "INVALID_DATA",
        `system_config/home_feed is missing required field: "${field}". Re-run seedHomeFeed.js.`,
      );
    }
  }

  // ── Map plantOfTheDay ────────────────────────────────────────────────────
  const potd = data.plantOfTheDay;
  const plantOfTheDay: PlantOfTheDay = {
    id: potd.id ?? "",
    name: potd.name ?? "",
    scientificName: potd.scientificName ?? "",
    subtitle: potd.subtitle ?? "",
    heroImageUrl: potd.heroImageUrl ?? "",
  };

  // ── Map categories ───────────────────────────────────────────────────────
  const categories: FeedCategory[] = Array.isArray(data.categories)
    ? data.categories.map((c: any) => ({
        id: c.id ?? "",
        name: c.name ?? "",
        icon: c.icon ?? "leaf",
      }))
    : [];

  // ── Map featuredPlants ───────────────────────────────────────────────────
  const featuredPlants: FeaturedPlant[] = Array.isArray(data.featuredPlants)
    ? data.featuredPlants.map((p: any) => ({
        id: p.id ?? "",
        name: p.name ?? "",
        scientificName: p.scientificName ?? "",
        thumbnailUrl: p.thumbnailUrl ?? "",
      }))
    : [];

  // ── Map weeklyTrivia ─────────────────────────────────────────────────────
  const weeklyTrivia: TriviaItem[] = Array.isArray(data.weeklyTrivia)
    ? data.weeklyTrivia.map((t: any) => ({
        id: t.id ?? "",
        text: t.text ?? "",
      }))
    : [];

  return {
    plantOfTheDay,
    categories,
    featuredPlants,
    weeklyTrivia,
  };
}

// ─────────────────────────────────────────────
// PUBLIC READ API
// ─────────────────────────────────────────────

/**
 * Fetches the Home Feed aggregation document from Firestore.
 *
 * Performs a single getDoc() to `system_config/home_feed`.
 * This document contains all data needed to render the Home Tab —
 * Plant of the Day, category chips, featured plant cards, and weekly trivia.
 *
 * Used by: useFeedStore.ts → fetchHomeFeed()
 *
 * Offline behaviour:
 *  The Firebase SDK caches this document automatically. If the device
 *  is offline, the SDK will return the cached version from its local
 *  persistence layer. The Zustand store additionally persists the result
 *  to AsyncStorage for zero-latency hydration on next app launch.
 *
 * @throws {FirebaseFeedError} NOT_FOUND   — document missing in Firestore
 * @throws {FirebaseFeedError} INVALID_DATA — document has unexpected shape
 * @throws {FirebaseFeedError} FETCH_FAILED — network or SDK failure
 */
export async function getHomeFeed(): Promise<HomeFeedData> {
  try {
    const docRef = doc(db, SYSTEM_CONFIG_COLLECTION, HOME_FEED_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new FirebaseFeedError(
        "NOT_FOUND",
        "system_config/home_feed document does not exist. Run seedHomeFeed.js to create it.",
      );
    }

    const data = docSnap.data() as Record<string, any>;
    return mapDocToHomeFeed(data);
  } catch (err) {
    // Re-throw our own typed errors untouched
    if (err instanceof FirebaseFeedError) throw err;

    throw new FirebaseFeedError(
      "FETCH_FAILED",
      "Failed to fetch home feed from Firestore.",
      err,
    );
  }
}
