/**
 * app/(tabs)/history/index.tsx
 * Unified Scan History — HanapMedisina (Modern Theme Edition)
 */

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getPaginatedUserScans,
  getTotalScansCount,
  parseDateToMs,
  ScanHistoryItem,
} from "@/src/services/firebaseHistory";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useNetworkStore } from "@/src/store/useNetworkStore"; 
import { useSyncStore } from "@/src/store/useSyncStore";

// 🌟 IMPORT PAGE TRANSITION
import { PageTransition } from "@/src/components/ui/PageTransition";

import { HistoryCard } from "@/src/components/history/history-card";
import { HistoryEmptyState } from "@/src/components/history/history-empty-state";
import {
  HistoryHeader,
  SortFilter,
  StatusFilter,
} from "@/src/components/history/history-header";
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";

const PAGE_SIZE = 10;

export default function HistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incomingScanId = params?.scanId as string | undefined;
  const incomingOpenAt = params?.openAt as string | undefined;
  const { user } = useAuthStore();
  const { syncQueue } = useSyncStore();
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const isOnline = useNetworkStore((state: any) => state.isOnline);
  const isOffline = !isOnline;

  const [cloudItems, setCloudItems] = useState<ScanHistoryItem[]>([]);
  const [cloudTotalCount, setCloudTotalCount] = useState<number>(0);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortFilter, setSortFilter] = useState<SortFilter>("newest");

  const fetchInitialScans = useCallback(
    async (isRefresh = false) => {
      if (!user?.uid) {
        setCloudItems([]);
        setCloudTotalCount(0);
        setLoadingInitial(false);
        return;
      }

      if (isOffline) {
        setLoadingInitial(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoadingInitial(true);

      setError(null);
      try {
        const order = sortFilter === "newest" ? "desc" : "asc";

        const [result, totalCountFromDb] = await Promise.all([
          getPaginatedUserScans(user.uid, order, null, PAGE_SIZE),
          getTotalScansCount(user.uid),
        ]);

        setCloudItems(result.items);
        setCloudTotalCount(totalCountFromDb);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (err: any) {
        console.error("[HistoryScreen] Initial fetch error:", err);
        setError(err.message || "Could not load cloud history.");
      } finally {
        setLoadingInitial(false);
        setRefreshing(false);
      }
    },
    [user?.uid, sortFilter, isOffline],
  );

  const fetchNextPage = useCallback(async () => {
    if (!user?.uid || !hasMore || isFetchingMore || loadingInitial || isOffline)
      return;

    setIsFetchingMore(true);
    try {
      const order = sortFilter === "newest" ? "desc" : "asc";
      const result = await getPaginatedUserScans(
        user.uid,
        order,
        lastDoc,
        PAGE_SIZE,
      );

      setCloudItems((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("[HistoryScreen] Pagination error:", err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    user?.uid,
    hasMore,
    isFetchingMore,
    loadingInitial,
    lastDoc,
    sortFilter,
    isOffline,
  ]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchInitialScans();
    });
    return () => task.cancel();
  }, [fetchInitialScans]);

  useEffect(() => {
    if (incomingScanId) {
      setSelectedScanId(incomingScanId);
    }
  }, [incomingScanId, incomingOpenAt]);

  const mergedData = useMemo(() => {
    const localItems: ScanHistoryItem[] = (syncQueue ?? []).map(
      (scan: any) => ({
        id: scan.localId,
        plantName: scan.plantName ?? "Unknown Plant",
        confidence: scan.confidence ?? 0,
        imageUri: scan.imageUri ?? "",
        createdAt: parseDateToMs(scan.scannedAt) || Date.now(),
        status: "pending",
      }),
    );

    const cloudIds = new Set(cloudItems.map((c) => c.id));
    const dedupedLocal = localItems.filter((l) => !cloudIds.has(l.id));
    const combined = [...dedupedLocal, ...cloudItems];

    return combined.sort((a, b) => {
      return sortFilter === "newest"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt;
    });
  }, [cloudItems, syncQueue, sortFilter]);

  const displayData = useMemo(() => {
    if (isOffline) {
      return mergedData.filter((item) => item.status === "pending");
    }
    return mergedData.filter((item) =>
      statusFilter === "all" ? true : item.status === statusFilter,
    );
  }, [mergedData, statusFilter, isOffline]);

  const pendingCount = mergedData.filter(
    (item) => item.status === "pending",
  ).length;

  const totalCount = isOffline ? pendingCount : cloudTotalCount + pendingCount;

  const handleCardPress = useCallback((item: ScanHistoryItem) => {
    setSelectedScanId(item.id);
  }, []);

  const pillHeight = 78;
  const bottomPadding = Math.max(insets.bottom, 24) + pillHeight + 100;

  return (
    <PageTransition className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]" style={{ paddingTop: insets.top }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <View className="bg-[#FAFEEF] dark:bg-[#0B120B] z-10">
        <HistoryHeader
          totalCount={totalCount}
          pendingCount={pendingCount}
          statusFilter={isOffline ? "pending" : statusFilter}
          sortFilter={sortFilter}
          onStatusChange={setStatusFilter}
          onSortChange={() =>
            setSortFilter((prev) => (prev === "newest" ? "oldest" : "newest"))
          }
          isOffline={isOffline}
        />
      </View>

      {isOffline && (
        <View style={{
          backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "#fef2f2",
          borderColor: isDark ? "rgba(220, 38, 38, 0.3)" : "#fecaca",
          borderBottomWidth: 1,
        }} className="px-4 py-3 flex-row items-center justify-center">
          <Feather name="wifi-off" size={16} color={isDark ? "#fca5a5" : "#dc2626"} />
          <Text style={{ color: isDark ? "#fca5a5" : "#b91c1c" }} className="text-xs font-semibold ml-2">
            No internet. Only displaying local unsynced scans.
          </Text>
        </View>
      )}

      {loadingInitial ? (
        <View className="flex-1 items-center justify-center pb-20">
          <ActivityIndicator size="large" color={isDark ? "#A2CFA3" : "#16a34a"} />
          <Text style={{ color: isDark ? "#94a3b8" : "#64748b" }} className="mt-4 text-sm font-medium">
            Loading history…
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => `${item.status}-${item.id}`}
          renderItem={({ item }) => (
            <HistoryCard item={item} onPress={handleCardPress} />
          )}
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <HistoryEmptyState filter={isOffline ? "pending" : statusFilter} />
          }
          ListFooterComponent={
            <View className="w-full pb-6">
              {error && !isOffline && (
                <View style={{
                  backgroundColor: isDark ? "rgba(220, 38, 38, 0.1)" : "#fef2f2",
                  borderColor: isDark ? "rgba(220, 38, 38, 0.2)" : "#fecaca"
                }} className="mx-4 my-2 p-3 rounded-xl border flex-row gap-3 items-center">
                  <Feather name="alert-circle" size={18} color="#ef4444" />
                  <Text style={{ color: isDark ? "#fca5a5" : "#991b1b" }} className="flex-1 text-xs font-medium">
                    {error}
                  </Text>
                </View>
              )}
              {isFetchingMore && !isOffline && (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator size="small" color={isDark ? "#A2CFA3" : "#16a34a"} />
                </View>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInitialScans(true)}
              tintColor={isDark ? "#A2CFA3" : "#16a34a"}
              colors={[isDark ? "#A2CFA3" : "#16a34a"]}
              enabled={!isOffline}
            />
          }
          contentContainerStyle={[
            displayData.length === 0 && { flex: 1 },
            { paddingBottom: bottomPadding, paddingTop: 8 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ScanDetailSheet
        visible={!!selectedScanId}
        scanId={selectedScanId}
        onClose={() => {
          setSelectedScanId(null);
        }}
      />
    </PageTransition>
  );
}