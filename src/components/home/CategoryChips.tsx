import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { selectFeedCategories, selectIsLoadingFeed, useFeedStore } from "../../store/useFeedStore";
import { useLibraryStore } from "../../store/useLibraryStore";
import { SkeletonChip } from "./HomeSkeletons";

const SKELETON_COUNT = 4;

export function CategoryChips() {
  const router = useRouter();
  const categories = useFeedStore(selectFeedCategories);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);
  const setActiveCategory = useLibraryStore((s) => s.setActiveCategory);

  const handleChipPress = (categoryId: string) => {
    setActiveCategory(categoryId);
    router.push("/(tabs)/library");
  };

  if (categories.length === 0 && isLoadingFeed) {
    return (
      <View className="px-6 mb-6 flex-row">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonChip key={i} />
        ))}
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View className="mb-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, gap: 8, paddingVertical: 2 }}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => handleChipPress(category.id)}
            activeOpacity={0.75}
            className="flex-row items-center gap-2 bg-[#FAFEEF] dark:bg-[#121A14] border border-[#A2CFA3] dark:border-white/10 rounded-full px-4"
            style={{
              height: 36,
              shadowColor: "#22451C",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Feather
              name={category.icon as any}
              size={14}
              color="rgba(162,207,163,0.85)"
            />
            <Text className="text-[#22451C] dark:text-white/80 font-semibold text-[13px]">
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}