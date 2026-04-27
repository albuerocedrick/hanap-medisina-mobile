import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
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
  let bgColor = "bg-blue-600";
  let icon = "☁️";
  let message = `Syncing ${syncProgress} of ${syncTotal}...`;

  if (syncError) {
    bgColor = "bg-red-500";
    icon = "⚠️";
    message = "Sync interrupted. Tap to dismiss.";
  } else if (showSuccess) {
    bgColor = "bg-green-600";
    icon = "✅";
    message = "All scans saved to cloud!";
  }

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }] }}
      className="absolute top-0 left-0 right-0 z-50"
    >
      <TouchableOpacity
        activeOpacity={syncError ? 0.7 : 1}
        onPress={syncError ? clearSyncError : undefined}
        className={`${bgColor} px-5 pt-12 pb-4 flex-row items-center gap-3`}
      >
        <Text className="text-lg">{icon}</Text>
        <Text className="text-white font-semibold flex-1 text-sm">
          {message}
        </Text>
        {isRunningSync && (
          <Text className="text-white/70 text-xs">
            {syncProgress}/{syncTotal}
          </Text>
        )}
      </TouchableOpacity>

      {/* Thin progress bar at the bottom of the banner */}
      {isRunningSync && syncTotal > 0 && (
        <View className="h-1 bg-blue-800">
          <View
            className="h-1 bg-white"
            style={{ width: `${(syncProgress / syncTotal) * 100}%` }}
          />
        </View>
      )}
    </Animated.View>
  );
}
