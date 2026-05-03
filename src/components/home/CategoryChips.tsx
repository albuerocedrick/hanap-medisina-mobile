/**
 * src/components/home/CategoryChips.tsx
 *
 * Horizontal scrollable row of category filter chips on the Home Tab.
 *
 * Behaviour:
 *  - Reads the curated category list from useFeedStore (system_config/home_feed).
 *  - Shows skeleton placeholders while the feed is loading.
 *  - Tapping a chip sets the active category filter in useLibraryStore
 *    and navigates to the Library tab — which then shows only plants
 *    matching that category.
 *  - Works offline — categories are persisted inside useFeedStore.
 *
 * Data sources (no props needed):
 *   useFeedStore     → categories, isLoadingFeed
 *   useLibraryStore  → setActiveCategory
 *   useRouter        → navigation to /(tabs)/library
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { selectFeedCategories, selectIsLoadingFeed, useFeedStore } from "../../store/useFeedStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { SkeletonChip } from "./HomeSkeletons";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const SKELETON_COUNT = 4;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function CategoryChips() {
  const router = useRouter();

  // ── Store subscriptions ──────────────────────────────────────────────────
  const categories = useFeedStore(selectFeedCategories);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);
  const setActiveCategory = useLibraryStore((s) => s.setActiveCategory);

  // ── Handler ───────────────────────────────────────────────────────────────
  const handleChipPress = (categoryId: string) => {
    // Pre-set the Library tab's category filter before navigating
    setActiveCategory(categoryId);
    router.push("/(tabs)/library");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (categories.length === 0 && isLoadingFeed) {
    return (
      <View className="px-6 mb-4">
        <View className="flex-row">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonChip key={i} />
          ))}
        </View>
      </View>
    );
  }

  // ── Empty state (feed loaded but no categories) ───────────────────────────
  if (categories.length === 0) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        accessibilityRole="tablist"
        accessibilityLabel="Plant category filters"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => handleChipPress(category.id)}
            activeOpacity={0.75}
            className="flex-row items-center gap-1.5 bg-white border border-[#dce7df] rounded-full px-4 py-2 shadow-sm"
            accessibilityRole="tab"
            accessibilityLabel={`Filter by ${category.name}`}
          >
            <Feather
              name={category.icon as any}
              size={13}
              color="#4a7553"
            />
            <Text className="text-[#243b27] font-semibold text-[12px]">
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
