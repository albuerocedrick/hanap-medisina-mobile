import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

// Components
import { CompareTab } from "../../../src/components/plant-details/compare-tab";
import { DetailsTab } from "../../../src/components/plant-details/details-tab";
import { ResearchTab } from "../../../src/components/plant-details/research-tab";

// Services & Store
import {
  FirebaseLibraryError,
  Plant,
  PlantSummary,
  getPlantById,
  getPlantsByIds,
} from "../../../src/services/firebaseLibrary";
import { useLibraryStore } from "../../../src/store/useLibraryStore";
import {
  selectIsOnline,
  useNetworkStore,
} from "../../../src/store/useNetworkStore";

// ─────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────

type TabKey = "details" | "research" | "compare";

const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

export default function PlantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ─── Global State ────────────────────────────────────────────────────────
  const isOnline = useNetworkStore(selectIsOnline);
  const isFavorite = useLibraryStore((s) => s.isFavorite(id as string));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const favorites = useLibraryStore((s) => s.favorites);
  // Phase 6: persisted summary list for partial offline fallback
  const cachedPlants = useLibraryStore((s) => s.plants);

  // ─── Local State ─────────────────────────────────────────────────────────
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [imageError, setImageError] = useState<boolean>(false);
  // Phase 6: True when showing partial data from the cached summary list
  // (offline + not in favorites). Research and Compare tabs are hidden.
  const [isPartialOffline, setIsPartialOffline] = useState<boolean>(false);

  // Look-alikes State
  const [lookAlikes, setLookAlikes] = useState<PlantSummary[]>([]);
  const [isLoadingLookAlikes, setIsLoadingLookAlikes] = useState<boolean>(true);

  // ─── Data Fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadPlantData() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      let fetchedPlant: Plant | null = null;

      try {
        if (isOnline) {
          fetchedPlant = await getPlantById(id);
          setIsPartialOffline(false);
        } else {
          // Offline: try favorites first (full Plant object)
          fetchedPlant = favorites.find((f) => f.id === id) || null;

          if (fetchedPlant) {
            setIsPartialOffline(false);
          } else {
            // Phase 6: fall back to the persisted plants summary list.
            // Build a minimal Plant object so the image + name + categories
            // still render. Research and Compare tabs are hidden in this mode.
            const summary = cachedPlants.find((p) => p.id === id);
            if (summary) {
              fetchedPlant = {
                ...summary,
                lookAlikeIds: [],
                details: { localName: "", preparation: [], facts: {}, warnings: [] },
                research: [],
                comparisonTraits: { leaf: "", flower: "", stem: "", smell: "" },
              };
              setIsPartialOffline(true);
            } else if (isMounted) {
              setError(
                "This plant is not available offline. Connect to the internet to view its details.",
              );
            }
          }
        }
        if (isMounted && fetchedPlant) setPlant(fetchedPlant);
      } catch (err) {
        if (isMounted) {
          if (err instanceof FirebaseLibraryError && err.code === "NOT_FOUND") {
            setError("Plant not found in the database.");
          } else {
            setError("Failed to load plant details. Please try again.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }

      // --- Fetch Look-alikes based on the new lookAlikeIds array ---
      if (fetchedPlant && isMounted) {
        setIsLoadingLookAlikes(true);
        try {
          const lookAlikeIds = fetchedPlant.lookAlikeIds || [];

          if (lookAlikeIds.length > 0) {
            if (isOnline) {
              // Online: Fetch specific look-alike documents directly
              const related = await getPlantsByIds(lookAlikeIds);
              if (isMounted) setLookAlikes(related);
            } else {
              // Offline: Filter locally saved favorites that match the IDs
              const related = favorites.filter((f) =>
                lookAlikeIds.includes(f.id),
              );
              if (isMounted) setLookAlikes(related);
            }
          } else {
            // Plant has no look-alikes configured
            if (isMounted) setLookAlikes([]);
          }
        } catch (err) {
          console.warn("[PlantDetailsScreen] Failed to load look-alikes:", err);
          if (isMounted) setLookAlikes([]);
        } finally {
          if (isMounted) setIsLoadingLookAlikes(false);
        }
      }
    }

    loadPlantData();
    return () => {
      isMounted = false;
    };
  }, [id, isOnline, favorites]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleToggleFavorite = async () => {
    if (!plant) return;
    try {
      await toggleFavorite(plant);
    } catch (err) {
      console.error("[PlantDetailsScreen] toggleFavorite failed:", err);
    }
  };

  // ─── Rendering Helpers ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-gray-500 mt-4 font-medium">
          Loading details...
        </Text>
      </View>
    );
  }

  if (error || !plant) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
          <Ionicons
            name={isOnline ? "alert-circle-outline" : "cloud-offline-outline"}
            size={32}
            color="#dc2626"
          />
        </View>
        <Text className="text-gray-900 font-semibold text-lg text-center">
          Oops!
        </Text>
        <Text className="text-gray-500 mt-2 text-center mb-6">{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-gray-100 px-6 py-3 rounded-xl active:bg-gray-200"
        >
          <Text className="text-gray-700 font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── Fixed Header Nav (Floating over image) ───────────────────────── */}
      <View
        style={{
          position: "absolute", top: Math.max(insets.top, 20) + 10, left: 16, right: 16,
          zIndex: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center"
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)", borderWidth: require("react-native").StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.2)"
          }}
          accessibilityLabel="Go Back"
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={{
            width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)", borderWidth: require("react-native").StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.2)"
          }}
          accessibilityLabel={
            isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#A2CFA3" : "white"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        {/* ─── Image Hero Section ─────────────────────────────────────────── */}
        <View style={{ width: "100%", height: 320, backgroundColor: isDark ? "#121A14" : "#EEF5E9" }}>
          <Image
            source={
              !imageError && plant.imageUrl
                ? { uri: plant.imageUrl }
                : PLACEHOLDER_IMAGE
            }
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>

        {/* ─── Plant Header Info ───────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}>
          <Text 
            style={{
              fontSize: 32, fontFamily: "serif", fontStyle: "italic", fontWeight: "600",
              color: isDark ? "#F8FAFC" : "#22451C", lineHeight: 38
            }}
          >
            {plant.name}
          </Text>
          <Text 
            style={{
              fontSize: 15, fontFamily: "serif", fontStyle: "italic",
              color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.7)", marginTop: 4
            }}
          >
            {plant.scientificName}
          </Text>

          {/* Phase 6: Partial offline banner */}
          {isPartialOffline && (
            <View style={{
              marginTop: 16, backgroundColor: isDark ? "rgba(217,119,6,0.1)" : "#FFFBEB",
              borderWidth: require("react-native").StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(217,119,6,0.3)" : "#FDE68A",
              borderRadius: 12, flexDirection: "row", alignItems: "center", padding: 12
            }}>
              <Ionicons name="archive-outline" size={16} color={isDark ? "#FBBF24" : "#D97706"} />
              <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 12, color: isDark ? "#FDE68A" : "#B45309", marginLeft: 8, flex: 1 }}>
                Offline — showing basic info only. Connect to see full details.
              </Text>
            </View>
          )}

          {/* Categories */}
          {plant.categories?.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16, gap: 8 }}>
              {plant.categories.map((cat) => (
                <View
                  key={cat}
                  style={{
                    backgroundColor: "transparent",
                    borderWidth: require("react-native").StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(162,207,163,0.8)",
                    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4
                  }}
                >
                  <Text style={{ fontFamily: "Quicksand_600SemiBold", fontSize: 12, color: isDark ? "rgba(248,250,252,0.8)" : "#22451C" }}>
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Sub-Tabs Navigation ────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: require("react-native").StyleSheet.hairlineWidth, borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }}>
          {(isPartialOffline
            ? (["details"] as TabKey[])
            : (["details", "research", "compare"] as TabKey[])
          ).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1, paddingVertical: 14, alignItems: "center",
                  borderBottomWidth: isActive ? 2 : 0, borderBottomColor: isActive ? (isDark ? "#A2CFA3" : "#22451C") : "transparent"
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={{
                    fontFamily: "Quicksand_700Bold", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5,
                    color: isActive ? (isDark ? "#A2CFA3" : "#22451C") : (isDark ? "rgba(255,255,255,0.4)" : "rgba(34,69,28,0.5)")
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Tab Content ────────────────────────────────────────────────── */}
        <View style={{ flex: 1, minHeight: 400 }}>
          {activeTab === "details" && (
            <DetailsTab
              localName={plant.details?.localName ?? ""}
              details={plant.details}
            />
          )}

          {activeTab === "research" && (
            <ResearchTab research={plant.research ?? []} />
          )}

          {activeTab === "compare" && (
            <CompareTab
              currentPlantId={plant.id}
              currentPlantName={plant.name}
              lookAlikePlants={lookAlikes}
              isLoadingLookAlikes={isLoadingLookAlikes}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
