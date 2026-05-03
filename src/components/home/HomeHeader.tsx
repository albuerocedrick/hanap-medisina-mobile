/**
 * src/components/home/HomeHeader.tsx
 *
 * Home Tab header row — extracted from app/(tabs)/index.tsx (lines 214–268).
 *
 * Left side : User avatar → taps to profile, time-of-day greeting, display name.
 * Right side : Network status pill → shows online/offline + pending sync count.
 *
 * Data sources (reads directly from stores, no props needed):
 *   useAuthStore  → user.displayName, user.photoURL, user.email
 *   useNetworkStore → isOnline
 *   useSyncStore  → syncQueue.length, isRunningSync
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { selectIsOnline, useNetworkStore } from "../../store/useNetworkStore";
import { useSyncStore } from "../../store/useSyncStore";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return "Good morning,";
  if (hour >= 12 && hour < 17) return "Good afternoon,";
  if (hour >= 17 && hour < 24) return "Good evening,";
  return "Hello,";
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function HomeHeader() {
  const router = useRouter();

  // ── Store subscriptions ──────────────────────────────────────────────────
  const { user } = useAuthStore();
  const isOnline = useNetworkStore(selectIsOnline);
  const pendingSyncCount = useSyncStore((s) => s.syncQueue.length);
  const isRunningSync = useSyncStore((s) => s.isRunningSync);

  // ── Derived values ───────────────────────────────────────────────────────
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = useMemo(
    () => user?.displayName || user?.email?.split("@")[0] || "Herbalist",
    [user],
  );
  const photoURL = user?.photoURL ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStatusPress = () => {
    const online = isOnline ? "Online" : "Offline";
    const syncStatus = isRunningSync ? "Running" : "Idle";
    Alert.alert(
      `Network Status: ${online}`,
      `Sync: ${syncStatus}\nPending uploads: ${pendingSyncCount}`,
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View className="px-6 py-5">
      <View className="flex-row justify-between items-center mb-6">

        {/* ── Left: Avatar + Greeting ── */}
        <TouchableOpacity
          className="flex-row items-center gap-3 flex-1 mr-3"
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.7}
        >
          <View className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm">
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-[#dce7df] items-center justify-center">
                <Feather name="user" size={24} color="#4a7553" />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
              {greeting}
            </Text>
            <Text
              className="text-[#243b27] font-semibold text-2xl leading-tight"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Right: Network / Sync Status ── */}
        <TouchableOpacity
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
          activeOpacity={0.75}
          onPress={handleStatusPress}
          accessibilityLabel={`Network status: ${isOnline ? "Online" : "Offline"}`}
          accessibilityRole="button"
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

          {/* Pending sync indicator dot */}
          {pendingSyncCount > 0 && (
            <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#d66a43] rounded-full border border-white" />
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}
