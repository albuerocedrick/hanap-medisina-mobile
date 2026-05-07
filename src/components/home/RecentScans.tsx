import { Feather } from "@expo/vector-icons";
import { router } from "expo-router"; 
import { useColorScheme } from "nativewind"; // 🌟 Added
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { ActivityIndicator, Image, InteractionManager, Text, TouchableOpacity, View } from "react-native";
import { getPaginatedUserScans, parseDateToMs, ScanHistoryItem } from "../../services/firebaseHistory";
import { useAuthStore } from "../../store/useAuthStore";
import { useSyncStore } from "../../store/useSyncStore";

const RECENT_SCANS_LIMIT = 2;

export interface RecentScansHandle { refresh: () => Promise<void>; }

export const RecentScans = forwardRef<RecentScansHandle>(function RecentScans(_, ref) {
  const { user } = useAuthStore();
  const syncQueue = useSyncStore((s) => s.syncQueue);
  const [cloudScans, setCloudScans] = useState<ScanHistoryItem[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);

  const { colorScheme } = useColorScheme(); // 🌟 Added
  const isDark = colorScheme === "dark";

  const fetchRecentScans = useCallback(async () => {
    if (!user?.uid) {
      setCloudScans([]);
      setLoadingScans(false);
      return;
    }
    setLoadingScans(true);
    try {
      const result = await getPaginatedUserScans(user.uid, "desc", null, RECENT_SCANS_LIMIT);
      setCloudScans(result.items);
    } catch (err: any) {
      console.error("[RecentScans] Failed to fetch recent scans:", err);
      setCloudScans([]);
    } finally {
      setLoadingScans(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => fetchRecentScans());
    return () => task.cancel();
  }, [fetchRecentScans]);

  useImperativeHandle(ref, () => ({ refresh: fetchRecentScans }));

  const mergedRecentScans = useMemo(() => {
    const localItems: ScanHistoryItem[] = (syncQueue ??[]).map((scan: any) => ({
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

    return combined.sort((a, b) => b.createdAt - a.createdAt).slice(0, RECENT_SCANS_LIMIT);
  }, [cloudScans, syncQueue]);

  const handleScanPress = useCallback((scan: ScanHistoryItem) => {
    router.push({
      pathname: "/(tabs)/history",
      params: { scanId: scan.id, openAt: String(Date.now()) },
    });
  },[]);

  return (
    <View className="px-6 mb-8">
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className="text-[#22451C] dark:text-[#EAF3D5]"
          style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
        >
          Recent Scans
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/history")} activeOpacity={0.7}>
          <Text
            className="text-[#4D8035] dark:text-[#A2CFA3]"
            style={{ fontSize: 15, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.2 }}
          >
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {loadingScans ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" color={isDark ? "rgba(226,232,240,0.7)" : "#4D8035"} />
        </View>
      ) : mergedRecentScans.length === 0 ? (
        <View className="bg-[#FAFEEF] dark:bg-white/5 rounded-[24px] px-5 py-8 items-center border border-[#A2CFA3]/30 dark:border-white/10">
          <View className="w-12 h-12 rounded-full bg-[#EAF3D5] dark:bg-white/10 items-center justify-center mb-3">
            <Feather name="camera" size={18} color={isDark ? "rgba(248,250,252,0.75)" : "#4D8035"} />
          </View>
          <Text className="text-[#22451C] dark:text-[#EAF3D5] text-[14px] font-medium">
            No scans yet
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {mergedRecentScans.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              className="bg-[#FAFEEF] dark:bg-[#162916] rounded-[24px] p-4 flex-row gap-4 items-center border border-[#A2CFA3]/30 dark:border-white/10"
              style={{ 
                shadowColor: isDark ? "#000" : "#22451C", 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: isDark ? 0.22 : 0.04, 
                shadowRadius: 6, 
                elevation: 1 
              }}
              onPress={() => handleScanPress(scan)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: scan.imageUri || "https://via.placeholder.com/64" }}
                className="w-[64px] h-[64px] rounded-[20px] bg-[#EAF3D5] dark:bg-[#1a3315]"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-[#22451C] dark:text-[#EAF3D5] font-semibold text-[15px] mb-1">{scan.plantName}</Text>
                <Text className="text-[#70A656] dark:text-white/55 text-[12px] font-medium">
                  {new Date(scan.createdAt).toLocaleDateString()} · {Math.round(scan.confidence * 100)}% match
                </Text>
              </View>
              {scan.status === "pending" && (
                <View className="px-3 py-1.5 bg-[#EAF3D5] dark:bg-white/10 rounded-full border border-[#A2CFA3] dark:border-white/15">
                  <Text className="text-[#4D8035] dark:text-white/75 text-[10px] font-semibold tracking-[0.2px]">Syncing</Text>
                </View>
              )}
              <View className="w-10 h-10 rounded-full bg-[#EAF3D5] dark:bg-[#1a3315] items-center justify-center ml-1 border border-transparent dark:border-white/5">
                <Feather name="chevron-right" size={18} color={isDark ? "rgba(226,232,240,0.75)" : "#4D8035"} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});