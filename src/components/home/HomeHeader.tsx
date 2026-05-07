import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { selectIsOnline, useNetworkStore } from "../../store/useNetworkStore";
import { useSyncStore } from "../../store/useSyncStore";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Reusable spring icon button ──────────────────────────────────────────────
function IconButton({
  onPress,
  children,
  isDark,
  backgroundColor,
  borderColor,
}: {
  onPress: () => void;
  children: React.ReactNode;
  isDark: boolean;
  backgroundColor?: string;
  borderColor?: string;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedTouchable
      style={[
        animStyle,
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: backgroundColor ?? (isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF"),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: borderColor ?? (isDark ? "rgba(255,255,255,0.14)" : "#A2CFA3"),
        },
      ]}
      onPressIn={() => {
        scale.value = withSpring(0.86, { damping: 14, stiffness: 320 });
        opacity.value = withTiming(0.75, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 320 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
      activeOpacity={1}
    >
      {children}
    </AnimatedTouchable>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
export function HomeHeader() {
  const isOnline = useNetworkStore(selectIsOnline);
  const pendingSyncCount = useSyncStore((s) => s.syncQueue.length);
  const isRunningSync = useSyncStore((s) => s.isRunningSync);

  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const themeAnim = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    themeAnim.value = withTiming(isDark ? 1 : 0, { duration: 300 });
  }, [isDark, themeAnim]);

  const handleStatusPress = () => {
    const online = isOnline ? "Online" : "Offline";
    const syncStatus = isRunningSync ? "Syncing…" : "Up to date";
    Alert.alert(
      `Network: ${online}`,
      `${syncStatus}\nPending uploads: ${pendingSyncCount}`,
    );
  };

  const themeIconWrapStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${themeAnim.value * 180}deg` },
      { scale: 0.95 + themeAnim.value * 0.1 },
    ],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={{
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* ── Left: Sync / Online Status ── */}
      <View style={{ position: "relative" }}>
        <IconButton onPress={handleStatusPress} isDark={isDark}>
          <Feather
            name={isOnline ? "cloud" : "cloud-off"}
            size={18}
            color={isOnline ? (isDark ? "rgba(226,232,240,0.85)" : "#0369A1") : (isDark ? "rgba(248,113,113,0.9)" : "#f87171")}
          />
        </IconButton>

        {/* Live-sync indicator dot */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: isOnline
              ? isRunningSync
                ? "#f59e0b"
                : "#4ade80"
              : "#f87171",
            borderWidth: 2,
            borderColor: isDark ? "#0B120B" : "#FAFEEF",
          }}
        />

        {/* Pending badge */}
        {pendingSyncCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 17,
              height: 17,
              borderRadius: 9,
              backgroundColor: "#ef4444",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 3,
              borderWidth: 1.5,
              borderColor: isDark ? "#0B120B" : "#FAFEEF",
            }}
          >
            <Text
              style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}
            >
              {pendingSyncCount > 9 ? "9+" : pendingSyncCount}
            </Text>
          </View>
        )}
      </View>

      {/* ── Center: Brand Title ── */}
      <View style={{ alignItems: "center", flex: 1, marginHorizontal: 10 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 34,
            fontWeight: "500",
            letterSpacing: 0.6,
            color: isDark ? "#F8FAFC" : "#111827",
            fontFamily: "serif",
            fontStyle: "italic",
          }}
        >
          Hanap
        </Text>
      </View>

      {/* ── Right: Theme Toggle ── */}
      <IconButton onPress={toggleColorScheme} isDark={isDark}>
        <Animated.View style={themeIconWrapStyle}>
          <Ionicons
            name={isDark ? "leaf-outline" : "leaf"}
            size={16}
            color={isDark ? "rgba(226,232,240,0.9)" : "#16A34A"}
          />
        </Animated.View>
      </IconButton>
    </Animated.View>
  );
}