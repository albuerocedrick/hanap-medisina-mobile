/**
 * src/components/home/ScanNowBanner.tsx
 *
 * Prominent CTA banner card replacing the "Remedy Guide" card in index.tsx
 * (lines 319–337) which showed a static Alert("Coming soon!").
 *
 * Behaviour:
 *  - Tapping the card navigates directly to the Scan tab (camera).
 *  - No data sources — purely a navigation element.
 *  - Always visible, no loading or empty states needed.
 *
 * Data sources:
 *   useRouter → navigation to /(tabs)/scan
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function ScanNowBanner() {
  const router = useRouter();

  return (
    <View className="px-6 mb-6">
      <TouchableOpacity
        className="bg-[#243b27] rounded-[24px] p-5 flex-row items-center gap-4"
        onPress={() => router.push("/(tabs)/scan")}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Open camera to scan a plant"
      >
        {/* Icon */}
        <View className="w-14 h-14 bg-white/15 rounded-full items-center justify-center">
          <Feather name="camera" size={26} color="white" />
        </View>

        {/* Text */}
        <View className="flex-1">
          <Text className="text-white font-bold text-base leading-tight">
            Found an unfamiliar plant?
          </Text>
          <Text className="text-white/70 text-[11px] font-medium leading-tight mt-1">
            Identify it instantly with your camera.
          </Text>
        </View>

        {/* Arrow */}
        <View className="w-8 h-8 bg-white/15 rounded-full items-center justify-center">
          <Feather name="chevron-right" size={16} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
