/**
 * app/(tabs)/profile.tsx
 * User Profile Screen — HanapMedisina Phase 5.3
 */

import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTotalScansCount } from "@/src/services/firebaseHistory";
import apiClient from "@/src/api/client";
import { auth } from "@/src/services/firebase";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useSyncStore } from "@/src/store/useSyncStore";
import { ProfileAvatar } from "@/src/components/profile/profile-avatar";
import { ProfileMenuItem } from "@/src/components/profile/profile-menu-item";
import { ProfileStats } from "@/src/components/profile/profile-stats";

// ── Helper: format Firebase Auth metadata creationTime ───────────────────────
function formatMemberSince(creationTime: string | undefined): string {
  if (!creationTime) return "Unknown";
  const date = new Date(creationTime);
  return date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, logout } = useAuthStore();
  const pendingCount = useSyncStore((s) => s.syncQueue.length);

  // ── State ──────────────────────────────────────────────────────────────────
  const [totalScans, setTotalScans] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Herbalist";
  const photoURL: string | null = user?.photoURL ?? null;
  // Firebase's creationTime is on the metadata object
  const memberSince = formatMemberSince(user?.metadata?.creationTime);

  // Real total includes the true cloud count + any offline items pending sync
  const displayTotalScans = totalScans + pendingCount;

  // ── Fetch Stats ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    async function load() {
      try {
        const count = await getTotalScansCount(user!.uid);
        if (!cancelled) setTotalScans(count);
      } catch (e) {
        console.error("[ProfileScreen] Failed to fetch scan count:", e);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // ── Avatar Upload ──────────────────────────────────────────────────────────
  const handlePickImage = useCallback(async () => {
    // 1. Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to update your avatar.");
      return;
    }

    // 2. Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];

    // 3. Build FormData — use the filename/type from asset metadata
    const formData = new FormData();
    formData.append("avatar", {
      uri: asset.uri,
      name: asset.fileName ?? `avatar_${Date.now()}.jpg`,
      type: asset.mimeType ?? "image/jpeg",
    } as any);

    // 4. Upload via authenticated Axios client (interceptor attaches Bearer token)
    setUploading(true);
    try {
      const response = await apiClient.post("/api/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      // 5. Reload Firebase Auth user to get the new photoURL
      await auth.currentUser?.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser) setUser(refreshedUser);

      Alert.alert("Success", "Your profile photo has been updated!");
    } catch (err: any) {
      console.error("[ProfileScreen] Avatar upload failed:", err?.response?.data ?? err?.message);
      Alert.alert("Upload Failed", "Could not update your avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [setUser]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (e) {
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  }, [logout]);

  return (
    <View className="flex-1 bg-[#f8fafc]" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" translucent />

      {/* ── Header ── */}
      <View className="px-6 py-5">
        <Text className="text-3xl font-extrabold text-slate-800 tracking-tight">Profile</Text>
        <Text className="text-slate-400 text-sm mt-0.5">Your account & preferences</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}>

        {/* ── Avatar ── */}
        <View className="items-center mb-4">
          <ProfileAvatar
            photoURL={photoURL}
            displayName={displayName}
            uploading={uploading}
            onEditPress={handlePickImage}
          />
          <Text className="text-xl font-bold text-slate-800">{displayName}</Text>
          {user?.email && (
            <Text className="text-sm text-slate-400 mt-0.5">{user.email}</Text>
          )}
        </View>

        {/* ── Stats ── */}
        <ProfileStats
          totalScans={displayTotalScans}
          memberSince={memberSince}
          loading={statsLoading}
        />

        {/* ── Account Section ── */}
        <View className="mx-6 mb-4">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Account</Text>
          <View className="rounded-2xl overflow-hidden border border-slate-100 bg-white">
            <ProfileMenuItem
              icon="edit-2"
              label="Edit Profile"
              onPress={() => Alert.alert("Coming Soon", "Profile editing will be available in a future update.")}
            />
            <ProfileMenuItem
              icon="bell"
              label="Notifications"
              onPress={() => Alert.alert("Coming Soon", "Notification settings will be available in a future update.")}
            />
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <View className="mx-6">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Session</Text>
          <View className="rounded-2xl overflow-hidden border border-red-100 bg-white">
            <ProfileMenuItem
              icon="log-out"
              label="Log Out"
              onPress={handleLogout}
              destructive
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
