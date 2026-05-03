/**
 * src/components/home/PlantOfTheDay.tsx
 *
 * Large hero card featuring the curated "Plant of the Day".
 * Replaces the hard-coded "Featured Discovery" section in index.tsx
 * (lines 339–371) which showed a static Unsplash Tsaang Gubat image.
 *
 * Behaviour:
 *  - Shows a full-bleed plant image with a gradient overlay.
 *  - Displays the plant name, subtitle, and a "Read Guide" pill button.
 *  - Tapping navigates to the plant's full detail page in the Library.
 *  - Shows a skeleton card while the feed is loading for the first time.
 *  - Hides entirely if the feed has loaded but plantOfTheDay is null.
 *  - Works offline — plantOfTheDay is persisted by useFeedStore.
 *
 * Data sources (no props needed):
 *   useFeedStore → plantOfTheDay, isLoadingFeed
 *   useRouter    → navigation to /(tabs)/library/[id]
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  selectIsLoadingFeed,
  selectPlantOfTheDay,
  useFeedStore,
} from "../../store/useFeedStore";
import { SkeletonHeroCard } from "./HomeSkeletons";

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function PlantOfTheDay() {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  // ── Store subscriptions ──────────────────────────────────────────────────
  const plantOfTheDay = useFeedStore(selectPlantOfTheDay);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);

  // ── Loading state: show skeleton ─────────────────────────────────────────
  if (plantOfTheDay === null && isLoadingFeed) {
    return (
      <View className="px-6 mb-6">
        <Text className="font-semibold text-[#243b27] tracking-tight text-sm mb-3">
          Plant of the Day
        </Text>
        <SkeletonHeroCard />
      </View>
    );
  }

  // ── Empty state: hide section entirely ───────────────────────────────────
  if (plantOfTheDay === null) return null;

  // ── Handler ───────────────────────────────────────────────────────────────
  const handlePress = () => {
    router.push(`/(tabs)/library/${plantOfTheDay.id}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="px-6 mb-6">
      {/* Section title */}
      <View className="flex-row justify-between items-end mb-3">
        <Text className="font-semibold text-[#243b27] tracking-tight text-sm">
          Plant of the Day
        </Text>
      </View>

      {/* Hero card */}
      <TouchableOpacity
        className="w-full h-[220px] rounded-[32px] overflow-hidden shadow-sm"
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Learn about ${plantOfTheDay.name}`}
      >
        {/* Plant image */}
        <Image
          source={
            !imageError && plantOfTheDay.heroImageUrl
              ? { uri: plantOfTheDay.heroImageUrl }
              : require("../../../assets/images/plant-placeholder.jpg")
          }
          className="w-full h-full"
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        {/* Gradient overlay — dark bottom, fades to transparent top */}
        <View className="absolute inset-0 bg-gradient-to-t from-[#243b27]/90 via-[#243b27]/30 to-transparent p-6 flex flex-col justify-end">
          {/* Plant name */}
          <Text className="text-white font-bold text-2xl leading-tight">
            {plantOfTheDay.name}
          </Text>

          {/* Scientific name */}
          <Text className="text-white/70 text-[11px] italic mt-0.5">
            {plantOfTheDay.scientificName}
          </Text>

          {/* Subtitle */}
          <Text className="text-white/85 text-[11px] font-medium mt-1 mb-4 w-5/6">
            {plantOfTheDay.subtitle}
          </Text>

          {/* CTA pill */}
          <View className="flex-row items-center gap-1.5 bg-white/20 border border-white/30 rounded-full py-2 px-4 self-start">
            <Text className="text-white text-[10px] font-semibold">
              Read Guide
            </Text>
            <Feather name="arrow-right" size={11} color="white" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
