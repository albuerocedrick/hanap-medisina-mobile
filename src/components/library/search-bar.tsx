/**
 * components/library/SearchBar.tsx
 *
 * Debounced search input wired to useLibraryStore.
 * Maintains a local value for instant visual feedback while the store
 * update (and any downstream filtering) is debounced to avoid thrashing.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { searchPlantsLocally } from "../../services/firebaseLibrary";
import {
  selectSearchQuery,
  useLibraryStore,
} from "../../store/useLibraryStore";
import { useNetworkStore } from "../../store/useNetworkStore";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const DEBOUNCE_MS = 320;

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface SearchBarProps {
  placeholder?: string;
  /** Override debounce delay (ms). Useful in tests. */
  debounceMs?: number;
  /** Called after the debounce fires with the committed query string. */
  onSearch?: (query: string) => void;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function SearchBar({
  placeholder = "Search plants or categories…",
  debounceMs = DEBOUNCE_MS,
  onSearch,
}: SearchBarProps) {
  // Read the committed store value to stay in sync if cleared externally
  const committedQuery = useLibraryStore(selectSearchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);

  // Local state gives instant keystroke feedback without triggering
  // store re-renders (and downstream filter recalculations) on every character
  const [localValue, setLocalValue] = useState<string>(committedQuery);
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Suggestions: derive from the library's plant list (or favorites when offline)
  const plants = useLibraryStore((s) => s.plants);
  const favorites = useLibraryStore((s) => s.favorites);
  const isOnline = useNetworkStore((s) => s.isOnline);

  const sourceList = isOnline
    ? plants
    : (favorites || []).map((f) => ({
        id: f.id,
        name: f.name,
        scientificName: f.scientificName,
        imageUrl: f.imageUrl,
        categories: f.categories,
      }));

  const suggestions = React.useMemo(() => {
    if (!localValue || localValue.trim().length === 0) return [];
    try {
      return searchPlantsLocally(sourceList, localValue).slice(0, 6);
    } catch (e) {
      return [];
    }
  }, [localValue, sourceList]);

  // Keep local value in sync when the store is reset externally
  // (e.g. user taps a filter pill that also clears the search)
  useEffect(() => {
    if (committedQuery === "" && localValue !== "") {
      setLocalValue("");
    }
  }, [committedQuery]);

  // ── Debounced commit ──────────────────────────────────────────────────────
  const commitQuery = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      setIsBusy(true);

      debounceTimer.current = setTimeout(() => {
        try {
          setSearchQuery(text);
          onSearch?.(text);
        } catch (err) {
          // setSearchQuery is synchronous Zustand — shouldn't throw,
          // but guard defensively so a bad callback doesn't crash the input
          console.error("[SearchBar] Failed to commit search query:", err);
        } finally {
          setIsBusy(false);
        }
      }, debounceMs);
    },
    [setSearchQuery, onSearch, debounceMs],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    commitQuery(text);
  };

  const handleClear = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setLocalValue("");
    setIsBusy(false);
    try {
      setSearchQuery("");
      onSearch?.("");
    } catch (err) {
      console.error("[SearchBar] Failed to clear search query:", err);
    }
    // Return focus to the input after clearing
    inputRef.current?.focus();
  };

  const hasValue = localValue.length > 0;

  return (
    <View className="mx-4 my-2">
      <View
        className={`
          flex-row items-center bg-white rounded-2xl px-4 py-3
          border shadow-sm
          ${hasValue ? "border-green-600" : "border-gray-200"}
        `}
        style={
          Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }
            : { elevation: 2 }
        }
      >
        {/* Leading icon */}
        <Ionicons
          name="search-outline"
          size={18}
          color={hasValue ? "#16a34a" : "#9CA3AF"}
          style={{ marginRight: 8 }}
        />

        {/* Input */}
        <TextInput
          ref={inputRef}
          className="flex-1 text-gray-800 text-sm leading-5"
          value={localValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never" // We use our own clear button for cross-platform parity
          accessibilityLabel="Search plants"
          accessibilityHint="Type to filter the plant library"
        />

        {/* Trailing: busy indicator OR clear button */}
        {isBusy && hasValue ? (
          <ActivityIndicator
            size="small"
            color="#16a34a"
            style={{ marginLeft: 8 }}
          />
        ) : hasValue ? (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <View className="bg-gray-200 rounded-full w-5 h-5 items-center justify-center">
              <Ionicons name="close" size={12} color="#6B7280" />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Suggestions dropdown */}
      {hasValue && suggestions.length > 0 && (
        <View className="mt-2 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          {suggestions.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.7}
              onPress={() => {
                // Immediately set localValue and commit to store
                setLocalValue(s.name);
                // Cancel debounce and commit immediately
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                setIsBusy(true);
                try {
                  setSearchQuery(s.name);
                  onSearch?.(s.name);
                } finally {
                  setIsBusy(false);
                }
                // Keep focus on the input for further typing
                inputRef.current?.focus();
              }}
              className="px-4 py-3 border-b border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-800 font-medium">{s.name}</Text>
                  {s.scientificName ? (
                    <Text className="text-gray-400 text-xs">
                      {s.scientificName}
                    </Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
