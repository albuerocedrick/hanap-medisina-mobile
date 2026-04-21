import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components
import { PhysicalChecklistTable } from "../../../src/components/comparison/physical-checklist";
import { PlantCard } from "../../../src/components/library/plant-card";
import { SearchBar } from "../../../src/components/library/search-bar";

// Services & Store
import { Plant, getPlantsByIds } from "../../../src/services/firebaseLibrary";
import { useLibraryStore } from "../../../src/store/useLibraryStore";
import {
  selectIsOnline,
  useNetworkStore,
} from "../../../src/store/useNetworkStore";

const PLACEHOLDER_IMAGE = require("../../../assets/images/plant-placeholder.jpg");

export default function PlantComparisonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Params from router (CompareTab passes these)
  const {
    plantAId,
    plantBId: initialPlantBId,
    pickMode,
  } = useLocalSearchParams<{
    plantAId: string;
    plantBId?: string;
    pickMode?: string;
  }>();

  // ─── Global State ────────────────────────────────────────────────────────
  const isOnline = useNetworkStore(selectIsOnline);
  const favorites = useLibraryStore((s) => s.favorites);
  const getDisplayedPlants = useLibraryStore((s) => s.getDisplayedPlants);

  // ─── Local State ─────────────────────────────────────────────────────────
  const [plantA, setPlantA] = useState<Plant | null>(null);
  const [plantB, setPlantB] = useState<Plant | null>(null);
  const [selectedPlantBId, setSelectedPlantBId] = useState<string | undefined>(
    initialPlantBId,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state for picking Plant B
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(
    pickMode === "true" || !initialPlantBId,
  );

  // ─── Data Fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadComparisonData() {
      if (!plantAId) {
        if (isMounted) setError("Primary plant missing for comparison.");
        return;
      }

      setIsLoading(true);
      setError(null);

      const idsToFetch = [plantAId];
      if (selectedPlantBId) idsToFetch.push(selectedPlantBId);

      try {
        if (isOnline) {
          // ONLINE: Fetch complete data for both plants
          const plants = await getPlantsByIds(idsToFetch);
          if (isMounted) {
            setPlantA(plants.find((p) => p.id === plantAId) || null);
            setPlantB(plants.find((p) => p.id === selectedPlantBId) || null);
          }
        } else {
          // OFFLINE: Read from cached favorites
          const offlineA = favorites.find((f) => f.id === plantAId) || null;
          const offlineB = selectedPlantBId
            ? favorites.find((f) => f.id === selectedPlantBId) || null
            : null;

          if (isMounted) {
            setPlantA(offlineA);
            setPlantB(offlineB);

            if (!offlineA) {
              setError("Plant A is not saved in favorites for offline access.");
            } else if (selectedPlantBId && !offlineB) {
              setError(
                "The selected comparison plant is not saved in favorites.",
              );
            }
          }
        }
      } catch (err) {
        if (isMounted) setError("Failed to load plant data. Please try again.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadComparisonData();

    return () => {
      isMounted = false;
    };
  }, [plantAId, selectedPlantBId, isOnline, favorites]);

  // ─── Render Helpers ──────────────────────────────────────────────────────

  // Plant B Picker Modal Content
  const renderPickerModal = () => {
    // Exclude Plant A from the choices so you don't compare a plant to itself
    const pickerData = getDisplayedPlants().filter((p) => p.id !== plantAId);

    return (
      <Modal
        visible={isPickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <View
          className="flex-1 bg-gray-50"
          style={{ paddingTop: Platform.OS === "ios" ? 0 : insets.top }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-800">
              Select Plant to Compare
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsPickerOpen(false);
                if (!plantB) router.back(); // Auto-go back if they abort initial pick
              }}
            >
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <SearchBar placeholder="Search library to compare..." />

          <FlatList
            data={pickerData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16 }}
            renderItem={({ item }) => (
              <PlantCard
                plant={item}
                hideFavoriteIndicator
                onPress={(selected) => {
                  setSelectedPlantBId(selected.id);
                  setIsPickerOpen(false);
                }}
              />
            )}
            ListEmptyComponent={
              <View className="pt-10 items-center">
                <Text className="text-gray-500">
                  No plants available to compare.
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    );
  };

  // ─── Loading & Error States ──────────────────────────────────────────────
  if (isLoading && !isPickerOpen) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ headerTitle: "Comparing..." }} />
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !plantA) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Stack.Screen options={{ headerTitle: "Error" }} />
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text className="text-gray-500 mt-4 text-center mb-6">
          {error || "Could not load comparison."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-gray-100 px-6 py-3 rounded-xl"
        >
          <Text className="text-gray-700 font-medium">Go Back</Text>
        </TouchableOpacity>
        {renderPickerModal()}
      </View>
    );
  }

  // ─── Main Comparison Render ──────────────────────────────────────────────
  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: "Compare",
          headerTitleStyle: { color: "#111827", fontWeight: "bold" },
          headerTintColor: "#16a34a",
          headerBackTitle: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#f9fafb" },
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ─── Top: Side-by-Side Images ─────────────────────────────────────── */}
        <View className="flex-row h-64 w-full bg-white border-b border-gray-200">
          {/* Plant A (Left) */}
          <View className="flex-1 relative border-r border-gray-200">
            <Image
              source={
                plantA.imageUrl ? { uri: plantA.imageUrl } : PLACEHOLDER_IMAGE
              }
              className="w-full h-full"
              resizeMode="cover"
            />
            {/* Gradient Dark Overlay for Text readability */}
            <View className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
            <Text
              className="absolute bottom-3 left-3 right-2 text-white font-bold text-sm"
              numberOfLines={2}
            >
              {plantA.name}
            </Text>
          </View>

          {/* Plant B (Right) */}
          <View className="flex-1 relative">
            {plantB ? (
              <>
                <Image
                  source={
                    plantB.imageUrl
                      ? { uri: plantB.imageUrl }
                      : PLACEHOLDER_IMAGE
                  }
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                <Text
                  className="absolute bottom-3 left-3 right-2 text-white font-bold text-sm"
                  numberOfLines={2}
                >
                  {plantB.name}
                </Text>
                {/* Change Plant Button */}
                <TouchableOpacity
                  onPress={() => setIsPickerOpen(true)}
                  className="absolute top-3 right-3 bg-white/20 backdrop-blur-md rounded-full px-2.5 py-1 flex-row items-center border border-white/40"
                >
                  <Ionicons name="swap-horizontal" size={12} color="white" />
                  <Text className="text-white text-xs font-semibold ml-1">
                    Change
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Empty Slot State
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsPickerOpen(true)}
                className="flex-1 items-center justify-center bg-gray-100"
              >
                <View className="bg-white rounded-full p-3 shadow-sm border border-gray-200">
                  <Ionicons name="add" size={24} color="#16a34a" />
                </View>
                <Text className="text-gray-500 font-medium text-xs mt-3">
                  Select Plant
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Central "VS" Badge */}
          <View
            className="absolute top-1/2 left-1/2 w-10 h-10 bg-white rounded-full border border-gray-200 shadow-md items-center justify-center"
            style={{ transform: [{ translateX: -20 }, { translateY: -20 }] }}
          >
            <Text className="text-green-700 font-extrabold text-xs">VS</Text>
          </View>
        </View>

        {/* ─── Bottom: Physical Checklist ─────────────────────────────────── */}
        <View className="px-4 pt-6 pb-2">
          <Text className="text-gray-800 font-bold text-lg mb-1">
            Physical Checklist
          </Text>
          <Text className="text-gray-500 text-sm mb-4 leading-5">
            Compare key physical characteristics to help accurately identify the
            plant.
          </Text>

          {plantB ? (
            <PhysicalChecklistTable
              traitsA={plantA.comparisonTraits}
              traitsB={plantB.comparisonTraits}
              plantNameA={plantA.name}
              plantNameB={plantB.name}
            />
          ) : (
            <View className="bg-white border border-gray-200 rounded-2xl py-10 items-center justify-center px-6">
              <Ionicons name="git-compare-outline" size={36} color="#D1D5DB" />
              <Text className="text-gray-500 font-medium mt-3 text-center">
                Select a second plant to view the physical traits comparison.
              </Text>
              <TouchableOpacity
                onPress={() => setIsPickerOpen(true)}
                className="mt-4 bg-green-600 px-5 py-2.5 rounded-xl"
              >
                <Text className="text-white font-semibold">Choose Plant</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Render the internal picker modal */}
      {renderPickerModal()}
    </View>
  );
}
