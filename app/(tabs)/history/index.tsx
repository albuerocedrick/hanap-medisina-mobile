/**
 * app/(tabs)/history/index.tsx
 * Unified Scan History — HanapMedisina (Light Mode Edition)
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  RefreshControl,
  StatusBar,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getPaginatedUserScans,
  getTotalScansCount // <-- ADDED: Import the total count function
  ,
  parseDateToMs,
  ScanHistoryItem
} from "@/src/services/firebaseHistory";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useSyncStore } from "@/src/store/useSyncStore";

import { HistoryCard } from "@/src/components/history/history-card";
import { HistoryEmptyState } from "@/src/components/history/history-empty-state";
import { HistoryHeader, SortFilter, StatusFilter } from "@/src/components/history/history-header";
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";

const PAGE_SIZE = 10;

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { syncQueue } = useSyncStore();
  const insets = useSafeAreaInsets(); 

  // Data State
  const [cloudItems, setCloudItems] = useState<ScanHistoryItem[]>([]);
  const [cloudTotalCount, setCloudTotalCount] = useState<number>(0); // <-- ADDED: State to track overall cloud total
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  // Pagination State
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Loading & Error State
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortFilter, setSortFilter] = useState<SortFilter>("newest");

  // ── Fetch Initial Page ────────────────────────────────────────────────────────
  const fetchInitialScans = useCallback(async (isRefresh = false) => {
    if (!user?.uid) {
      setCloudItems([]);
      setCloudTotalCount(0);
      setLoadingInitial(false);
      return;
    }
    
    if (isRefresh) setRefreshing(true);
    else setLoadingInitial(true);
    
    setError(null);
    try {
      const order = sortFilter === "newest" ? "desc" : "asc";
      
      // <-- ADDED: Fetch both the first page of items AND the overall total count simultaneously
      const [result, totalCountFromDb] = await Promise.all([
        getPaginatedUserScans(user.uid, order, null, PAGE_SIZE),
        getTotalScansCount(user.uid)
      ]);
      
      setCloudItems(result.items);
      setCloudTotalCount(totalCountFromDb); // <-- ADDED: Save the overall cloud count
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: any) {
      console.error("[HistoryScreen] Initial fetch error:", err);
      setError(err.message || "Could not load cloud history.");
    } finally {
      setLoadingInitial(false);
      setRefreshing(false);
    }
  }, [user?.uid, sortFilter]);

  // ── Fetch Next Page (Infinite Scroll) ───────────────────────────────────────
  const fetchNextPage = useCallback(async () => {
    if (!user?.uid || !hasMore || isFetchingMore || loadingInitial) return;

    setIsFetchingMore(true);
    try {
      const order = sortFilter === "newest" ? "desc" : "asc";
      const result = await getPaginatedUserScans(user.uid, order, lastDoc, PAGE_SIZE);
      
      setCloudItems(prev => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("[HistoryScreen] Pagination error:", err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [user?.uid, hasMore, isFetchingMore, loadingInitial, lastDoc, sortFilter]);

  // Ensures tab animation finishes before fetching
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchInitialScans();
    });
    return () => task.cancel();
  }, [fetchInitialScans]);

  // ── Build & Merge Data ──────────────────────────────────────────────────────
  const mergedData = useMemo(() => {
    const localItems: ScanHistoryItem[] = (syncQueue ?? []).map((scan: any) => ({
      id: scan.localId, 
      plantName: scan.plantName ?? "Unknown Plant",
      confidence: scan.confidence ?? 0,
      imageUri: scan.imageUri ?? "", 
      createdAt: parseDateToMs(scan.scannedAt) || Date.now(), 
      status: "pending",
    }));

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
    return mergedData.filter(item => statusFilter === "all" ? true : item.status === statusFilter);
  }, [mergedData, statusFilter]);

  const pendingCount = mergedData.filter(item => item.status === "pending").length;
  
  // <-- UPDATED: Total count is now the true cloud total + any items waiting to sync
  const totalCount = cloudTotalCount + pendingCount;

  // ── Card Press Handler ──────────────────────────────────────────────────────
  const handleCardPress = useCallback((item: ScanHistoryItem) => {
    setSelectedScanId(item.id); // Triggers the modal to open
  }, []);

  // ── Layout Calculations ─────────────────────────────────────────────────────
  const pillHeight = 78;
  const bottomPadding = Math.max(insets.bottom, 24) + pillHeight + 20;

  return (
    <View className="flex-1 bg-[#f8fafc]" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" translucent />

      <View className="bg-[#f8fafc] z-10">
        <HistoryHeader
          totalCount={totalCount}
          pendingCount={pendingCount}
          statusFilter={statusFilter}
          sortFilter={sortFilter}
          onStatusChange={setStatusFilter}
          onSortChange={() => setSortFilter(prev => prev === "newest" ? "oldest" : "newest")}
        />
      </View>

      {loadingInitial ? (
        <View className="flex-1 items-center justify-center pb-20">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="mt-4 text-sm font-medium text-slate-500">Loading history…</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => `${item.status}-${item.id}`}
          renderItem={({ item }) => <HistoryCard item={item} onPress={handleCardPress} />}
          
          onEndReached={fetchNextPage}
          onEndReachedThreshold={0.5}
          
          ListEmptyComponent={<HistoryEmptyState filter={statusFilter} />}
          
          ListFooterComponent={
            <View className="w-full pb-6">
              {error && (
                <View className="mx-4 my-2 p-3 bg-red-50 rounded-xl border border-red-200 flex-row gap-3 items-center">
                  <Feather name="alert-circle" size={18} color="#ef4444" />
                  <Text className="flex-1 text-xs font-medium text-red-800">{error}</Text>
                </View>
              )}
              {isFetchingMore && (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator size="small" color="#16a34a" />
                </View>
              )}
            </View>
          }
          
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInitialScans(true)}
              tintColor="#16a34a"
              colors={["#16a34a"]}
            />
          }
          
          contentContainerStyle={[
            displayData.length === 0 && { flex: 1 }, 
            { paddingBottom: bottomPadding, paddingTop: 8 }
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ScanDetailSheet 
        visible={!!selectedScanId}
        scanId={selectedScanId}
        onClose={() => setSelectedScanId(null)}
      />
    </View>
  );
}