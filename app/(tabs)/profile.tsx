/**
 * app/(tabs)/profile.tsx
 * User Profile Screen — HanapMedisina (Modern Theme Edition)
 */

import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🌟 IMPORT PAGE TRANSITION
import { PageTransition } from "@/src/components/ui/PageTransition";

import apiClient from "@/src/api/client";
import { ProfileAvatar } from "@/src/components/profile/profile-avatar";
import { ProfileMenuItem } from "@/src/components/profile/profile-menu-item";
import { ProfileStats } from "@/src/components/profile/profile-stats";
import { auth } from "@/src/services/firebase";
import { getTotalScansCount } from "@/src/services/firebaseHistory";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useSyncStore } from "@/src/store/useSyncStore";

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

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [totalScans, setTotalScans] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Herbalist";
  const photoURL: string | null = user?.photoURL ?? null;
  const memberSince = formatMemberSince(user?.metadata?.creationTime);

  const displayTotalScans = totalScans + pendingCount;

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

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to update your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];

    const formData = new FormData();
    formData.append("avatar", {
      uri: asset.uri,
      name: asset.fileName ?? `avatar_${Date.now()}.jpg`,
      type: asset.mimeType ?? "image/jpeg",
    } as any);

    setUploading(true);
    try {
      const response = await apiClient.post("/api/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

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
    <PageTransition className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]" style={{ paddingTop: insets.top }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <View className="px-6 py-5">
        <Text
          style={{
            fontSize: 28,
            fontFamily: "serif",
            fontStyle: "italic",
            fontWeight: "500",
            letterSpacing: 0.3,
            color: isDark ? "#F8FAFC" : "#22451C",
          }}
        >
          Profile
        </Text>
        <Text
          style={{
            color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)",
            fontFamily: "Quicksand_500Medium"
          }}
          className="text-sm mt-1"
        >
          Your account & preferences
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}>

        <View className="items-center mb-4">
          <ProfileAvatar
            photoURL={photoURL}
            displayName={displayName}
            uploading={uploading}
            onEditPress={handlePickImage}
          />
          <Text
            style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_700Bold" }}
            className="text-xl"
          >
            {displayName}
          </Text>
          {user?.email && (
            <Text
              style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_600SemiBold" }}
              className="text-sm mt-0.5"
            >
              {user.email}
            </Text>
          )}
        </View>

        <ProfileStats
          totalScans={displayTotalScans}
          memberSince={memberSince}
          loading={statsLoading}
        />

        <View className="mx-6 mb-6 mt-4">
          <Text
            style={{ color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)", fontFamily: "Quicksand_700Bold" }}
            className="text-xs uppercase tracking-wider mb-3 ml-2"
          >
            Account
          </Text>

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

        <View className="mx-6 mt-2">
          <Text
            style={{ color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)", fontFamily: "Quicksand_700Bold" }}
            className="text-xs uppercase tracking-wider mb-3 ml-2"
          >
            Session
          </Text>

          <ProfileMenuItem
            icon="log-out"
            label="Log Out"
            onPress={handleLogout}
            destructive
          />
        </View>

      </ScrollView>
    </PageTransition>
  );
}