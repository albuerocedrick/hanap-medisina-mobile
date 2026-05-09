/**
 * components/library/FilterPills.tsx
 *
 * Horizontal scrollable category filter pills.
 * Wired to useLibraryStore — setting a category triggers a Firestore
 * re-fetch online, or client-side filtering on favorites offline.
 *
 * "All" is always the first pill and represents null (no filter).
 */

import { useColorScheme } from "nativewind";
import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  selectActiveCategory,
  selectCategories,
  useLibraryStore,
} from "@/src/store/useLibraryStore";
import { selectIsOnline, useNetworkStore } from "@/src/store/useNetworkStore";

const ALL_LABEL = "All";
const SKELETON_COUNT = 5;
const SKELETON_WIDTHS = [48, 64, 56, 72, 52];

interface FilterPillsProps {
  onCategoryChange?: (category: string | null) => void;
}

function SkeletonPill({ width }: { width: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        width, height: 36, borderRadius: 18,
        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
        marginRight: 8,
      }}
      accessibilityElementsHidden
    />
  );
}

interface PillProps {
  label: string;
  isActive: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

function Pill({ label, isActive, isDisabled, onPress }: PillProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
      accessibilityLabel={`Filter by ${label}`}
      style={{ marginRight: 8, opacity: isDisabled ? 0.5 : 1 }}
    >
      <View
        style={{
          height: 36, paddingHorizontal: 16, borderRadius: 18,
          alignItems: "center", justifyContent: "center",
          backgroundColor: isActive 
            ? (isDark ? "rgba(162,207,163,0.15)" : "#22451C")
            : (isDark ? "rgba(255,255,255,0.04)" : "transparent"),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isActive
            ? (isDark ? "rgba(162,207,163,0.8)" : "#22451C")
            : (isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.8)"),
        }}
      >
        <Text
          style={{
            fontFamily: "Quicksand_600SemiBold",
            fontSize: 13,
            color: isActive 
              ? (isDark ? "#A2CFA3" : "#FAFEEF")
              : (isDark ? "rgba(248,250,252,0.7)" : "#22451C")
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function FilterPills({ onCategoryChange }: FilterPillsProps) {
  const categories = useLibraryStore(selectCategories);
  const activeCategory = useLibraryStore(selectActiveCategory);
  const setActiveCategory = useLibraryStore((s) => s.setActiveCategory);
  const fetchCategories = useLibraryStore((s) => s.fetchCategories);
  const isLoadingCategories = useLibraryStore((s) => s.isLoadingCategories);
  const categoriesError = useLibraryStore((s) => s.categoriesError);
  const isOnline = useNetworkStore(selectIsOnline);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOnline && categories.length === 0) {
      fetchCategories().catch((err) => {
        console.warn("[FilterPills] fetchCategories failed:", err);
      });
    }
  }, [isOnline]);

  const handleSelect = (category: string | null) => {
    try {
      setActiveCategory(category);
      onCategoryChange?.(category);
      if (category === null) {
        scrollRef.current?.scrollTo({ x: 0, animated: true });
      }
    } catch (err) {
      console.error("[FilterPills] handleSelect failed:", err);
    }
  };

  if (isLoadingCategories) {
    return (
      <View className="py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          scrollEnabled={false}
        >
          <SkeletonPill width={48} />
          {SKELETON_WIDTHS.map((w, i) => (
            <SkeletonPill key={i} width={w} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (categoriesError && categories.length === 0) {
    return null;
  }

  if (!isOnline && categories.length === 0) {
    return null;
  }

  return (
    <View className="py-2 mb-2">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        accessibilityRole="menu"
      >
        <Pill
          label={ALL_LABEL}
          isActive={activeCategory === null}
          isDisabled={false}
          onPress={() => handleSelect(null)}
        />

        {categories.map((cat) => (
          <Pill
            key={cat}
            label={cat}
            isActive={activeCategory === cat}
            isDisabled={!isOnline}
            onPress={() => handleSelect(cat)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
