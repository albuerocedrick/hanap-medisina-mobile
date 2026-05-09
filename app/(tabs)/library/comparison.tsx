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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

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
          style={{ flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF", paddingTop: Platform.OS === "ios" ? 0 : insets.top }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)" }}>
            <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 20, color: isDark ? "#F8FAFC" : "#22451C" }}>
              Select Plant to Compare
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsPickerOpen(false);
                if (!plantB) router.back(); // Auto-go back if they abort initial pick
              }}
            >
              <Ionicons name="close" size={24} color={isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)"} />
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
              <View style={{ paddingTop: 40, alignItems: "center" }}>
                <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)" }}>
                  No plants available to compare.
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    );
  };

  if (isLoading && !isPickerOpen) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF", alignItems: "center", justifyContent: "center" }}>
        <Stack.Screen options={{ headerTitle: "Comparing..." }} />
        <ActivityIndicator size="large" color={isDark ? "#A2CFA3" : "#22451C"} />
      </View>
    );
  }

  if (error || !plantA) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Stack.Screen options={{ headerTitle: "Error" }} />
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", marginTop: 16, textAlign: "center", marginBottom: 24 }}>
          {error || "Could not load comparison."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.05)", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)" }}
        >
          <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#F8FAFC" : "#22451C" }}>Go Back</Text>
        </TouchableOpacity>
        {renderPickerModal()}
      </View>
    );
  }

  // ─── Main Comparison Render ──────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}>
      <Stack.Screen
        options={{
          headerTitle: "Compare",
          headerTitleStyle: { color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "serif", fontStyle: "italic" as const, fontSize: 22, letterSpacing: 0.6 } as any,
          headerTintColor: "white",
          headerBackTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40, height: 40, borderRadius: 20,
                alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.3)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(255,255,255,0.2)",
                marginLeft: Platform.OS === "ios" ? 4 : 8,
                marginRight: 20,
              }}
              accessibilityLabel="Go Back"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: isDark ? "#0B120B" : "#FAFEEF" },
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* ─── Top: Side-by-Side Images ─────────────────────────────────────── */}
        <View style={{ flexDirection: "row", height: 256, width: "100%", backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(34,69,28,0.02)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)" }}>
          {/* Plant A (Left) */}
          <View style={{ flex: 1, position: "relative", borderRightWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)" }}>
            <Image
              source={
                plantA.imageUrl ? { uri: plantA.imageUrl } : PLACEHOLDER_IMAGE
              }
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(15, 35, 15, 0.6)', 'rgba(10, 25, 10, 0.95)']}
              locations={[0, 0.5, 1]}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 60, paddingBottom: 12, paddingHorizontal: 12 }}
            >
              <Text style={{ color: "white", fontFamily: "serif", fontStyle: "italic", fontSize: 16, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={2}>
                {plantA.name}
              </Text>
            </LinearGradient>
          </View>

          {/* Plant B (Right) */}
          <View style={{ flex: 1, position: "relative" }}>
            {plantB ? (
              <>
                <Image
                  source={
                    plantB.imageUrl
                      ? { uri: plantB.imageUrl }
                      : PLACEHOLDER_IMAGE
                  }
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                  <LinearGradient
                    colors={['transparent', 'rgba(15, 35, 15, 0.6)', 'rgba(10, 25, 10, 0.95)']}
                    locations={[0, 0.5, 1]}
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 60, paddingBottom: 12, paddingHorizontal: 12 }}
                  >
                    <Text style={{ color: "white", fontFamily: "serif", fontStyle: "italic", fontSize: 16, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={2}>
                      {plantB.name}
                    </Text>
                  </LinearGradient>
                  {/* Change Plant Button */}
                  <TouchableOpacity
                    onPress={() => setIsPickerOpen(true)}
                    style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.4)" }}
                  >
                    <Ionicons name="swap-horizontal" size={12} color="white" />
                    <Text style={{ color: "white", fontSize: 10, fontFamily: "Quicksand_700Bold", marginLeft: 4, textTransform: "uppercase" }}>
                      Change
                    </Text>
                  </TouchableOpacity>
              </>
            ) : (
              // Empty Slot State
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsPickerOpen(true)}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(34,69,28,0.02)" }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.05)", borderWidth: 1, borderStyle: "dashed", borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="add" size={28} color={isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)"} />
                </View>
                <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 13, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Select Plant
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Central "VS" Badge – simple translucent circle, no BlurView for perf */}
          <View
            style={{ position: "absolute", top: "50%", left: "50%", width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? "rgba(11,18,11,0.75)" : "rgba(250,254,239,0.85)", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)", alignItems: "center", justifyContent: "center", transform: [{ translateX: -22 }, { translateY: -22 }], shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}
          >
            <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#F8FAFC" : "#22451C", fontSize: 13 }}>VS</Text>
          </View>
        </View>

        {/* ─── Bottom: Physical Checklist ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 20, color: isDark ? "#F8FAFC" : "#22451C", marginBottom: 4 }}>
            Physical Checklist
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
            Compare key physical characteristics to help accurately identify the plant.
          </Text>

          {plantB ? (
            <PhysicalChecklistTable
              traitsA={plantA.comparisonTraits}
              traitsB={plantB.comparisonTraits}
              plantNameA={plantA.name}
              plantNameB={plantB.name}
            />
          ) : (
            <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(34,69,28,0.02)", borderRadius: 16, padding: 32, alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.05)" }}>
              <Ionicons name="git-compare-outline" size={36} color={isDark ? "rgba(248,250,252,0.3)" : "rgba(34,69,28,0.3)"} />
              <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", marginTop: 12, textAlign: "center" }}>
                Select a second plant to view the physical traits comparison.
              </Text>
              <TouchableOpacity
                onPress={() => setIsPickerOpen(true)}
                style={{ marginTop: 16, backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(34,69,28,0.1)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(162,207,163,0.3)" : "rgba(34,69,28,0.2)" }}
              >
                <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#A2CFA3" : "#22451C" }}>Choose Plant</Text>
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
