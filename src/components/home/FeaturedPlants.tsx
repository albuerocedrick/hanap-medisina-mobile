/**
 * src/components/home/FeaturedPlants.tsx
 *
 * Horizontal scrollable row of featured plant cards.
 * Driven by useFeedStore (system_config/home_feed → featuredPlants).
 *
 * Behaviour:
 *  - Shows skeleton cards while the feed is loading.
 *  - Hides entirely if no featured plants are available after loading.
 *  - Tapping a card navigates to the plant's full detail page.
 *  - Works offline — featuredPlants is persisted by useFeedStore.
 *
 * Data sources (no props needed):
 *   useFeedStore → featuredPlants, isLoadingFeed
 *   useRouter    → navigation to /(tabs)/library/[id]
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  selectFeaturedPlants,
  selectIsLoadingFeed,
  useFeedStore,
} from "../../store/useFeedStore";
import { SkeletonPlantCard } from "./HomeSkeletons";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const SKELETON_COUNT = 3;

// ─────────────────────────────────────────────
// SUB-COMPONENT: Featured Plant Card
// ─────────────────────────────────────────────

interface PlantCardProps {
  id: string;
  name: string;
  scientificName: string;
  thumbnailUrl: string;
  onPress: () => void;
}

function FeaturedPlantCard({ name, scientificName, thumbnailUrl, onPress }: PlantCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      className="w-[128px] rounded-[20px] bg-white shadow-sm overflow-hidden mr-3"
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Learn about ${name}`}
    >
      {/* Thumbnail */}
      <Image
        source={
          !imageError && thumbnailUrl
            ? { uri: thumbnailUrl }
            : require("../../../assets/images/plant-placeholder.jpg")
        }
        style={{ width: 128, height: 96 }}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />

      {/* Name info */}
      <View className="p-3">
        <Text className="text-[#243b27] font-bold text-xs leading-tight" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-gray-400 text-[10px] italic mt-0.5" numberOfLines={1}>
          {scientificName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export function FeaturedPlants() {
  const router = useRouter();

  // ── Store subscriptions ──────────────────────────────────────────────────
  const featuredPlants = useFeedStore(selectFeaturedPlants);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (featuredPlants.length === 0 && isLoadingFeed) {
    return (
      <View className="mb-6">
        <View className="px-6 flex-row justify-between items-center mb-3">
          <Text className="font-semibold text-[#243b27] tracking-tight text-sm">
            Featured Plants
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonPlantCard key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (featuredPlants.length === 0) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="mb-6">
      {/* Section header */}
      <View className="px-6 flex-row justify-between items-center mb-3">
        <Text className="font-semibold text-[#243b27] tracking-tight text-sm">
          Featured Plants
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/library")}
          activeOpacity={0.7}
        >
          <Text className="text-[#4a7553] font-semibold text-[11px]">
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        accessibilityLabel="Featured plants"
      >
        {featuredPlants.map((plant) => (
          <FeaturedPlantCard
            key={plant.id}
            id={plant.id}
            name={plant.name}
            scientificName={plant.scientificName}
            thumbnailUrl={plant.thumbnailUrl}
            onPress={() => router.push(`/(tabs)/library/${plant.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
