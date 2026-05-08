/**
 * components/library/PlantCard.tsx
 *
 * List item card for the Library feed.
 *
 * - Navigates to library/[id] on press.
 * - Shows a heart badge if the plant is in favorites (accessible offline).
 * - Falls back to a placeholder when the image fails to load.
 * - Visually dimmed when `isOnline` is false and the plant is NOT a favorite,
 *   indicating it's unavailable to view in full detail offline.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { memo, useState } from "react";
import {
  Image,
  ImageErrorEventData,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { PlantSummary } from "@/src/services/firebaseLibrary";
import { useLibraryStore } from "@/src/store/useLibraryStore";
import { selectIsOnline, useNetworkStore } from "@/src/store/useNetworkStore";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");
const MAX_VISIBLE_CATEGORIES = 2;

interface PlantCardProps {
  plant: PlantSummary;
  onPress?: (plant: PlantSummary) => void;
  hideFavoriteIndicator?: boolean;
}

const CategoryChip = memo(function CategoryChip({ label }: { label: string }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!label?.trim()) return null;
  return (
    <View 
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(162,207,163,0.15)",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)",
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, marginTop: 4
      }}
    >
      <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 10, color: isDark ? "rgba(248,250,252,0.6)" : "#22451C" }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
});

export function PlantCardComponent({
  plant,
  onPress,
  hideFavoriteIndicator = false,
}: PlantCardProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isFavorite = useLibraryStore((s) => s.isFavorite(plant.id));
  const isOnline = useNetworkStore(selectIsOnline);

  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  const isOfflineAccessible = isFavorite;
  const isUnavailableOffline = !isOnline && !isOfflineAccessible;

  if (!plant?.id) {
    console.warn("[PlantCard] Received plant with no ID — skipping render.");
    return null;
  }

  const handlePress = () => {
    if (isUnavailableOffline) return;
    try {
      if (onPress) {
        onPress(plant);
      } else {
        router.push(`/(tabs)/library/${plant.id}`);
      }
    } catch (err) {
      console.error(`[PlantCard] Navigation failed for plant "${plant.id}":`, err);
    }
  };

  const handleImageError = (_: NativeSyntheticEvent<ImageErrorEventData>) => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const safeCategories = Array.isArray(plant.categories) ? plant.categories : [];
  const visibleCategories = safeCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const overflowCount = safeCategories.length - MAX_VISIBLE_CATEGORIES;

  return (
    <AnimatedTouchable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={handlePress}
      activeOpacity={1}
      style={[animStyle, { opacity: isUnavailableOffline ? 0.4 : 1, marginHorizontal: 24, marginBottom: 12 }]}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "transparent",
          borderRadius: 24, overflow: "hidden",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(162,207,163,0.6)",
        }}
      >
        <View style={{ width: 100, height: 100, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)" }}>
          {imageLoading && !imageError && (
            <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="leaf-outline" size={24} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"} />
            </View>
          )}
          <Image
            source={!imageError && plant.imageUrl ? { uri: plant.imageUrl } : PLACEHOLDER_IMAGE}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontFamily: "Quicksand_700Bold", fontSize: 16, color: isDark ? "#F8FAFC" : "#22451C" }} numberOfLines={1}>
                {plant.name ?? "Unknown Plant"}
              </Text>
              <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 13, color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", marginTop: 2 }} numberOfLines={1}>
                {plant.scientificName ?? ""}
              </Text>
            </View>

            {!hideFavoriteIndicator && (
              <View style={{ marginTop: 2 }}>
                {isFavorite ? (
                  <Ionicons name="heart" size={16} color={isDark ? "#fca5a5" : "#ef4444"} />
                ) : (
                  <Ionicons name="heart-outline" size={16} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"} />
                )}
              </View>
            )}
          </View>

          {safeCategories.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4, alignItems: "center" }}>
              {visibleCategories.map((cat) => (
                <CategoryChip key={cat} label={cat} />
              ))}
              {overflowCount > 0 && (
                <Text style={{ fontFamily: "Quicksand_500Medium", fontSize: 10, color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.4)", marginTop: 4 }}>
                  +{overflowCount} more
                </Text>
              )}
            </View>
          )}
        </View>

        {isUnavailableOffline && (
          <View style={{ position: "absolute", top: 8, right: 8 }}>
            <Ionicons name="cloud-offline-outline" size={14} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(34,69,28,0.4)"} />
          </View>
        )}
      </View>
    </AnimatedTouchable>
  );
}

export const PlantCard = memo(PlantCardComponent);
