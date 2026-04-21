/**
 * components/library/FilterPills.tsx
 *
 * Horizontal scrollable category filter pills.
 * Wired to useLibraryStore — setting a category triggers a Firestore
 * re-fetch online, or client-side filtering on favorites offline.
 *
 * "All" is always the first pill and represents null (no filter).
 */

import React, { useEffect, useRef } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  selectActiveCategory,
  selectCategories,
  useLibraryStore,
} from "../../store/useLibraryStore";
import { selectIsOnline, useNetworkStore } from "../../store/useNetworkStore";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const ALL_LABEL = "All";
/** Number of skeleton pills to show while categories are loading. */
const SKELETON_COUNT = 5;
const SKELETON_WIDTHS = [48, 64, 56, 72, 52]; // px — varied widths look natural

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface FilterPillsProps {
  /** Called after the active category changes. Useful for parent scroll-to-top. */
  onCategoryChange?: (category: string | null) => void;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function SkeletonPill({ width }: { width: number }) {
  return (
    <View
      className="h-9 rounded-full bg-gray-100 mr-2"
      style={{ width }}
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
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled: isDisabled }}
      accessibilityLabel={`Filter by ${label}`}
      className="mr-2"
    >
      <View
        className={`
          h-9 px-4 rounded-full items-center justify-center border
          ${
            isActive
              ? "bg-green-700 border-green-700"
              : "bg-white border-gray-200"
          }
          ${isDisabled ? "opacity-50" : "opacity-100"}
        `}
      >
        <Text
          className={`
            text-sm font-medium
            ${isActive ? "text-white" : "text-gray-600"}
          `}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function FilterPills({ onCategoryChange }: FilterPillsProps) {
  const categories = useLibraryStore(selectCategories);
  const activeCategory = useLibraryStore(selectActiveCategory);
  const setActiveCategory = useLibraryStore((s) => s.setActiveCategory);
  const fetchCategories = useLibraryStore((s) => s.fetchCategories);
  const isLoadingCategories = useLibraryStore((s) => s.isLoadingCategories);
  const categoriesError = useLibraryStore((s) => s.categoriesError);
  const isOnline = useNetworkStore(selectIsOnline);

  const scrollRef = useRef<ScrollView>(null);

  // Fetch categories once when online and not yet loaded
  useEffect(() => {
    if (isOnline && categories.length === 0) {
      fetchCategories().catch((err) => {
        // Error is stored in the Zustand store; no need to rethrow here
        console.warn("[FilterPills] fetchCategories failed:", err);
      });
    }
  }, [isOnline]);

  const handleSelect = (category: string | null) => {
    try {
      setActiveCategory(category);
      onCategoryChange?.(category);
      // Scroll back to the start when resetting to "All"
      if (category === null) {
        scrollRef.current?.scrollTo({ x: 0, animated: true });
      }
    } catch (err) {
      console.error("[FilterPills] handleSelect failed:", err);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoadingCategories) {
    return (
      <View className="py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          scrollEnabled={false}
        >
          {/* "All" pill is always shown */}
          <SkeletonPill width={48} />
          {SKELETON_WIDTHS.map((w, i) => (
            <SkeletonPill key={i} width={w} />
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  // Don't block the whole feed — just hide the pills and let the list render.
  if (categoriesError && categories.length === 0) {
    return null;
  }

  // ── Offline with no categories cached ────────────────────────────────────
  // Categories are volatile (not persisted). If offline and no session cache,
  // hide the bar — the user can still browse their favorites.
  if (!isOnline && categories.length === 0) {
    return null;
  }

  return (
    <View className="py-2">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        accessibilityRole="menu"
        accessibilityLabel="Category filters"
      >
        {/* "All" is always first */}
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
