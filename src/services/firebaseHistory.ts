/**
 * src/services/firebaseHistory.ts
 *
 * Isolated Firestore READ layer for User Scan History with Pagination.
 */

import {
  collection,
  doc,
  DocumentData,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type SyncStatus = "synced" | "pending";

export interface ScanHistoryItem {
  id: string;
  plantName: string;
  confidence: number;
  imageUri: string;
  createdAt: number;
  status: SyncStatus;
}

export interface PaginatedHistoryResult {
  items: ScanHistoryItem[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export type FirebaseHistoryErrorCode =
  | "NOT_AUTHENTICATED"
  | "FETCH_FAILED"
  | "MISSING_INDEX";

export class FirebaseHistoryError extends Error {
  constructor(
    public readonly code: FirebaseHistoryErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FirebaseHistoryError";
  }
}

export function parseDateToMs(val: any): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val?.toMillis === "function") return val.toMillis();
  if (val instanceof Date) return val.getTime();
  if (typeof val === "string") {
    const parsed = new Date(val).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

function mapDocToScan(docSnap: QueryDocumentSnapshot<DocumentData>): ScanHistoryItem {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    plantName: data.plantName ?? "Unknown Plant",
    confidence: data.confidence ?? 0,
    imageUri: data.imageUrl ?? "",
    createdAt: parseDateToMs(data.scannedAt || data.syncedAt),
    status: "synced",
  };
}

/**
 * Fetches a paginated list of scans for the user.
 */
export async function getPaginatedUserScans(
  userId: string,
  sortOrder: "desc" | "asc" = "desc",
  lastVisible: QueryDocumentSnapshot<DocumentData> | null = null,
  pageSize: number = 10
): Promise<PaginatedHistoryResult> {
  if (!userId) {
    throw new FirebaseHistoryError("NOT_AUTHENTICATED", "User ID is required.");
  }

  try {
    const scansRef = collection(db, "users", userId, "scans");
    
    let q;
    if (lastVisible) {
      q = query(scansRef, orderBy("scannedAt", sortOrder), startAfter(lastVisible), limit(pageSize));
    } else {
      q = query(scansRef, orderBy("scannedAt", sortOrder), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { items: [], lastDoc: null, hasMore: false };
    }

    const items = snapshot.docs.map(mapDocToScan);
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return { 
      items, 
      lastDoc, 
      hasMore: snapshot.docs.length === pageSize 
    };
  } catch (err: any) {
    if (err.message?.includes("index")) {
      throw new FirebaseHistoryError("MISSING_INDEX", "Missing Firestore index.", err);
    }
    throw new FirebaseHistoryError("FETCH_FAILED", "Could not load history.", err);
  }
}

export async function getTotalScansCount(userId: string): Promise<number> {
  if (!userId) {
    throw new FirebaseHistoryError("NOT_AUTHENTICATED", "User ID is required.");
  }

  try {
    const scansRef = collection(db, "users", userId, "scans");
    // Use getCountFromServer instead of getDocs for massive performance/cost savings
    const snapshot = await getCountFromServer(scansRef);
    return snapshot.data().count;
  } catch (err: any) {
    throw new FirebaseHistoryError("FETCH_FAILED", "Could not count scans.", err);
  }
} 

export async function getScanById(userId: string, scanId: string): Promise<ScanHistoryItem> {
  if (!userId || !scanId) throw new Error("Missing userId or scanId");

  const docRef = doc(db, "users", userId, "scans", scanId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new FirebaseHistoryError("FETCH_FAILED", "Scan not found in database.");
  }

  return mapDocToScan(docSnap);
}