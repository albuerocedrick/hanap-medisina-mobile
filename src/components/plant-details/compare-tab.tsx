/**
 * components/plant-details/CompareTab.tsx
 *
 * Renders the "Compare" sub-tab on the plant detail screen.
 *
 * Two responsibilities:
 *  1. Displays look-alike plants (pre-fetched by [id].tsx via getPlantsByIds)
 *     as tappable cards — tapping one navigates directly to comparison.tsx
 *     with that pair pre-loaded.
 *  2. "Select from Library" CTA — opens comparison.tsx in pick mode so the
 *     user can choose any plant for a 1v1 comparison.
 *
 * This component is purely presentational — all fetching happens in [id].tsx.
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageErrorEventData,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PlantSummary } from "../../services/firebaseLibrary";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface CompareTabProps {
  /** The current plant being viewed — always the "left" side of any comparison. */
  currentPlantId: string;
  currentPlantName: string;
  /**
   * Look-alike plants pre-fetched by the parent screen.
   * Empty array is a valid state — shows the "no look-alikes" empty state.
   */
  lookAlikePlants: PlantSummary[];
  /** True while the parent is fetching look-alikes. Shows a skeleton. */
  isLoadingLookAlikes?: boolean;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function LookAlikeCard({
  plant,
  onPress,
}: {
  plant: PlantSummary;
  onPress: () => void;
}) {
  const [imgError, setImgError] = React.useState(false);

  if (!plant?.id) return null;

  const handleImageError = (_: NativeSyntheticEvent<ImageErrorEventData>) => {
    setImgError(true);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Compare with ${plant.name}`}
      className="mr-3"
    >
      <View
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden w-36"
        style={
          Platform.OS === "ios"
            ? {
                shadowColor: "#000",
                shadowOpacity: 0.07,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              }
            : { elevation: 2 }
        }
      >
        {/* Image */}
        <Image
          source={
            !imgError && plant.imageUrl
              ? { uri: plant.imageUrl }
              : PLACEHOLDER_IMAGE
          }
          className="w-full h-28"
          resizeMode="cover"
          onError={handleImageError}
          accessibilityLabel={`Image of ${plant.name}`}
        />

        {/* Info */}
        <View className="px-2.5 py-2">
          <Text
            className="text-gray-900 text-xs font-semibold"
            numberOfLines={1}
          >
            {plant.name}
          </Text>
          <Text
            className="text-gray-400 text-xs italic mt-0.5"
            numberOfLines={1}
          >
            {plant.scientificName}
          </Text>
        </View>

        {/* Compare CTA chip */}
        <View className="flex-row items-center justify-center bg-green-50 py-1.5 border-t border-green-100">
          <Ionicons name="git-compare-outline" size={11} color="#15803d" />
          <Text className="text-green-700 text-xs font-medium ml-1">
            Compare
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LookAlikeSkeletonCard() {
  return (
    <View
      className="bg-gray-100 rounded-2xl w-36 h-44 mr-3"
      accessibilityElementsHidden
    />
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function CompareTab({
  currentPlantId,
  currentPlantName,
  lookAlikePlants,
  isLoadingLookAlikes = false,
}: CompareTabProps) {
  const router = useRouter();

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!currentPlantId) {
    console.warn(
      "[CompareTab] currentPlantId is required but was not provided.",
    );
    return null;
  }

  const safeLookAlikes = Array.isArray(lookAlikePlants)
    ? lookAlikePlants.filter((p) => p?.id && p.id !== currentPlantId)
    : [];

  // ── Navigation helpers ────────────────────────────────────────────────────

  /**
   * Navigate to the comparison page with a pre-selected pair.
   * Passes both IDs as query params; comparison.tsx reads them on mount.
   */
  const handleCompareWith = (targetPlant: PlantSummary) => {
    try {
      router.push({
        pathname: "/(tabs)/library/comparison",
        params: {
          plantAId: currentPlantId,
          plantBId: targetPlant.id,
        },
      });
    } catch (err) {
      console.error(
        `[CompareTab] Navigation to comparison failed (${currentPlantId} vs ${targetPlant.id}):`,
        err,
      );
    }
  };

  /**
   * Navigate to comparison in "pick mode" — plantA is pre-set,
   * plantB is selected by the user from the library picker in comparison.tsx.
   */
  const handleSelectFromLibrary = () => {
    try {
      router.push({
        pathname: "/library/comparison",
        params: {
          plantAId: currentPlantId,
          pickMode: "true", // comparison.tsx opens the library sheet for plantB
        },
      });
    } catch (err) {
      console.error("[CompareTab] Navigation to pick mode failed:", err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Section: Look-alikes ───────────────────────────────────────────── */}
      <View className="mb-6">
        <View className="flex-row items-center mb-3">
          <View className="bg-green-100 rounded-lg p-1.5 mr-2">
            <Ionicons name="copy-outline" size={16} color="#15803d" />
          </View>
          <Text className="text-gray-800 font-semibold text-sm uppercase tracking-wide">
            Look-alike Plants
          </Text>
        </View>

        {isLoadingLookAlikes ? (
          // Skeleton row
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((i) => (
              <LookAlikeSkeletonCard key={i} />
            ))}
          </ScrollView>
        ) : safeLookAlikes.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {safeLookAlikes.map((plant) => (
              <LookAlikeCard
                key={plant.id}
                plant={plant}
                onPress={() => handleCompareWith(plant)}
              />
            ))}
          </ScrollView>
        ) : (
          // Empty state
          <View className="bg-gray-50 rounded-2xl px-4 py-6 items-center">
            <Ionicons name="leaf-outline" size={28} color="#D1D5DB" />
            <Text className="text-gray-400 text-sm text-center mt-2">
              No look-alike plants found for {currentPlantName}.
            </Text>
          </View>
        )}
      </View>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-gray-100" />
        <Text className="text-gray-400 text-xs px-3">or</Text>
        <View className="flex-1 h-px bg-gray-100" />
      </View>

      {/* ── CTA: Select from Library ───────────────────────────────────────── */}
      <View className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <Text className="text-green-900 font-semibold text-sm mb-1">
          Compare with any plant
        </Text>
        <Text className="text-green-700 text-xs leading-5 mb-4">
          Browse the full library and select any plant to compare its physical
          traits side-by-side with {currentPlantName}.
        </Text>

        <TouchableOpacity
          onPress={handleSelectFromLibrary}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Select a plant from the library to compare"
        >
          <View className="bg-green-700 rounded-xl py-3 flex-row items-center justify-center">
            <Ionicons
              name="git-compare-outline"
              size={16}
              color="#ffffff"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-semibold text-sm">
              Select Plant from Library
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
