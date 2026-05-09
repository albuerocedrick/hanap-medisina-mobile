import { useFocusEffect, usePathname } from "expo-router";
import React, { useCallback } from "react";
import { Dimensions, View, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
let globalLastTabIndex = 0;

const TAB_ORDER: Record<string, number> = {
  index: 0,
  library: 1,
  scan: 2,
  history: 3,
  profile: 4,
};

interface PageTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export function PageTransition({ children, style, className }: PageTransitionProps) {
  const pathname = usePathname();
  let currentTab = pathname.split("/").pop() || "index";
  if (currentTab === "") currentTab = "index";

  const currentIndex = TAB_ORDER[currentTab] ?? 0;

  // Start at 0 — no flicker on first render
  const translateX = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      const isMovingRight = currentIndex >= globalLastTabIndex;
      const startOffset = isMovingRight ? width : -width;

      // ✅ Run snap + animation atomically on the UI thread —
      //    zero bridge round-trips, zero frame gap
      runOnUI(() => {
        "worklet";
        cancelAnimation(translateX);        // kill any in-flight animation
        translateX.value = startOffset;     // instant snap to edge
        translateX.value = withTiming(0, {  // slide in
          duration: 320,
          easing: Easing.out(Easing.cubic),
        });
      })();

      globalLastTabIndex = currentIndex;

      return () => {
        // No need to reset — next focus will snap before animating
      };
    }, [currentIndex])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      {/* This inner View carries the background-color className so dark: variants work correctly.
          Inline styles on Animated.View would override NativeWind classNames, so we separate concerns. */}
      <View style={[{ flex: 1 }, style]} className={className}>
        {children}
      </View>
    </Animated.View>
  );
}
