// hanap-medicina-mobile/app/(tabs)/index.tsx
import {
  getPaginatedUserScans,
  parseDateToMs,
  ScanHistoryItem,
} from "@/src/services/firebaseHistory";
import { searchPlantsLocally } from "@/src/services/firebaseLibrary";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useLibraryStore } from "@/src/store/useLibraryStore";
import { useNetworkStore } from "@/src/store/useNetworkStore";
import { useSyncStore } from "@/src/store/useSyncStore";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RECENT_SCANS_LIMIT = 2;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { syncQueue } = useSyncStore();
  const isOnline = useNetworkStore((s: any) => s.isOnline);
  // Search state (must be declared before any useMemo that references it)
  const [searchQuery, setSearchQuery] = useState("");
  const librarySetSearchQuery = useLibraryStore((s) => s.setSearchQuery);
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Debounce committing to the global library store to avoid thrashing
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        librarySetSearchQuery(text);
      } catch (e) {
        console.error("[HomeScreen] Failed to commit library search query:", e);
      }
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Library data for search suggestions
  const plants = useLibraryStore((s) => s.plants);
  const favorites = useLibraryStore((s) => s.favorites);

  const sourceList = isOnline
    ? plants
    : (favorites || []).map((f) => ({
        id: f.id,
        name: f.name,
        scientificName: f.scientificName,
        imageUrl: f.imageUrl,
        categories: f.categories,
      }));

  const suggestions = React.useMemo(() => {
    const q = (searchQuery || "").trim();
    if (!q) return [];
    try {
      return searchPlantsLocally(sourceList, q).slice(0, 6);
    } catch (e) {
      return [];
    }
  }, [searchQuery, sourceList]);
  const [cloudScans, setCloudScans] = useState<ScanHistoryItem[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) return "Good morning,";
    if (hour >= 12 && hour < 17) return "Good afternoon,";
    if (hour >= 17 && hour < 24) return "Good evening,";
    return "Hello,";
  }, []);

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Herbalist";
  const photoURL = user?.photoURL || null;
  const pendingSyncCount = useSyncStore((s) => s.syncQueue.length);
  const isRunningSync = useSyncStore((s) => s.isRunningSync);

  // ── Fetch recent scans from database ────────────────────────────────────────
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
      console.error("[HomeScreen] Failed to fetch recent scans:", err);
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

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchRecentScans();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRecentScans]);

  // ── Merge offline + cloud scans ─────────────────────────────────────────────
  const mergedRecentScans = useMemo(() => {
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

    const cloudIds = new Set(cloudScans.map((c) => c.id));
    const dedupedLocal = localItems.filter((l) => !cloudIds.has(l.id));
    const combined = [...dedupedLocal, ...cloudScans];

    // Return only the most recent scans
    return combined
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, RECENT_SCANS_LIMIT);
  }, [cloudScans, syncQueue]);

  // ── Handle scan card press ──────────────────────────────────────────────────
  const handleScanPress = useCallback(
    (scan: ScanHistoryItem) => {
      // Navigate to history tab with scanId + openAt nonce so repeated pushes open modal
      router.push({
        pathname: "/(tabs)/history",
        params: { scanId: scan.id, openAt: String(Date.now()) },
      });
    },
    [router],
  );

  const handleRemedyGuide = useCallback(() => {
    Alert.alert("Remedy Guide", "Coming soon!");
  }, []);

  const handleFeaturedPlant = useCallback(() => {
    Alert.alert("Featured Plant", "Learn more about Tsaang Gubat!");
  }, []);

  return (
    <View className="flex-1 bg-[#f5f6f2]" style={{ paddingTop: insets.top }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f5f6f2"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4a7553"
            colors={["#4a7553"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 24) + 100,
        }}
      >
        {/* ── Header ── */}
        <View className="px-6 py-5">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              className="flex-row items-center gap-3"
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm">
                {photoURL ? (
                  <Image source={{ uri: photoURL }} className="w-full h-full" />
                ) : (
                  <View className="w-full h-full bg-[#dce7df] items-center justify-center">
                    <Feather name="user" size={24} color="#4a7553" />
                  </View>
                )}
              </View>
              <View>
                <Text className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                  {greeting}
                </Text>
                <Text className="text-[#243b27] font-semibold text-2xl leading-tight">
                  {displayName.substring(0, 10)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
              activeOpacity={0.75}
              onPress={() => {
                const online = isOnline ? "Online" : "Offline";
                const syncStatus = isRunningSync ? "Running" : "Idle";
                Alert.alert(
                  `Network Status: ${online}`,
                  `Sync: ${syncStatus}\nPending uploads: ${pendingSyncCount}`,
                );
              }}
            >
              <View className="items-center">
                <Feather
                  name={isOnline ? "cloud" : "cloud-off"}
                  size={18}
                  color={isOnline ? "#10b981" : "#ef4444"}
                />
                <Text
                  className="text-[10px] mt-0.5"
                  style={{ color: isOnline ? "#10b981" : "#ef4444" }}
                >
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </View>
              {pendingSyncCount > 0 && (
                <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#d66a43] rounded-full border border-white" />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Search Bar ── */}
          <View className="relative">
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search herbal plants..."
              className="w-full bg-white rounded-full py-4 pl-6 pr-12 text-[13px] text-gray-700 placeholder-gray-400 font-medium shadow-sm"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#dce7df] rounded-full flex items-center justify-center"
              activeOpacity={0.7}
            >
              <Feather name="search" size={16} color="#4a7553" />
            </TouchableOpacity>
            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <View className="absolute left-0 right-0 mt-16 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden z-50">
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    className="px-4 py-3 border-b border-gray-100"
                    activeOpacity={0.75}
                    onPress={() => {
                      // Navigate to plant details
                      router.push(`/(tabs)/library/${s.id}`);
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-gray-800 font-medium">
                          {s.name}
                        </Text>
                        {s.scientificName ? (
                          <Text className="text-gray-400 text-xs">
                            {s.scientificName}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View className="px-6 space-y-6">
          {/* ── Remedy Finder Card ── */}
          <TouchableOpacity
            className="bg-white rounded-[24px] p-5 shadow-sm flex-row items-center gap-4 border border-gray-100"
            onPress={handleRemedyGuide}
            activeOpacity={0.7}
          >
            <View className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <Feather name="heart" size={28} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 text-base tracking-tight">
                Remedy Guide
              </Text>
              <Text className="text-[10px] text-gray-500 font-medium leading-tight mt-1">
                Filter by symptom to find herbs, safe preparations.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#d1d5db" />
          </TouchableOpacity>

          {/* ── Featured Discovery ── */}
          <View>
            <View className="flex-row justify-between items-end mb-3">
              <Text className="font-semibold text-gray-800 tracking-tight text-sm">
                Featured Discovery
              </Text>
            </View>
            <TouchableOpacity
              className="w-full h-56 rounded-[32px] overflow-hidden shadow-sm"
              onPress={handleFeaturedPlant}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                }}
                className="w-full h-full"
              />
              <View className="absolute inset-0 bg-gradient-to-t from-[#243b27]/90 via-[#243b27]/30 to-transparent p-6 flex flex-col justify-end">
                <Text className="text-white font-semibold text-2xl leading-tight">
                  Tsaang Gubat
                </Text>
                <Text className="text-white/80 text-[11px] mb-4 font-medium mt-1 w-5/6">
                  Soothes abdominal pain naturally.
                </Text>
                <View className="bg-white/20 border border-white/30 rounded-full py-2 px-5 w-max flex-row items-center">
                  <Text className="text-white text-[10px] font-semibold">
                    Read Guide
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Recent Scans ── */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold text-gray-800 tracking-tight text-sm">
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

            {loadingScans ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator size="small" color="#4a7553" />
              </View>
            ) : mergedRecentScans.length === 0 ? (
              <View className="bg-white rounded-[24px] p-4 items-center justify-center py-8">
                <Feather name="camera" size={32} color="#d1d5db" />
                <Text className="text-gray-400 text-sm font-medium mt-2">
                  No scans yet
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {mergedRecentScans.map((scan) => (
                  <TouchableOpacity
                    key={scan.id}
                    className="bg-white rounded-[24px] p-3 flex-row gap-4 items-center shadow-sm"
                    onPress={() => handleScanPress(scan)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri: scan.imageUri || "https://via.placeholder.com/56",
                      }}
                      className="w-14 h-14 rounded-2xl bg-gray-100"
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
                    <View className="w-8 h-8 rounded-full bg-[#dce7df] flex items-center justify-center">
                      <Feather name="chevron-right" size={14} color="#4a7553" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
