/**
 * components/library/SearchBar.tsx
 *
 * Debounced search input wired to useLibraryStore.
 * Maintains a local value for instant visual feedback while the store
 * update (and any downstream filtering) is debounced to avoid thrashing.
 */

import { Ionicons, Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { searchPlantsLocally } from "@/src/services/firebaseLibrary";
import {
  selectSearchQuery,
  useLibraryStore,
} from "@/src/store/useLibraryStore";
import { useNetworkStore } from "@/src/store/useNetworkStore";

const DEBOUNCE_MS = 320;

interface SearchBarProps {
  placeholder?: string;
  debounceMs?: number;
  onSearch?: (query: string) => void;
  onFocusChange?: (focused: boolean) => void;
}

export function SearchBar({
  placeholder = "Search plants or categories…",
  debounceMs = DEBOUNCE_MS,
  onSearch,
  onFocusChange,
}: SearchBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const committedQuery = useLibraryStore(selectSearchQuery);
  const setSearchQuery = useLibraryStore((s) => s.setSearchQuery);

  const [localValue, setLocalValue] = useState<string>(committedQuery);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const router = useRouter();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    if (committedQuery === "" && localValue !== "") {
      setLocalValue("");
    }
  }, [committedQuery]);

  const commitQuery = useCallback(
    (text: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      setIsBusy(true);

      debounceTimer.current = setTimeout(() => {
        try {
          setSearchQuery(text);
          onSearch?.(text);
        } catch (err) {
          console.error("[SearchBar] Failed to commit search query:", err);
        } finally {
          setIsBusy(false);
        }
      }, debounceMs);
    },
    [setSearchQuery, onSearch, debounceMs],
  );

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
    inputRef.current?.focus();
  };

  const hasValue = localValue.length > 0;

  return (
    <View className="mx-6 my-2 z-50">
      <View
        style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: "transparent",
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: hasValue 
            ? (isDark ? "rgba(162,207,163,0.8)" : "#A2CFA3") 
            : (isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.5)")
        }}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={hasValue ? (isDark ? "#A2CFA3" : "#22451C") : (isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)")}
          style={{ marginRight: 8 }}
        />

        <TextInput
          ref={inputRef}
          style={{
            flex: 1, fontFamily: "Quicksand_600SemiBold", fontSize: 14,
            color: isDark ? "#F8FAFC" : "#22451C"
          }}
          value={localValue}
          onChangeText={handleChangeText}
          onFocus={() => { setIsFocused(true); onFocusChange?.(true); }}
          onBlur={() => { setIsFocused(false); onFocusChange?.(false); }}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)"}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />

        {isBusy && hasValue ? (
          <ActivityIndicator
            size="small"
            color={isDark ? "#A2CFA3" : "#22451C"}
            style={{ marginLeft: 8 }}
          />
        ) : hasValue ? (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View 
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)",
                width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center"
              }}
            >
              <Ionicons name="close" size={12} color={isDark ? "#F8FAFC" : "#22451C"} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Suggestions dropdown */}
      {isFocused && hasValue && suggestions.length > 0 && (
        <Animated.View 
          entering={FadeInDown.duration(280).springify().damping(24)}
          exiting={FadeOut.duration(160)}
          style={{
            position: "absolute", top: 56, left: 0, right: 0,
            backgroundColor: isDark ? "#111C11" : "#F4FAE8",
            borderRadius: 18, overflow: "hidden",
            borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(34,69,28,0.1)",
            shadowColor: "#000", shadowOpacity: isDark ? 0.35 : 0.1, shadowRadius: 28, shadowOffset: { width: 0, height: 16 },
            elevation: 12, zIndex: 100
          }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(34,69,28,0.07)" }}>
            <Text style={{ fontSize: 10, fontFamily: "Quicksand_700Bold", letterSpacing: 1.4, textTransform: "uppercase", color: isDark ? "rgba(226,232,240,0.75)" : "#4D8035" }}>
              Suggestions
            </Text>
          </View>
          {suggestions.map((s, index) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.65}
              // Prevent keyboard dismissal from blocking the tap
              onPressIn={() => {
                setLocalValue(s.name);
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                setIsBusy(true);
                try {
                  setSearchQuery(s.name);
                  onSearch?.(s.name);
                } finally {
                  setIsBusy(false);
                }
                inputRef.current?.blur();
                router.push(`/(tabs)/library/${s.id}`);
              }}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 12,
                borderBottomWidth: index === suggestions.length - 1 ? 0 : 1,
                borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.06)"
              }}
            >
              {/* Icon */}
              <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(77,128,53,0.08)", marginRight: 12 }}>
                <Feather name="book-open" size={15} color={isDark ? "rgba(226,232,240,0.85)" : "#4D8035"} />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.92)" : "#1a3312", fontSize: 14, marginBottom: 1 }}>{s.name}</Text>
                {s.scientificName ? (
                  <Text style={{ fontFamily: "Quicksand_500Medium", fontStyle: "italic", color: isDark ? "rgba(226,232,240,0.55)" : "rgba(34,69,28,0.45)", fontSize: 11 }} numberOfLines={1}>
                    {s.scientificName}
                  </Text>
                ) : null}
              </View>

              <Feather name="chevron-right" size={14} color={isDark ? "rgba(226,232,240,0.45)" : "rgba(34,69,28,0.3)"} />
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}
