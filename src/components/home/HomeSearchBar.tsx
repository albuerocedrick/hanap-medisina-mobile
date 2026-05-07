import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { searchPlantsLocally } from "../../services/firebaseLibrary";
import { useLibraryStore } from "../../store/useLibraryStore";

const AnimatedView = Animated.View;

export function HomeSearchBar({
  onActiveChange,
}: {
  onActiveChange?: (active: boolean) => void;
}) {
  const router = useRouter();
  const plants = useLibraryStore((s) => s.plants);
  const setLibrarySearchQuery = useLibraryStore((s) => s.setSearchQuery);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focusAnim = useSharedValue(0);
  const clearScale = useSharedValue(0);
  const actionAnim = useSharedValue(0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { duration: 220 });
  }, [isFocused]);

  useEffect(() => {
    clearScale.value = withSpring(searchQuery.length > 0 ? 1 : 0, {
      damping: 18,
      stiffness: 260,
    });
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setLibrarySearchQuery(text);
    }, 280);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setLibrarySearchQuery("");
    Keyboard.dismiss();
  };

  const isSearchActive = isFocused || searchQuery.trim().length > 0;

  useEffect(() => {
    actionAnim.value = withTiming(isSearchActive ? 1 : 0, { duration: 180 });
  }, [isSearchActive, actionAnim]);

  useEffect(() => {
    onActiveChange?.(isSearchActive);
  }, [isSearchActive, onActiveChange]);

  const suggestions = useMemo(() => {
    const q = (searchQuery || "").trim();
    if (!q) return [];
    try {
      return searchPlantsLocally(plants, q).slice(0, 5);
    } catch {
      return [];
    }
  }, [searchQuery, plants]);

  // Animated bar style — border color transitions on focus
  const barStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [
        isDark ? "rgba(255,255,255,0.12)" : "#A2CFA3",
        isDark ? "rgba(255,255,255,0.22)" : "#4D8035",
      ],
    );
    return {
      borderColor,
      shadowOpacity: withTiming(isFocused ? 0.08 : 0, { duration: 220 }),
    };
  });

  // Clear button pop-in
  const clearStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clearScale.value }],
    opacity: clearScale.value,
  }));

  const actionButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      actionAnim.value,
      [0, 1],
      [isDark ? "rgba(255,255,255,0.08)" : "#2F4F3A", isDark ? "rgba(255,255,255,0.09)" : "#EEF5E9"],
    ),
  }));

  return (
    <View style={{ paddingHorizontal: 22, paddingBottom: 16, zIndex: 50 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* ── Search Bar ── */}
        <AnimatedView
          style={[
            barStyle,
            {
              flex: 1,
              height: 56,
              borderRadius: 28,
              borderWidth: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 0,
              elevation: 0,
              overflow: "hidden",
            },
          ]}
        >
          {/* Search icon */}
          <View style={{ paddingLeft: 16, paddingRight: 10 }}>
            <Feather
              name="search"
              size={18}
              color={
                isFocused
                  ? isDark
                    ? "rgba(226,232,240,0.9)"
                    : "#6B7280"
                  : isDark
                  ? "rgba(226,232,240,0.6)"
                  : "#94A3B8"
              }
            />
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search your plant"
            placeholderTextColor={isDark ? "rgba(226,232,240,0.45)" : "#94A3B8"}
            style={{
              flex: 1,
              height: "100%",
              fontSize: 15,
              fontFamily: "Quicksand_500Medium",
              color: isDark ? "rgba(248,250,252,0.92)" : "#334155",
              letterSpacing: 0.2,
            }}
            returnKeyType="search"
            selectionColor={isDark ? "#86EFAC" : "#4D8035"}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* Clear button */}
          <AnimatedView style={[clearStyle, { marginRight: 10 }]}>
            <TouchableOpacity
              onPress={clearSearch}
              activeOpacity={0.7}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
              }}
            >
              <Feather
                name="x"
                size={13}
                color={isDark ? "#E5E7EB" : "#6B7280"}
              />
            </TouchableOpacity>
          </AnimatedView>
        </AnimatedView>

        <Animated.View
          style={[
            {
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 10,
            },
            actionButtonStyle,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (isSearchActive) {
                clearSearch();
                setIsFocused(false);
                return;
              }
              setLibrarySearchQuery(searchQuery);
              router.push("/(tabs)/library");
            }}
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name={isSearchActive ? "x" : "sliders"}
              size={16}
              color={isSearchActive ? (isDark ? "rgba(248,250,252,0.85)" : "#4D8035") : "#F8FAFC"}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Suggestions Dropdown ── */}
      {suggestions.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(280).springify().damping(24)}
          exiting={FadeOut.duration(160)}
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            top: 62,
            borderRadius: 18,
            overflow: "hidden",
            backgroundColor: isDark ? "#111C11" : "#F4FAE8",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(34,69,28,0.1)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: isDark ? 0.35 : 0.1,
            shadowRadius: 28,
            elevation: 12,
            zIndex: 100,
          }}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(34,69,28,0.07)",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Quicksand_700Bold",
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: isDark ? "rgba(226,232,240,0.75)" : "#4D8035",
              }}
            >
              Suggestions
            </Text>
          </View>

          {suggestions.map((plant, index) => (
            <TouchableOpacity
              key={plant.id}
              activeOpacity={0.65}
              onPress={() => {
                clearSearch();
                router.push(`/(tabs)/library/${plant.id}`);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth:
                  index < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(34,69,28,0.06)",
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(77,128,53,0.08)",
                  marginRight: 12,
                }}
              >
                <Feather
                  name="book-open"
                  size={15}
                  color={isDark ? "rgba(226,232,240,0.85)" : "#4D8035"}
                />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Quicksand_700Bold",
                    color: isDark ? "rgba(248,250,252,0.92)" : "#1a3312",
                    marginBottom: 1,
                  }}
                >
                  {plant.name}
                </Text>
                {plant.scientificName && (
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Quicksand_500Medium",
                      color: isDark
                        ? "rgba(226,232,240,0.55)"
                        : "rgba(34,69,28,0.45)",
                      fontStyle: "italic",
                    }}
                    numberOfLines={1}
                  >
                    {plant.scientificName}
                  </Text>
                )}
              </View>

              <Feather
                name="chevron-right"
                size={14}
                color={isDark ? "rgba(226,232,240,0.45)" : "rgba(34,69,28,0.3)"}
              />
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}