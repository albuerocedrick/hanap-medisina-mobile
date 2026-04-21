/**
 * services/firebaseLibrary.ts
 *
 * Isolated Firestore READ layer for HanapMedisina.
 *
 * Rules:
 *  - NO writes happen here. All writes route through the Express backend.
 *  - Every public function returns a typed result or throws a FirebaseLibraryError.
 *  - Phase 4 hooks are pre-wired: getPlantsByIds() powers offline favorites hydration,
 *    and the error taxonomy is already compatible with the sync engine's retry logic.
 */

import {
  collection,
  doc,
  DocumentData,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { db } from "./firebase"; // Your initialized Firestore instance

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface PlantDetails {
  localName: string;
  preparation: string[];
  facts: Record<string, string>;
  warnings: string[];
}

export interface ResearchItem {
  title: string;
  summary: string;
  reference: string;
  year: number;
}

export interface ComparisonTraits {
  leaf: string;
  flower: string;
  stem: string;
  smell: string;
}

/** Full plant document — shape mirrors the Firestore schema exactly. */
export interface Plant {
  id: string; // Injected from document ID (e.g. "aloe_vera_01")
  name: string;
  scientificName: string;
  imageUrl: string;
  categories: string[];
  lookAlikeIds: string[];
  details: PlantDetails;
  research: ResearchItem[];
  comparisonTraits: ComparisonTraits;
}

/** Lightweight shape used in list views and PlantCard. Avoids fetching heavy sub-arrays. */
export type PlantSummary = Pick<
  Plant,
  "id" | "name" | "scientificName" | "imageUrl" | "categories"
>;

/** Discriminated error type so callers can handle each case explicitly. */
export type FirebaseLibraryErrorCode =
  | "NOT_FOUND" // Document exists in query but is empty (edge case)
  | "FETCH_FAILED" // Network or Firestore SDK error
  | "INVALID_DATA" // Document exists but fails shape validation
  | "EMPTY_QUERY"; // Query returned 0 documents (not an error per se, but explicit)

export class FirebaseLibraryError extends Error {
  constructor(
    public readonly code: FirebaseLibraryErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FirebaseLibraryError";
  }
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PLANTS_COLLECTION = "plants";

/**
 * Maximum plants to fetch in a single list query.
 * Prevents runaway reads. Increase when pagination is added in Phase 5.
 */
const MAX_PLANT_LIST_LIMIT = 200;

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/**
 * Validates and maps a raw Firestore document into a typed Plant.
 * Throws FirebaseLibraryError("INVALID_DATA") if required fields are missing.
 */
function mapDocToPlant(
  docSnap: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>,
): Plant {
  const data = docSnap.data();

  if (!data) {
    throw new FirebaseLibraryError(
      "NOT_FOUND",
      `Document "${docSnap.id}" exists but has no data.`,
    );
  }

  // Required top-level field guards
  const requiredFields: (keyof Omit<Plant, "id">)[] = [
    "name",
    "scientificName",
    "imageUrl",
    "categories",
    "details",
    "research",
    "comparisonTraits",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new FirebaseLibraryError(
        "INVALID_DATA",
        `Plant "${docSnap.id}" is missing required field: "${field}".`,
      );
    }
  }

  return {
    id: docSnap.id,
    name: data.name,
    scientificName: data.scientificName,
    imageUrl: data.imageUrl,
    categories: Array.isArray(data.categories) ? data.categories : [],
    lookAlikeIds: Array.isArray(data.lookAlikeIds) ? data.lookAlikeIds : [],
    details: {
      localName: data.details?.localName ?? "",
      preparation: Array.isArray(data.details?.preparation)
        ? data.details.preparation
        : [],
      facts:
        data.details?.facts && typeof data.details.facts === "object"
          ? data.details.facts
          : {},
      warnings: Array.isArray(data.details?.warnings)
        ? data.details.warnings
        : [],
    },
    research: Array.isArray(data.research)
      ? data.research.map((r: Partial<ResearchItem>) => ({
          title: r.title ?? "",
          summary: r.summary ?? "",
          reference: r.reference ?? "",
          year: r.year ?? 0,
        }))
      : [],
    comparisonTraits: {
      leaf: data.comparisonTraits?.leaf ?? "",
      flower: data.comparisonTraits?.flower ?? "",
      stem: data.comparisonTraits?.stem ?? "",
      smell: data.comparisonTraits?.smell ?? "",
    },
  };
}

/**
 * Maps a document to the lightweight PlantSummary shape.
 * Used for list queries — skips heavy research and detail arrays.
 */
function mapDocToSummary(
  docSnap: QueryDocumentSnapshot<DocumentData>,
): PlantSummary {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name ?? "",
    scientificName: data.scientificName ?? "",
    imageUrl: data.imageUrl ?? "",
    categories: Array.isArray(data.categories) ? data.categories : [],
  };
}

// ─────────────────────────────────────────────
// PUBLIC READ API
// ─────────────────────────────────────────────

/**
 * Fetches the full list of plants as lightweight summaries.
 *
 * Used by: Library index.tsx feed
 * Phase 4 note: When offline, the store falls back to AsyncStorage favorites
 * instead of calling this function.
 */
export async function getAllPlants(): Promise<PlantSummary[]> {
  try {
    const constraints: QueryConstraint[] = [
      orderBy("name"),
      limit(MAX_PLANT_LIST_LIMIT),
    ];

    const q = query(collection(db, PLANTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return []; // Legitimate empty state — let the UI handle it
    }

    return snapshot.docs.map(mapDocToSummary);
  } catch (err) {
    throw new FirebaseLibraryError(
      "FETCH_FAILED",
      "Failed to fetch plant list from Firestore.",
      err,
    );
  }
}

/**
 * Fetches a single plant's full document by its Firestore document ID.
 *
 * Used by: [id].tsx plant details screen
 * Phase 4 note: Offline detail views are hydrated from the local favorites cache,
 * so this is only called when the device is online.
 */
export async function getPlantById(id: string): Promise<Plant> {
  if (!id || typeof id !== "string") {
    throw new FirebaseLibraryError(
      "INVALID_DATA",
      `getPlantById received an invalid ID: "${id}".`,
    );
  }

  try {
    const docRef = doc(db, PLANTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new FirebaseLibraryError(
        "NOT_FOUND",
        `No plant found with ID "${id}".`,
      );
    }

    return mapDocToPlant(docSnap);
  } catch (err) {
    // Re-throw our own typed errors untouched
    if (err instanceof FirebaseLibraryError) throw err;

    throw new FirebaseLibraryError(
      "FETCH_FAILED",
      `Failed to fetch plant "${id}" from Firestore.`,
      err,
    );
  }
}

/**
 * Fetches multiple plants by an array of document IDs in parallel.
 *
 * Used by:
 *  - Offline Favorites hydration (Phase 3 / 4): local storage holds IDs only;
 *    this re-hydrates them when the user comes back online.
 *  - Plant Comparison page: fetches exactly 2 plants simultaneously.
 *
 * Skips any IDs that resolve to missing documents (logs a warning instead of throwing).
 */
export async function getPlantsByIds(ids: string[]): Promise<Plant[]> {
  if (!ids || ids.length === 0) return [];

  const uniqueIds = [...new Set(ids.filter(Boolean))];

  try {
    const fetchPromises = uniqueIds.map((id) =>
      getPlantById(id).catch((err: FirebaseLibraryError) => {
        console.warn(
          `[firebaseLibrary] getPlantsByIds: skipping "${id}" — ${err.message}`,
        );
        return null; // Null entries are filtered below
      }),
    );

    const results = await Promise.all(fetchPromises);
    return results.filter((plant): plant is Plant => plant !== null);
  } catch (err) {
    throw new FirebaseLibraryError(
      "FETCH_FAILED",
      "Failed during batch plant fetch.",
      err,
    );
  }
}

/**
 * Fetches plants filtered by a single category string.
 *
 * Used by: FilterPills.tsx → Library index feed
 * Firestore requires a composite index on (categories array-contains, name asc).
 * Add that index in your Firebase console if not already present.
 */
export async function getPlantsByCategory(
  category: string,
): Promise<PlantSummary[]> {
  if (!category || typeof category !== "string") {
    throw new FirebaseLibraryError(
      "INVALID_DATA",
      `getPlantsByCategory received an invalid category: "${category}".`,
    );
  }

  try {
    const q = query(
      collection(db, PLANTS_COLLECTION),
      where("categories", "array-contains", category),
      orderBy("name"),
      limit(MAX_PLANT_LIST_LIMIT),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return [];

    return snapshot.docs.map(mapDocToSummary);
  } catch (err) {
    throw new FirebaseLibraryError(
      "FETCH_FAILED",
      `Failed to fetch plants for category "${category}".`,
      err,
    );
  }
}

/**
 * Fetches all unique category strings across the plant collection.
 *
 * Used by: FilterPills.tsx to dynamically render filter options.
 *
 * Note: Firestore has no native "distinct" query. This fetches the full
 * summary list and derives unique categories client-side. Acceptable at
 * current scale (≤200 docs). If the collection grows beyond ~1000 documents,
 * move categories to a dedicated Firestore `metadata/categories` document.
 */
export async function getAllCategories(): Promise<string[]> {
  try {
    const plants = await getAllPlants();
    const categorySet = new Set<string>();

    for (const plant of plants) {
      for (const cat of plant.categories) {
        if (cat) categorySet.add(cat);
      }
    }

    return [...categorySet].sort();
  } catch (err) {
    if (err instanceof FirebaseLibraryError) throw err;

    console.error("RAW FIREBASE ERROR:", err);
    throw new FirebaseLibraryError(
      "FETCH_FAILED",
      "Failed to derive category list.",
      err,
    );
  }
}

/**
 * Client-side search over a pre-fetched plant list.
 *
 * Firestore does not support native full-text search. This function takes
 * the already-fetched list (from the Zustand store) and filters it in memory,
 * avoiding an extra network round-trip on every keystroke.
 *
 * Used by: SearchBar.tsx → Library index store action
 * Phase 4 note: Works identically in offline mode since it operates on the
 * in-memory list (online) or the favorites cache (offline).
 *
 * @param plants - The full or filtered list already held in state
 * @param query  - The raw string from the search input
 */
export function searchPlantsLocally(
  plants: PlantSummary[],
  query: string,
): PlantSummary[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) return plants;

  return plants.filter(
    (plant) =>
      plant.name.toLowerCase().includes(normalized) ||
      plant.scientificName.toLowerCase().includes(normalized) ||
      plant.categories.some((cat) => cat.toLowerCase().includes(normalized)),
  );
}
