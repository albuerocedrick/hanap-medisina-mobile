import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, View } from "react-native";
import { useCameraStore } from "../../src/store/useCameraStore";

// ─── Design tokens ────────────────────────────────────────────────────────────
export const tokens = {
  green:        "#10b981", 
  greenDark:    "#2E4A3D", // Deep forest green matched to reference
  muted:        "#94A3B8", 
  surface:      "#FFFFFF", 
  pillHeight:   78,        // Taller pill to fully encapsulate the center button
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { name: "index",   label: "Home",    icon: "home",           iconActive: "home"      },
  { name: "library", label: "Library", icon: "book",           iconActive: "book"      },
  { name: "scan",    label: "Scan",    icon: "camera",         iconActive: "camera", center: true },
  { name: "history", label: "History", icon: "time-outline",   iconActive: "time"      },
  { name: "profile", label: "Profile", icon: "person-outline", iconActive: "person"    },
] as const;

// ─── Single animated tab item ─────────────────────────────────────────────────
function TabItem({
  tab,
  isActive,
  isProcessing,
  onPress,
}: {
  tab: (typeof TABS)[number] & { center?: boolean };
  isActive: boolean;
  isProcessing: boolean;
  onPress: () => void;
}) {
  const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  }, [isActive]);

  // ── Center Prominent Scan Button (Contained inside layout) ────────────────
  if (tab.center) {
    return (
      <View style={{ flex: 1.2, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
        <Pressable
          onPress={onPress}
          disabled={isProcessing}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View style={{ transform: [{ scale: isProcessing ? 0.95 : 1 }] }}>
            {/* Outer White Ring (Provides the cutout/border effect) */}
            <View
              style={{
                width: 64,  // Fits comfortably inside the 78px pill
                height: 64,
                borderRadius: 32,
                backgroundColor: tokens.surface,
                alignItems: "center",
                justifyContent: "center",
                // Subtle shadow to distinguish the ring from the pill background
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              {/* Inner Dark Green Core */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: tokens.greenDark,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator color={tokens.surface} size="small" />
                ) : (
                  <Ionicons name={tab.iconActive} size={24} color={tokens.surface} />
                )}
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </View>
    );
  }

  // ── Regular Tab (Icon + Bottom Dot) ───────────────────────────────────────
  const iconScale = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", height: "100%" }}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <View style={{ alignItems: "center", justifyContent: "center", height: 40 }}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons
            name={isActive ? tab.iconActive : tab.icon}
            size={24}
            color={isActive ? tokens.greenDark : tokens.muted}
          />
        </Animated.View>
        
        {/* Animated Dot Indicator */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: -10, // Positioned right under the icon
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: tokens.greenDark,
            opacity: activeAnim,
            transform: [
              { scale: activeAnim },
              { translateY: activeAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }
            ],
          }}
        />
      </View>
    </Pressable>
  );
}

// ─── Custom Floating Tab Bar ──────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: any) {
  const triggerCapture = useCameraStore((s) => s.triggerCapture);
  const isProcessing = useCameraStore((s) => s.isProcessing);

  return (
    <View
      style={{
        position: "absolute",
        bottom: Platform.OS === "ios" ? 34 : 24,
        left: 20,
        right: 20,
        height: tokens.pillHeight,
        backgroundColor: tokens.surface,
        borderRadius: 999, // Perfect pill shape
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        // Premium subtle shadow matching design policy (--shadow-md equivalent)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      {TABS.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const isActive   = state.index === routeIndex;

        return (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={isActive}
            isProcessing={isProcessing}
            onPress={() => {
              const route = state.routes[routeIndex];
              const event = navigation.emit({
                type: "tabPress",
                target: route?.key,
                canPreventDefault: true,
              });

              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              } else if (isActive && tab.name === "scan") {
                triggerCapture();
              }
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: "Home"    }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="scan"    options={{ title: "Scan"    }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}