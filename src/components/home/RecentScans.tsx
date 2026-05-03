/**
 * src/components/home/RecentScans.tsx
 *
 * Recent scans section extracted from app/(tabs)/index.tsx (lines 373–438).
 * Merges offline pending scans (syncQueue) with cloud scans from Firestore,
 * deduplicates them, and shows the 2 most recent.
 *
 * Behaviour:
 *  - Fetches the last 2 cloud scans from Firestore on mount (via InteractionManager).
 *  - Merges with pending local scans from useSyncStore so offline items appear instantly.
 *  - Deduplicates by ID to avoid showing the same scan twice after sync.
 *  - Shows an ActivityIndicator while loading, an empty state if no scans exist.
 *  - Tapping a scan card navigates to the History tab and opens the detail sheet.
 *  - Exposed imperative refresh via forwardRef / useImperativeHandle — the parent
 *    ScrollView's RefreshControl calls it on pull-to-refresh.
 *
 * Data sources:
 *   getPaginatedUserScans → Firestore scan history reads (online only)
 *   useSyncStore          → syncQueue (offline pending scans)
 *   useAuthStore          → user.uid (required for Firestore query)
 *   useRouter             → navigation to /(tabs)/history
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  InteractionManager,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getPaginatedUserScans,
  parseDateToMs,
  ScanHistoryItem,
} from "../../services/firebaseHistory";
import { useAuthStore } from "../../store/useAuthStore";
import { useSyncStore } from "../../store/useSyncStore";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const RECENT_SCANS_LIMIT = 2;

// ─────────────────────────────────────────────
// REF HANDLE (for pull-to-refresh from parent)
// ─────────────────────────────────────────────

export interface RecentScansHandle {
  refresh: () => Promise<void>;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export const RecentScans = forwardRef<RecentScansHandle>(function RecentScans(_, ref) {
  const router = useRouter();

  // ── Store subscriptions ──────────────────────────────────────────────────
  const { user } = useAuthStore();
  const syncQueue = useSyncStore((s) => s.syncQueue);

  // ── Local state ──────────────────────────────────────────────────────────
  const [cloudScans, setCloudScans] = useState<ScanHistoryItem[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchRecentScans = useCallback(async () => {
    if (!user?.uid) {
      setCloudScans([]);
      setLoadingScans(false);
      return;
    }

    setLoadingScans(true);
    try {
      const result = await getPaginatedUserScans(
        user.uid,
        "desc",
        null,
        RECENT_SCANS_LIMIT,
      );
      setCloudScans(result.items);
    } catch (err: any) {
      console.error("[RecentScans] Failed to fetch recent scans:", err);
      setCloudScans([]);
    } finally {
      setLoadingScans(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchRecentScans();
    });
    return () => task.cancel();
  }, [fetchRecentScans]);

  // ── Expose refresh to parent (pull-to-refresh) ────────────────────────────
  useImperativeHandle(ref, () => ({
    refresh: fetchRecentScans,
  }));

  // ── Merge offline + cloud ─────────────────────────────────────────────────
  const mergedRecentScans = useMemo(() => {
    const localItems: ScanHistoryItem[] = (syncQueue ?? []).map((scan: any) => ({
      id: scan.localId,
      plantName: scan.plantName ?? "Unknown Plant",
      confidence: scan.confidence ?? 0,
      imageUri: scan.imageUri ?? "",
      createdAt: parseDateToMs(scan.scannedAt) || Date.now(),
      status: "pending",
    }));

    const cloudIds = new Set(cloudScans.map((c) => c.id));
    const dedupedLocal = localItems.filter((l) => !cloudIds.has(l.id));
    const combined = [...dedupedLocal, ...cloudScans];

    return combined
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, RECENT_SCANS_LIMIT);
  }, [cloudScans, syncQueue]);

  // ── Handler ───────────────────────────────────────────────────────────────
  const handleScanPress = useCallback(
    (scan: ScanHistoryItem) => {
      router.push({
        pathname: "/(tabs)/history",
        params: { scanId: scan.id, openAt: String(Date.now()) },
      });
    },
    [router],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="px-6 mb-6">
      {/* Section header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-semibold text-[#243b27] tracking-tight text-sm">
          Recent Scans
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/history")}
          activeOpacity={0.7}
        >
          <Text className="text-[#4a7553] font-semibold text-[11px]">
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loadingScans ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" color="#4a7553" />
        </View>

      /* Empty state */
      ) : mergedRecentScans.length === 0 ? (
        <View className="bg-white rounded-[24px] p-4 items-center justify-center py-8">
          <Feather name="camera" size={32} color="#d1d5db" />
          <Text className="text-gray-400 text-sm font-medium mt-2">
            No scans yet
          </Text>
        </View>

      /* Scan list */
      ) : (
        <View className="gap-3">
          {mergedRecentScans.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              className="bg-white rounded-[24px] p-3 flex-row gap-4 items-center shadow-sm"
              onPress={() => handleScanPress(scan)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View scan of ${scan.plantName}`}
            >
              <Image
                source={{ uri: scan.imageUri || "https://via.placeholder.com/56" }}
                className="w-14 h-14 rounded-2xl bg-gray-100"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-[#243b27] font-semibold text-sm">
                  {scan.plantName}
                </Text>
                <Text className="text-gray-400 text-[10px] mt-0.5 font-medium">
                  {new Date(scan.createdAt).toLocaleDateString()} ·{" "}
                  {Math.round(scan.confidence * 100)}% match
                </Text>
              </View>

              {scan.status === "pending" && (
                <View className="px-2 py-1 bg-yellow-50 rounded-full">
                  <Text className="text-yellow-700 text-[10px] font-semibold">
                    Pending
                  </Text>
                </View>
              )}

              <View className="w-8 h-8 rounded-full bg-[#dce7df] items-center justify-center">
                <Feather name="chevron-right" size={14} color="#4a7553" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});
