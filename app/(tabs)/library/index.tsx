import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Components
import { ScanDetailSheet } from "../../../src/components/history/scan-detail-sheet";
import { FilterPills } from "../../../src/components/library/filter-pills";
import { PlantCard } from "../../../src/components/library/plant-card";
import { SearchBar } from "../../../src/components/library/search-bar";

// Stores
import { useLibraryStore } from "../../../src/store/useLibraryStore";
import {
  selectIsOnline,
  useNetworkStore,
} from "../../../src/store/useNetworkStore";

export default function LibraryFeed() {
  // ─── Route Params ────────────────────────────────────────────────────────
  const params = useLocalSearchParams();
  const scanIdFromParams = params?.scanId as string | undefined;
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // Auto-open modal if scanId is passed from home screen
  useEffect(() => {
    if (scanIdFromParams) {
      setSelectedScanId(scanIdFromParams);
    }
  }, [scanIdFromParams]);

  // ─── Global State Subscriptions ──────────────────────────────────────────
  const isOnline = useNetworkStore(selectIsOnline);

  const plants = useLibraryStore((s) => s.plants);
  const favorites = useLibraryStore((s) => s.favorites);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const activeCategory = useLibraryStore((s) => s.activeCategory);

  const isLoadingPlants = useLibraryStore((s) => s.isLoadingPlants);
  const plantsError = useLibraryStore((s) => s.plantsError);

  // Actions
  const fetchPlants = useLibraryStore((s) => s.fetchPlants);
  const fetchPlantsByActiveCategory = useLibraryStore(
    (s) => s.fetchPlantsByActiveCategory,
  );
  const clearErrors = useLibraryStore((s) => s.clearErrors);
  const getDisplayedPlants = useLibraryStore((s) => s.getDisplayedPlants);

  const displayedPlants = getDisplayedPlants();

  // ─── Lifecycles & Handlers ───────────────────────────────────────────────
  useEffect(() => {
    if (isOnline && plants.length === 0) {
      fetchPlantsByActiveCategory();
    }
  }, [isOnline]);

  const handleRefresh = useCallback(() => {
    if (!isOnline) return;
    clearErrors();
    fetchPlantsByActiveCategory();
  }, [isOnline, fetchPlantsByActiveCategory, clearErrors]);

  const handleRetry = () => {
    clearErrors();
    fetchPlantsByActiveCategory();
  };

  // ─── Render Sub-components ───────────────────────────────────────────────

  const renderEmptyState = () => {
    if (isLoadingPlants && displayedPlants.length === 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="text-gray-500 mt-4 text-center font-medium">
            Loading plant library... test lang
          </Text>
        </View>
      );
    }

    if (plantsError) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#dc2626" />
          </View>
          <Text className="text-gray-900 font-semibold text-lg text-center">
            Failed to Load Library
          </Text>
          <Text className="text-gray-500 mt-2 text-center mb-6">
            {plantsError.message}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            className="bg-green-600 px-6 py-3 rounded-xl active:bg-green-700"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!isOnline && favorites.length === 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="cloud-offline-outline" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 font-semibold text-lg text-center">
            No Offline Plants
          </Text>
          <Text className="text-gray-500 mt-2 text-center">
            You haven't saved any plants to your favorites yet. Reconnect to the
            internet to browse the full library.
          </Text>
        </View>
      );
    }

    if (searchQuery.length > 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="search-outline" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 font-semibold text-lg text-center">
            No matching plants
          </Text>
          <Text className="text-gray-500 mt-2 text-center">
            We couldn't find anything matching "{searchQuery}". Try adjusting
            your search or category filter.
          </Text>
        </View>
      );
    }

    if (activeCategory) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="leaf-outline" size={32} color="#9CA3AF" />
          </View>
          <Text className="text-gray-900 font-semibold text-lg text-center">
            Category is empty
          </Text>
          <Text className="text-gray-500 mt-2 text-center">
            There are currently no plants available under the "{activeCategory}"
            category.
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View className="pb-2">
      <SearchBar />
      <FilterPills />

      {!isOnline && (
        <View className="mx-4 mt-2 mb-1 bg-amber-50 border border-amber-200 rounded-lg flex-row items-center p-3">
          <Ionicons name="warning-outline" size={20} color="#d97706" />
          <Text className="text-amber-800 ml-2 text-sm flex-1">
            Offline Mode: Showing only your saved plants. Connect to the
            internet for full access.
          </Text>
        </View>
      )}

      {displayedPlants.length > 0 && (
        <View className="mx-4 mt-2 mb-1 flex-row items-center justify-between">
          <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            {displayedPlants.length}{" "}
            {displayedPlants.length === 1 ? "Plant" : "Plants"} Found
          </Text>
        </View>
      )}
    </View>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      {/* Updated Navigation Header with Avatar Button UI */}
      <View className="px-6 py-4 bg-gray-50 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            activeOpacity={0.7}
            className="mr-3 bg-white overflow-hidden"
          >
            <Image
              source={require("../../../assets/images/library-mariherb.png")}
              style={{ width: 150, height: 150 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Library</Text>
        </View>
        <Ionicons name="library-outline" size={24} color="#16a34a" />
      </View>

      <FlatList
        data={displayedPlants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlantCard plant={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingPlants && displayedPlants.length > 0}
            onRefresh={handleRefresh}
            colors={["#16a34a"]}
            tintColor="#16a34a"
            enabled={isOnline}
          />
        }
      />

      {/* ── Scan Detail Modal ── */}
      <ScanDetailSheet
        visible={selectedScanId !== null}
        scanId={selectedScanId}
        onClose={() => setSelectedScanId(null)}
      />
    </SafeAreaView>
  );
}
