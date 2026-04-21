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

  // ─── Global State ────────────────────────────────────────────────────────
  const isOnline = useNetworkStore(selectIsOnline);
  const isFavorite = useLibraryStore((s) => s.isFavorite(id as string));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const favorites = useLibraryStore((s) => s.favorites);

  // ─── Local State ─────────────────────────────────────────────────────────
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [imageError, setImageError] = useState<boolean>(false);

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
        } else {
          fetchedPlant = favorites.find((f) => f.id === id) || null;
          if (!fetchedPlant && isMounted) {
            setError(
              "This plant is not available offline. Please connect to the internet or save it to your favorites.",
            );
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
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── Fixed Header Nav (Floating over image) ───────────────────────── */}
      <View
        className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4"
        style={{ paddingTop: Math.max(insets.top, 20) + 10 }} // Safely handle notches
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
          accessibilityLabel="Go Back"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleFavorite}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
          accessibilityLabel={
            isFavorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? "#4ade80" : "white"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* ─── Image Hero Section ─────────────────────────────────────────── */}
        <View className="w-full h-72 bg-green-900">
          <Image
            source={
              !imageError && plant.imageUrl
                ? { uri: plant.imageUrl }
                : PLACEHOLDER_IMAGE
            }
            className="w-full h-full opacity-90"
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
          {/* Subtle gradient overlay at the bottom of the image */}
          <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent opacity-100" />
        </View>

        {/* ─── Plant Header Info ──────────────────────────────────────────── */}
        <View className="px-6 pt-4 pb-2 bg-gray-50">
          <Text className="text-3xl font-extrabold text-gray-900 leading-tight">
            {plant.name}
          </Text>
          <Text className="text-gray-500 italic text-base mt-1">
            {plant.scientificName}
          </Text>

          {/* Categories */}
          {plant.categories?.length > 0 && (
            <View className="flex-row flex-wrap mt-3 gap-2">
              {plant.categories.map((cat) => (
                <View
                  key={cat}
                  className="bg-green-100 border border-green-200 rounded-full px-3 py-1"
                >
                  <Text className="text-green-800 text-xs font-semibold">
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Sub-Tabs Navigation ────────────────────────────────────────── */}
        <View className="flex-row px-4 mt-4 border-b border-gray-200">
          {(["details", "research", "compare"] as TabKey[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 items-center border-b-2 ${
                  isActive ? "border-green-600" : "border-transparent"
                }`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  className={`text-sm font-semibold uppercase tracking-wider ${
                    isActive ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Tab Content ────────────────────────────────────────────────── */}
        <View className="flex-1 min-h-[400px]">
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
