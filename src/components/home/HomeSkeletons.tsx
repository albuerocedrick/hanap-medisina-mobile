/**
 * src/components/home/HomeSkeletons.tsx
 *
 * Reusable skeleton placeholder components for the Home Tab.
 * Used as loading states in:
 *   - CategoryChips.tsx   → SkeletonChip
 *   - PlantOfTheDay.tsx   → SkeletonHeroCard
 *   - FeaturedPlants.tsx  → SkeletonPlantCard
 *   - DailyTrivia.tsx     → SkeletonTriviaCard
 *
 * Pattern: Animated opacity pulse (0.3 → 1.0 → 0.3) on gray
 * rounded rectangles. Starts automatically on mount.
 */

import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

// ─────────────────────────────────────────────
// SHARED PULSE HOOK
// ─────────────────────────────────────────────

/**
 * Returns an Animated.Value that pulses between 0.3 and 1.0 indefinitely.
 * Attach it as the `opacity` style on any skeleton element.
 */
function usePulse(): Animated.Value {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1.0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return opacity;
}

// ─────────────────────────────────────────────
// SKELETON: CHIP
// Used by: CategoryChips.tsx
// Shape: Pill / rounded rectangle, 88 × 34
// ─────────────────────────────────────────────

export function SkeletonChip() {
  const opacity = usePulse();
  return (
    <Animated.View
      style={{ opacity }}
      className="h-[34px] w-[88px] rounded-full bg-[#dce7df] mr-2"
    />
  );
}

// ─────────────────────────────────────────────
// SKELETON: HERO CARD
// Used by: PlantOfTheDay.tsx
// Shape: Full-width rounded card, height 220
// ─────────────────────────────────────────────

export function SkeletonHeroCard() {
  const opacity = usePulse();
  return (
    <Animated.View
      style={{ opacity }}
      className="w-full h-[220px] rounded-[32px] bg-[#dce7df]"
    />
  );
}

// ─────────────────────────────────────────────
// SKELETON: PLANT CARD
// Used by: FeaturedPlants.tsx
// Shape: Small square card, 128 × 150
// ─────────────────────────────────────────────

export function SkeletonPlantCard() {
  const opacity = usePulse();
  return (
    <Animated.View
      style={{ opacity }}
      className="w-[128px] rounded-[20px] bg-[#dce7df] mr-3 overflow-hidden"
    >
      {/* Thumbnail placeholder */}
      <View className="w-full h-[96px] bg-[#c8d9cc]" />
      {/* Name placeholder lines */}
      <View className="p-3 gap-2">
        <View className="h-[10px] w-3/4 rounded-full bg-[#c8d9cc]" />
        <View className="h-[8px] w-1/2 rounded-full bg-[#c8d9cc]" />
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// SKELETON: TRIVIA CARD
// Used by: DailyTrivia.tsx
// Shape: Full-width rounded card, height 88
// ─────────────────────────────────────────────

export function SkeletonTriviaCard() {
  const opacity = usePulse();
  return (
    <Animated.View
      style={{ opacity }}
      className="w-full rounded-[20px] bg-[#dce7df] p-4"
    >
      <View className="flex-row items-center gap-3">
        {/* Icon placeholder */}
        <View className="w-9 h-9 rounded-full bg-[#c8d9cc]" />
        <View className="flex-1 gap-2">
          {/* Title line */}
          <View className="h-[10px] w-1/3 rounded-full bg-[#c8d9cc]" />
          {/* Text lines */}
          <View className="h-[8px] w-full rounded-full bg-[#c8d9cc]" />
          <View className="h-[8px] w-4/5 rounded-full bg-[#c8d9cc]" />
        </View>
      </View>
    </Animated.View>
  );
}
