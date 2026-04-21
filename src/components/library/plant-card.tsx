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
import React, { useState } from "react";
import {
  Image,
  ImageErrorEventData,
  NativeSyntheticEvent,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PlantSummary } from "../../services/firebaseLibrary";
import { useLibraryStore } from "../../store/useLibraryStore";
import { selectIsOnline, useNetworkStore } from "../../store/useNetworkStore";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

/** Local placeholder shown when imageUrl is missing or fails to load. */
const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

/** Maximum category chips shown before "+N more" truncation. */
const MAX_VISIBLE_CATEGORIES = 2;

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface PlantCardProps {
  plant: PlantSummary;
  /** Overrides the default navigation to library/[id]. Useful in comparison flow. */
  onPress?: (plant: PlantSummary) => void;
  /** When true, hides the favorite heart icon. */
  hideFavoriteIndicator?: boolean;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

interface CategoryChipProps {
  label: string;
}

function CategoryChip({ label }: CategoryChipProps) {
  if (!label?.trim()) return null;
  return (
    <View className="bg-green-50 border border-green-200 rounded-full px-2 py-0.5 mr-1 mt-1">
      <Text className="text-green-700 text-xs font-medium" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function PlantCard({
  plant,
  onPress,
  hideFavoriteIndicator = false,
}: PlantCardProps) {
  const router = useRouter();
  const isFavorite = useLibraryStore((s) => s.isFavorite(plant.id));
  const isOnline = useNetworkStore(selectIsOnline);

  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  // A card is accessible offline only if it's a saved favorite
  const isOfflineAccessible = isFavorite;
  const isUnavailableOffline = !isOnline && !isOfflineAccessible;

  // ── Guard: skip rendering a card with no ID ───────────────────────────────
  if (!plant?.id) {
    console.warn("[PlantCard] Received plant with no ID — skipping render.");
    return null;
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePress = () => {
    if (isUnavailableOffline) return; // Silently block — UI dimming signals this

    try {
      if (onPress) {
        onPress(plant);
      } else {
        router.push(`/(tabs)/library/${plant.id}`);
      }
    } catch (err) {
      console.error(
        `[PlantCard] Navigation failed for plant "${plant.id}":`,
        err,
      );
    }
  };

  const handleImageError = (_: NativeSyntheticEvent<ImageErrorEventData>) => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // ── Category chips ────────────────────────────────────────────────────────
  const safeCategories = Array.isArray(plant.categories)
    ? plant.categories
    : [];
  const visibleCategories = safeCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const overflowCount = safeCategories.length - MAX_VISIBLE_CATEGORIES;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={isUnavailableOffline ? 1 : 0.7}
      accessibilityRole="button"
      accessibilityLabel={`${plant.name}, ${plant.scientificName}`}
      accessibilityHint={
        isUnavailableOffline
          ? "Not available offline. Save as favorite for offline access."
          : "Tap to view plant details"
      }
      accessibilityState={{ disabled: isUnavailableOffline }}
      className="mx-4 mb-3"
    >
      <View
        className={`
          flex-row bg-white rounded-2xl overflow-hidden border border-gray-100
          ${isUnavailableOffline ? "opacity-40" : "opacity-100"}
        `}
        style={
          Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOpacity: 0.07,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }
            : { elevation: 2 }
        }
      >
        {/* ── Plant image ──────────────────────────────────────────────── */}
        <View className="w-24 h-24 bg-green-50">
          {imageLoading && !imageError && (
            <View className="absolute inset-0 bg-green-50 items-center justify-center">
              <Ionicons name="leaf-outline" size={28} color="#86efac" />
            </View>
          )}
          <Image
            source={
              !imageError && plant.imageUrl
                ? { uri: plant.imageUrl }
                : PLACEHOLDER_IMAGE
            }
            className="w-24 h-24"
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            accessibilityLabel={`Image of ${plant.name}`}
          />
        </View>

        {/* ── Text content ─────────────────────────────────────────────── */}
        <View className="flex-1 px-3 py-3 justify-center">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text
                className="text-gray-900 font-semibold text-sm leading-5"
                numberOfLines={1}
              >
                {plant.name ?? "Unknown Plant"}
              </Text>
              <Text
                className="text-gray-400 text-xs italic mt-0.5"
                numberOfLines={1}
              >
                {plant.scientificName ?? ""}
              </Text>
            </View>

            {/* ── Favorite indicator ──────────────────────────────────── */}
            {!hideFavoriteIndicator && (
              <View className="mt-0.5">
                {isFavorite ? (
                  <Ionicons name="heart" size={16} color="#16a34a" />
                ) : (
                  <Ionicons name="heart-outline" size={16} color="#D1D5DB" />
                )}
              </View>
            )}
          </View>

          {/* ── Category chips ───────────────────────────────────────── */}
          {safeCategories.length > 0 && (
            <View className="flex-row flex-wrap mt-1.5 items-center">
              {visibleCategories.map((cat) => (
                <CategoryChip key={cat} label={cat} />
              ))}
              {overflowCount > 0 && (
                <Text className="text-gray-400 text-xs mt-1">
                  +{overflowCount} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Offline lock badge ───────────────────────────────────────────── */}
        {isUnavailableOffline && (
          <View className="absolute top-2 right-2">
            <Ionicons name="cloud-offline-outline" size={14} color="#9CA3AF" />
          </View>
        )}

        {/* ── Chevron ──────────────────────────────────────────────────────── */}
        {!isUnavailableOffline && (
          <View className="items-center justify-center pr-3 pl-1">
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
