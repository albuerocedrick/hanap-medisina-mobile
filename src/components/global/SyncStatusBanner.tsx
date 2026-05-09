import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSyncStore } from "../../store/useSyncStore";

/**
 * SyncStatusBanner
 *
 * A non-intrusive fixed banner mounted globally in _layout.tsx.
 * Shows background sync progress and success/error states so the
 * user can explore the app freely while their scans upload.
 *
 * States:
 *  - Uploading → "☁️ Syncing 2 of 5..."  (blue, with animated pulse)
 *  - Success   → "✅ All scans saved!"    (green, auto-dismisses after 3s)
 *  - Error     → "⚠️ Sync interrupted."  (red, dismissible by tap)
 */
export default function SyncStatusBanner() {
  const isRunningSync = useSyncStore((s) => s.isRunningSync);
  const syncProgress = useSyncStore((s) => s.syncProgress);
  const syncTotal = useSyncStore((s) => s.syncTotal);
  const syncError = useSyncStore((s) => s.syncError);
  const clearSyncError = useSyncStore((s) => s.clearSyncError);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  // "showSuccess" is a local transient state — we detect when sync just finished
  const [showSuccess, setShowSuccess] = useState(false);
  const prevIsRunning = useRef(false);

  // Slide-in/out animation value
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const isVisible = isRunningSync || showSuccess || !!syncError;

  // Detect sync completion (was running → stopped with no error → success)
  useEffect(() => {
    if (prevIsRunning.current && !isRunningSync && !syncError) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    prevIsRunning.current = isRunningSync;
  }, [isRunningSync, syncError]);

  // Slide in when visible, slide out when not
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : -100,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [isVisible]);

  if (!isVisible) return null;

  // ── Resolve display based on state priority ─────────────────────────────
  let accentColor = "#4D8035"; // syncing — green
  let bgColor = isDark ? "rgba(34,69,28,0.92)" : "rgba(250,254,239,0.95)";
  let icon = "☁️";
  let message = `Syncing ${syncProgress} of ${syncTotal}...`;

  if (syncError) {
    accentColor = "#ef4444";
    bgColor = isDark ? "rgba(60,10,10,0.92)" : "rgba(255,245,245,0.97)";
    icon = "⚠️";
    message = "Sync interrupted. Tap to dismiss.";
  } else if (showSuccess) {
    accentColor = "#22451C";
    bgColor = isDark ? "rgba(20,50,20,0.92)" : "rgba(240,252,240,0.97)";
    icon = "✅";
    message = "All scans saved to cloud!";
  }

  const textColor = isDark ? "#F8FAFC" : "#22451C";
  const subTextColor = isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 12,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={syncError ? 0.7 : 1}
        onPress={syncError ? clearSyncError : undefined}
        style={[
          styles.pill,
          {
            backgroundColor: bgColor,
            borderColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(34,69,28,0.12)",
          },
        ]}
      >
        {/* Left: icon */}
        <Text style={styles.icon}>{icon}</Text>

        {/* Center: message */}
        <Text
          style={[styles.message, { color: textColor }]}
          numberOfLines={1}
        >
          {message}
        </Text>

        {/* Right: progress count */}
        {isRunningSync && (
          <Text style={[styles.progress, { color: subTextColor }]}>
            {syncProgress}/{syncTotal}
          </Text>
        )}
      </TouchableOpacity>

      {/* Thin accent progress bar at the bottom of the pill */}
      {isRunningSync && syncTotal > 0 && (
        <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(34,69,28,0.08)" }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(syncProgress / syncTotal) * 100}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 999,
    alignItems: "center",
  },
  pill: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 13,
  },
  progress: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 12,
  },
  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
});
