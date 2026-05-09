import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🌟 IMPORT PAGE TRANSITION
import { PageTransition } from "@/src/components/ui/PageTransition";

// Components
import { ScanDetailSheet } from "@/src/components/history/scan-detail-sheet";
import { FilterPills } from "@/src/components/library/filter-pills";
import { PlantCard } from "@/src/components/library/plant-card";
import { SearchBar } from "@/src/components/library/search-bar";

// Stores
import { useLibraryStore } from "@/src/store/useLibraryStore";
import {
  selectIsOnline,
  useNetworkStore,
} from "@/src/store/useNetworkStore";

export default function LibraryFeed() {
  const params = useLocalSearchParams();
  const scanIdFromParams = params?.scanId as string | undefined;
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (scanIdFromParams) {
      setSelectedScanId(scanIdFromParams);
    }
  }, [scanIdFromParams]);

  const isOnline = useNetworkStore(selectIsOnline);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const plants = useLibraryStore((s) => s.plants);
  const favorites = useLibraryStore((s) => s.favorites);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const activeCategory = useLibraryStore((s) => s.activeCategory);

  const isLoadingPlants = useLibraryStore((s) => s.isLoadingPlants);
  const plantsError = useLibraryStore((s) => s.plantsError);

  const fetchPlants = useLibraryStore((s) => s.fetchPlants);
  const fetchPlantsByActiveCategory = useLibraryStore(
    (s) => s.fetchPlantsByActiveCategory,
  );
  const clearErrors = useLibraryStore((s) => s.clearErrors);
  const getDisplayedPlants = useLibraryStore((s) => s.getDisplayedPlants);

  const displayedPlants = getDisplayedPlants();

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

  const renderEmptyState = () => {
    if (isLoadingPlants && displayedPlants.length === 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <ActivityIndicator size="large" color={isDark ? "#A2CFA3" : "#22451C"} />
          <Text 
            style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_500Medium" }}
            className="mt-4 text-center"
          >
            Loading plant library...
          </Text>
        </View>
      );
    }

    if (plantsError) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="alert-circle-outline" size={28} color="#ef4444" />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            Failed to Load Library
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, marginBottom: 24 }}>
            {plantsError.message}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={{
              backgroundColor: isDark ? "#22451C" : "#A2CFA3",
              paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16
            }}
          >
            <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#F8FAFC" : "#22451C" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!isOnline && plants.length === 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.5)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="cloud-offline-outline" size={28} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            No Cached Plants Yet
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Connect to the internet once to download the plant library for offline use.
          </Text>
        </View>
      );
    }

    if (searchQuery.length > 0) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.5)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="search-outline" size={28} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            No matching plants
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            We couldn't find anything matching "{searchQuery}". Try adjusting your search or category filter.
          </Text>
        </View>
      );
    }

    if (activeCategory) {
      return (
        <View className="flex-1 items-center justify-center pt-20 px-6">
          <View 
            style={{ 
              width: 56, height: 56, borderRadius: 28, 
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.15)",
              borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(162,207,163,0.5)",
              alignItems: "center", justifyContent: "center", marginBottom: 16 
            }}
          >
            <Ionicons name="leaf-outline" size={28} color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"} />
          </View>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 22, color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}>
            Category is empty
          </Text>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)", textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            There are currently no plants available under the "{activeCategory}" category.
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View className="pb-2">
      {!isOnline && (
        <View 
          style={{
            backgroundColor: isDark ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.1)",
            borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)",
            borderWidth: StyleSheet.hairlineWidth,
          }}
          className="mx-6 mt-4 mb-2 rounded-2xl flex-row items-center p-3"
        >
          <Ionicons name="archive-outline" size={16} color={isDark ? "#93c5fd" : "#1d4ed8"} />
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "#93c5fd" : "#1d4ed8", fontSize: 13, marginLeft: 8, flex: 1 }}>
            Offline — showing cached library.
          </Text>
        </View>
      )}

      {displayedPlants.length > 0 && (
        <View className="mx-6 mt-4 mb-2 flex-row items-center justify-between">
          <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)", fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {displayedPlants.length} {displayedPlants.length === 1 ? "Plant" : "Plants"} Found
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <PageTransition className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-6 py-5 flex-row items-center justify-between">
          <Text 
            style={{
              fontSize: 28,
              fontFamily: "serif",
              fontStyle: "italic",
              fontWeight: "500",
              letterSpacing: 0.3,
              color: isDark ? "#F8FAFC" : "#22451C",
            }}
          >
            Library
          </Text>
        </View>

        <SearchBar onFocusChange={setIsSearchFocused} />
        <FilterPills />

        <View className="flex-1 relative">
          <FlatList
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
            data={displayedPlants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PlantCard plant={item} />}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingPlants && displayedPlants.length > 0}
                onRefresh={handleRefresh}
                colors={["#A2CFA3"]}
                tintColor={isDark ? "#A2CFA3" : "#22451C"}
                enabled={isOnline}
              />
            }
          />
          
          {isSearchFocused && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => Keyboard.dismiss()}
            />
          )}
        </View>

        <ScanDetailSheet
          visible={selectedScanId !== null}
          scanId={selectedScanId}
          onClose={() => setSelectedScanId(null)}
        />
      </SafeAreaView>
    </PageTransition>
  );
}