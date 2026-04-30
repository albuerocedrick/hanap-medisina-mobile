import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useNetworkStore } from "./useNetworkStore";

// Defines exactly what the Express backend /sync endpoint expects
export interface SyncScanItem {
  localId: string;
  imageUri: string;     // The local file path from the camera
  plantName: string;    // The label identified by TFLite
  confidence: number;   // The confidence percentage
  details: string;      // Optional extra details
  scannedAt: string;    // ISO timestamp
  isSyncing: boolean;   // Prevents duplicate uploads
  retryCount: number;   // Tracks failed attempts
}

interface SyncState {
  syncQueue: SyncScanItem[];
  error: string | null;
  // ── Background sync progress ──────────────────────────────────────────────
  isRunningSync: boolean;   // True while background upload is active
  syncProgress: number;     // How many have been uploaded so far
  syncTotal: number;        // Total items in this sync run
  syncError: string | null; // Last sync-run error message, if any
}

interface SyncActions {
  /** Add a newly scanned plant to the offline queue */
  enqueueScan: (
    imageUri: string,
    plantName: string,
    confidence: number,
    details?: string
  ) => void;
  /** Remove a scan from the queue after successful upload */
  dequeueScan: (localId: string) => void;
  /** Empty the entire queue */
  clearQueue: () => void;
  /** Lock a scan to prevent duplicate simultaneous uploads */
  markSyncing: (localId: string, isSyncing: boolean) => void;
  /** Track a failed upload attempt */
  incrementRetry: (localId: string) => void;
  /**
   * Resets the retryCount for a specific scan back to 0,
   * making it eligible for automatic sync again.
   * Call this before runSync() when the user manually requests a retry.
   */
  resetRetryCount: (localId: string) => void;
  /** Clear any global store errors */
  clearError: () => void;
  /** Clear last sync error banner */
  clearSyncError: () => void;
  /**
   * Runs the full background sync: uploads all pending items one-by-one,
   * updates progress counters, and cleans up local files after success.
   * Safe to call multiple times — guarded by isRunningSync lock.
   */
  runSync: () => Promise<void>;
}

// Helper: Safely tells the network store whether we have pending offline items
const updateNetworkStoreFlag = (queueLength: number) => {
  try {
    useNetworkStore.getState().setHasPendingSync(queueLength > 0);
  } catch (err) {
    console.warn("[useSyncStore] Failed to update network store pending flag", err);
  }
};

export const useSyncStore = create<SyncState & SyncActions>()(
  persist(
    (set, get) => ({
      syncQueue: [],
      error: null,
      isRunningSync: false,
      syncProgress: 0,
      syncTotal: 0,
      syncError: null,

      enqueueScan: (imageUri, plantName, confidence, details = "") => {
        try {
          const localId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const newItem: SyncScanItem = {
            localId,
            imageUri,
            plantName,
            confidence,
            details,
            scannedAt: new Date().toISOString(),
            isSyncing: false,
            retryCount: 0,
          };
          const updatedQueue = [...get().syncQueue, newItem];
          set({ syncQueue: updatedQueue, error: null });
          updateNetworkStoreFlag(updatedQueue.length);
        } catch (err) {
          console.error("[useSyncStore] Error enqueuing scan:", err);
          set({ error: "Failed to save scan to offline queue." });
        }
      },

      dequeueScan: (localId) => {
        try {
          const updatedQueue = get().syncQueue.filter((item) => item.localId !== localId);
          set({ syncQueue: updatedQueue });
          updateNetworkStoreFlag(updatedQueue.length);
        } catch (err) {
          console.error("[useSyncStore] Error dequeuing scan:", err);
        }
      },

      clearQueue: () => {
        set({ syncQueue: [], error: null });
        updateNetworkStoreFlag(0);
      },

      markSyncing: (localId, isSyncing) => {
        set((state) => ({
          syncQueue: state.syncQueue.map((item) =>
            item.localId === localId ? { ...item, isSyncing } : item
          ),
        }));
      },

      incrementRetry: (localId) => {
        set((state) => ({
          syncQueue: state.syncQueue.map((item) =>
            item.localId === localId
              ? { ...item, retryCount: item.retryCount + 1, isSyncing: false }
              : item
          ),
        }));
      },

      resetRetryCount: (localId) => {
        set((state) => ({
          syncQueue: state.syncQueue.map((item) =>
            item.localId === localId
              ? { ...item, retryCount: 0, isSyncing: false }
              : item
          ),
        }));
      },

      clearError: () => set({ error: null }),
      clearSyncError: () => set({ syncError: null }),

      runSync: async () => {
        const { isRunningSync, syncQueue, markSyncing, dequeueScan, incrementRetry } = get();

        // Guard: prevent duplicate concurrent syncs
        if (isRunningSync) return;

        const itemsToSync = syncQueue.filter(
          (item) => !item.isSyncing && item.retryCount < 3
        );

        if (itemsToSync.length === 0) return;

        set({
          isRunningSync: true,
          syncProgress: 0,
          syncTotal: itemsToSync.length,
          syncError: null,
        });

        // Lazy imports to avoid circular deps and keep the store bundle lightweight
        const [{ default: apiClient }, FileSystem] = await Promise.all([
          import("../api/client"),
          import("expo-file-system"),
        ]);

        let uploadedCount = 0;

        for (const item of itemsToSync) {
          try {
            markSyncing(item.localId, true);

            const formData = new FormData();
            formData.append("images", {
              uri: item.imageUri,
              name: `${item.localId}.jpg`,
              type: "image/jpeg",
            } as any);
            formData.append(
              "scans",
              JSON.stringify([{
                localId: item.localId,
                plantName: item.plantName,
                confidence: item.confidence,
                details: item.details,
                scannedAt: item.scannedAt,
              }])
            );

            const response = await apiClient.post("/api/scans/sync", formData, {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 20000,
            });

            const { synced = [], failed = [] } = response.data;

            for (const res of synced) {
              // Clean up the local file to free disk space
              try {
                await FileSystem.deleteAsync(item.imageUri, { idempotent: true });
              } catch (err) {
                console.warn("[useSyncStore] Failed to delete local file:", err);
              }
              dequeueScan(res.localId);
            }

            failed.forEach((res: any) => {
              console.warn("[useSyncStore] Backend rejected scan:", res);
              incrementRetry(res.localId);
            });

            uploadedCount++;
            set({ syncProgress: uploadedCount });
          } catch (err: any) {
            console.error("[useSyncStore] Failed to upload scan:", item.localId, err?.message);
            incrementRetry(item.localId);

            // If it's a timeout or network-level error, abort the whole run
            if (err?.code === "ECONNABORTED" || err?.message === "Network Error") {
              set({
                isRunningSync: false,
                syncError: "Sync interrupted. We'll try again next time you're online.",
              });
              return;
            }
            // Otherwise, log and continue to the next item
          }
        }

        set({ isRunningSync: false });
      },
    }),
    {
      name: "hanapmedisina-sync-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the queue — runtime sync state is always re-derived
      partialize: (state) => ({ syncQueue: state.syncQueue }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateNetworkStoreFlag(state.syncQueue.length);
        }
      },
    }
  )
);
