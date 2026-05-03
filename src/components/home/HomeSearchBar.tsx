/**
 * src/components/home/HomeSearchBar.tsx
 *
 * Home Tab search bar with live suggestion dropdown.
 * Extracted from app/(tabs)/index.tsx (lines 271–315).
 *
 * Behaviour:
 *  - Renders a rounded text input with a search icon.
 *  - Filters the plant list locally on every keystroke (debounced at 300ms
 *    before committing to the global library store).
 *  - Shows up to 6 suggestions in a floating dropdown.
 *  - Tapping a suggestion navigates to the plant's detail page.
 *  - Works fully offline — searches against the persisted `plants` list
 *    in useLibraryStore (enabled by Task 7's partialize change).
 *
 * Data sources (no props needed):
 *   useLibraryStore → plants (persisted summary list), setSearchQuery
 *   searchPlantsLocally → client-side filter (no network call)
 *   useRouter → navigation to /(tabs)/library/[id]
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { searchPlantsLocally } from "../../services/firebaseLibrary";
import { useLibraryStore } from "../../store/useLibraryStore";

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function HomeSearchBar() {
  const router = useRouter();

  // ── Store subscriptions ──────────────────────────────────────────────────
  const plants = useLibraryStore((s) => s.plants);
  const setLibrarySearchQuery = useLibraryStore((s) => s.setSearchQuery);

  // ── Local state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Debounce committing to the global library store to avoid thrashing
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        setLibrarySearchQuery(text);
      } catch (e) {
        console.error("[HomeSearchBar] Failed to commit search query:", e);
      }
    }, 300);
  };

  const handleSuggestionPress = (plantId: string) => {
    setSearchQuery("");
    setLibrarySearchQuery("");
    router.push(`/(tabs)/library/${plantId}`);
  };

  // ── Derived: suggestions (client-side, no network) ───────────────────────
  const suggestions = useMemo(() => {
    const q = (searchQuery || "").trim();
    if (!q) return [];
    try {
      return searchPlantsLocally(plants, q).slice(0, 6);
    } catch {
      return [];
    }
  }, [searchQuery, plants]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View className="px-6 pb-4 relative">
      {/* ── Input Row ── */}
      <View className="relative">
        <TextInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search herbal plants..."
          className="w-full bg-white rounded-full py-4 pl-6 pr-12 text-[13px] text-gray-700 placeholder-gray-400 font-medium shadow-sm"
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search herbal plants"
          accessibilityRole="search"
        />
        <TouchableOpacity
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#dce7df] rounded-full flex items-center justify-center"
          activeOpacity={0.7}
          accessibilityLabel="Search"
        >
          <Feather name="search" size={16} color="#4a7553" />
        </TouchableOpacity>
      </View>

      {/* ── Suggestions Dropdown ── */}
      {suggestions.length > 0 && (
        <View className="absolute left-6 right-6 top-[56px] bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden z-50">
          {suggestions.map((plant, index) => (
            <TouchableOpacity
              key={plant.id}
              className={`px-4 py-3 flex-row items-center justify-between ${
                index < suggestions.length - 1 ? "border-b border-gray-100" : ""
              }`}
              activeOpacity={0.7}
              onPress={() => handleSuggestionPress(plant.id)}
              accessibilityLabel={`Go to ${plant.name}`}
              accessibilityRole="button"
            >
              <View className="flex-1 mr-2">
                <Text className="text-[#243b27] font-semibold text-sm">
                  {plant.name}
                </Text>
                {plant.scientificName ? (
                  <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                    {plant.scientificName}
                  </Text>
                ) : null}
              </View>
              <Feather name="chevron-right" size={14} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
