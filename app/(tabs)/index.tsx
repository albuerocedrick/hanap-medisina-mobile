/**
 * app/(tabs)/index.tsx  —  Home Tab
 *
 * Phase 6 rewrite: This file is now a thin composition layer.
 * All state management and business logic has been moved to:
 *
 *   src/components/home/HomeHeader.tsx       → User avatar + network status
 *   src/components/home/HomeSearchBar.tsx    → Search input + suggestions dropdown
 *   src/components/home/CategoryChips.tsx    → Horizontal category filter chips
 *   src/components/home/PlantOfTheDay.tsx    → Hero card from useFeedStore
 *   src/components/home/ScanNowBanner.tsx    → Camera CTA card
 *   src/components/home/FeaturedPlants.tsx   → Horizontal featured plant scroll row
 *   src/components/home/RecentScans.tsx      → Merged offline + cloud scan list
 *   src/components/home/DailyTrivia.tsx      → Rotating daily trivia card
 *
 * Pull-to-refresh: The ScrollView's RefreshControl calls
 * recentScansRef.current.refresh() so only the scan list re-fetches.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryChips } from "../../src/components/home/CategoryChips";
import { DailyTrivia } from "../../src/components/home/DailyTrivia";
import { FeaturedPlants } from "../../src/components/home/FeaturedPlants";
import { HomeHeader } from "../../src/components/home/HomeHeader";
import { HomeSearchBar } from "../../src/components/home/HomeSearchBar";
import { PlantOfTheDay } from "../../src/components/home/PlantOfTheDay";
import {
  RecentScans,
  RecentScansHandle,
} from "../../src/components/home/RecentScans";
import { ScanNowBanner } from "../../src/components/home/ScanNowBanner";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // Ref to trigger the scan list refresh imperatively on pull-to-refresh.
  // Only the RecentScans component re-fetches — other sections read from
  // the persisted store cache which is already up-to-date.
  const recentScansRef = useRef<RecentScansHandle>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await recentScansRef.current?.refresh();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View
      className="flex-1 bg-[#f5f6f2]"
      style={{ paddingTop: insets.top }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f5f6f2"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4a7553"
            colors={["#4a7553"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 24) + 100,
        }}
      >
        <HomeHeader />
        <HomeSearchBar />
        <CategoryChips />
        <PlantOfTheDay />
        <ScanNowBanner />
        <FeaturedPlants />
        <RecentScans ref={recentScansRef} />
        <DailyTrivia />
      </ScrollView>
    </View>
  );
}
