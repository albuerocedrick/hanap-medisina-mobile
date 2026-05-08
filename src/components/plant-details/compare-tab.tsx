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

import { useColorScheme } from "nativewind";
import { StyleSheet } from "react-native";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

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
      style={{ marginRight: 12 }}
    >
      <View
        style={{
          width: 144,
          backgroundColor: "transparent",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.5)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Image */}
        <Image
          source={
            !imgError && plant.imageUrl
              ? { uri: plant.imageUrl }
              : PLACEHOLDER_IMAGE
          }
          style={{ width: "100%", height: 112 }}
          resizeMode="cover"
          onError={handleImageError}
          accessibilityLabel={`Image of ${plant.name}`}
        />

        {/* Info */}
        <View style={{ paddingHorizontal: 10, paddingVertical: 8, backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)" }}>
          <Text
            style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 13 }}
            numberOfLines={1}
          >
            {plant.name}
          </Text>
          <Text
            style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 11, fontStyle: "italic", marginTop: 2 }}
            numberOfLines={1}
          >
            {plant.scientificName}
          </Text>
        </View>

        {/* Compare CTA chip */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 6, backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.2)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.3)" }}>
          <Ionicons name="git-compare-outline" size={11} color={isDark ? "#A2CFA3" : "#22451C"} />
          <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#A2CFA3" : "#22451C", fontSize: 11, marginLeft: 4 }}>
            Compare
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LookAlikeSkeletonCard() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        width: 144, height: 176, marginRight: 12, borderRadius: 16,
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(162,207,163,0.1)",
      }}
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

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
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Section: Look-alikes ───────────────────────────────────────────── */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.2)", borderRadius: 8, padding: 6, marginRight: 8 }}>
            <Ionicons name="copy-outline" size={16} color={isDark ? "#A2CFA3" : "#22451C"} />
          </View>
          <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
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
          <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(34,69,28,0.03)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 24, alignItems: "center" }}>
            <Ionicons name="leaf-outline" size={28} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"} />
            <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 13, textAlign: "center", marginTop: 8 }}>
              No look-alike plants found for {currentPlantName}.
            </Text>
          </View>
        )}
      </View>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }} />
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.4)", fontSize: 12, paddingHorizontal: 12 }}>or</Text>
        <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }} />
      </View>

      {/* ── CTA: Select from Library ───────────────────────────────────────── */}
      <View style={{ backgroundColor: isDark ? "rgba(162,207,163,0.05)" : "rgba(162,207,163,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(162,207,163,0.2)" : "rgba(162,207,163,0.4)", borderRadius: 16, padding: 16 }}>
        <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#A2CFA3" : "#22451C", fontSize: 14, marginBottom: 4 }}>
          Compare with any plant
        </Text>
        <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.7)" : "#334155", fontSize: 12, lineHeight: 18, marginBottom: 16 }}>
          Browse the full library and select any plant to compare its physical
          traits side-by-side with {currentPlantName}.
        </Text>

        <TouchableOpacity
          onPress={handleSelectFromLibrary}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Select a plant from the library to compare"
        >
          <View style={{ backgroundColor: isDark ? "rgba(162,207,163,0.2)" : "rgba(34,69,28,0.85)", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Ionicons
              name="git-compare-outline"
              size={16}
              color={isDark ? "#A2CFA3" : "#ffffff"}
              style={{ marginRight: 8 }}
            />
            <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#A2CFA3" : "#ffffff", fontSize: 13 }}>
              Select Plant from Library
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
