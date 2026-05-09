import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect } from "react";
import { ActivityIndicator, Dimensions, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useCameraStore } from "../../src/store/useCameraStore";
import * as Haptics from "expo-haptics";
import { ScanLine } from "lucide-react-native";

// ─── Design Tokens ───────────────────────────────────────────
const tokens = {
  greenDark: "#22451C",
  greenAccent: "#4D8035",
  muted: "#A2CFA3",
  pillHeight: 64,
  horizontalPadding: 24,
};

// Calculate exact width of one tab for the slider
const SCREEN_WIDTH = Dimensions.get("window").width;
const TAB_WIDTH = (SCREEN_WIDTH - tokens.horizontalPadding * 2) / 5;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS = [
  { name: "index", label: "Home", icon: "home-outline", iconActive: "home" },
  { name: "library", label: "Library", icon: "book-outline", iconActive: "book" },
  { name: "scan", label: "Scan", icon: "camera", iconActive: "camera", center: true },
  { name: "history", label: "History", icon: "time-outline", iconActive: "time" },
  { name: "profile", label: "Profile", icon: "person-outline", iconActive: "person" },
] as const;

// ─── Single Reanimated Tab Item ───────────────────────────────────────────────
function TabItem({
  tab,
  isActive,
  isProcessing,
  isDark,
  onPress,
}: {
  tab: (typeof TABS)[number] & { center?: boolean };
  isActive: boolean;
  isProcessing: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const activeAnim = useSharedValue(isActive ? 1 : 0);
  const pressAnim = useSharedValue(0);

  useEffect(() => {
    activeAnim.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isActive]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scale =
      interpolate(activeAnim.value, [0, 1], [1, 1.15], Extrapolate.CLAMP) *
      interpolate(pressAnim.value, [0, 1], [1, 0.85], Extrapolate.CLAMP);

    // Moves the icon up slightly when active to make room for the line
    const translateY = tab.center ? 0 : interpolate(activeAnim.value, [0, 1], [0, -3], Extrapolate.CLAMP);

    return { transform: [{ scale }, { translateY }] };
  });

  const handlePressIn = () => (pressAnim.value = withSpring(1, { damping: 15, stiffness: 300 }));
  const handlePressOut = () => (pressAnim.value = withSpring(0, { damping: 15, stiffness: 300 }));

  // ── Sleek Center Button ──
  if (tab.center) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
        <AnimatedPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          disabled={isProcessing}
        >
          <Animated.View style={animatedIconStyle}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? "rgba(255,255,255,0.12)" : tokens.greenDark,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(250, 254, 239, 0.8)",
                shadowColor: isDark ? "#000" : tokens.greenDark,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.25 : 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {isProcessing ? (
                <ActivityIndicator color={isDark ? tokens.greenDark : "#FAFEEF"} size="small" />
              ) : (
                <ScanLine size={24} color={isDark ? "rgba(248,250,252,0.9)" : "#FAFEEF"} strokeWidth={2.2} />
              )}
            </View>
          </Animated.View>
        </AnimatedPressable>
      </View>
    );
  }

  // ── Regular Tabs ──
  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", height: "100%" }}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          name={isActive ? tab.iconActive : tab.icon}
          size={22}
          color={
            isActive
              ? isDark
                ? "rgba(248,250,252,0.9)"
                : tokens.greenDark
              : isDark
                ? "rgba(248,250,252,0.45)"
                : tokens.muted
          }
        />
      </Animated.View>
    </AnimatedPressable>
  );
}

// ─── Custom Floating Glassmorphism Tab Bar ────────────────────────────────────
function CustomTabBar({ state, navigation }: any) {
  const triggerCapture = useCameraStore((s) => s.triggerCapture);
  const isProcessing = useCameraStore((s) => s.isProcessing);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🌟 Sliding Indicator Animation Value
  const sliderPosition = useSharedValue(state.index);

  // Sync slider if navigation happens from outside the tab bar (like a back button)
  useEffect(() => {
    sliderPosition.value = withSpring(state.index, { damping: 16, stiffness: 110, mass: 0.9 });
  }, [state.index]);

  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: sliderPosition.value * TAB_WIDTH }],
    };
  });

  return (
    <View
      style={{
        position: "absolute",
        bottom: Platform.OS === "ios" ? 34 : 20,
        left: tokens.horizontalPadding,
        right: tokens.horizontalPadding,
        height: tokens.pillHeight,
        borderRadius: tokens.pillHeight / 2,
        shadowColor: isDark ? "#000" : tokens.greenDark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.4 : 0.1,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <View style={{ flex: 1, borderRadius: tokens.pillHeight / 2, overflow: "hidden" }}>
        <BlurView
          intensity={Platform.OS === "ios" ? 60 : 90}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? "rgba(10, 12, 10, 0.72)" : "rgba(250, 254, 239, 0.75)" },
          ]}
        />

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.8)",
              borderRadius: tokens.pillHeight / 2,
            },
          ]}
        />

        {/* 🌟 The Sliding Line Indicator */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 12, // 🌟 Moved up closer to the icons (was 6)
              width: TAB_WIDTH,
              height: 4,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 0,
            },
            animatedSliderStyle,
          ]}
        >
          <View
            style={{
              width: 18,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? "rgba(248,250,252,0.55)" : tokens.greenAccent,
            }}
          />
        </Animated.View>

        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {TABS.map((tab) => {
            const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
            const isActive = state.index === routeIndex;

            return (
              <TabItem
                key={tab.name}
                tab={tab}
                isActive={isActive}
                isDark={isDark}
                isProcessing={isProcessing}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                  const route = state.routes[routeIndex];
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route?.key,
                    canPreventDefault: true,
                  });

                  if (!isActive && !event.defaultPrevented) {
                    // 🌟 1. INSTANTLY trigger the sliding animation (you will see it glide)
                    sliderPosition.value = withSpring(routeIndex, {
                      damping: 15,
                      stiffness: 110, // Smoother, slightly slower spring so you can see it slide
                      mass: 0.9,
                    });

                    // 🌟 2. Load the next page a split second later so it doesn't freeze the slide
                    setTimeout(() => {
                      navigation.navigate(tab.name);
                    }, 10);
                  } else if (isActive && tab.name === "scan") {
                    triggerCapture();
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}