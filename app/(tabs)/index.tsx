/**
 * app/(tabs)/index.tsx  —  Home Tab
 */

import { useColorScheme } from "nativewind"; 
import React, { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 🌟 Import your new transition wrapper
import { PageTransition } from "../../src/components/ui/PageTransition"; 

import { CategoryChips } from "../../src/components/home/CategoryChips";
import { DailyTrivia } from "../../src/components/home/DailyTrivia";
import { FeaturedPlants } from "../../src/components/home/FeaturedPlants";
import { HomeHeader } from "../../src/components/home/HomeHeader";
import { HomeSearchBar } from "../../src/components/home/HomeSearchBar";
import { MascotChatSlot } from "../../src/components/home/MascotChatSlot";
import { PlantOfTheDay } from "../../src/components/home/PlantOfTheDay";
import { RecentScans, RecentScansHandle } from "../../src/components/home/RecentScans";
import { ScanNowBanner } from "../../src/components/home/ScanNowBanner";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const recentScansRef = useRef<RecentScansHandle>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await recentScansRef.current?.refresh();
    } finally {
      setRefreshing(false);
    }
  },[]);

  return (
    // 🌟 Wrap the whole screen in PageTransition
    <PageTransition className="flex-1 bg-[#FAFEEF] dark:bg-[#0B120B]">
      <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}>
        
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? "rgba(162,207,163,0.75)" : "#4D8035"}
              colors={[isDark ? "rgba(162,207,163,0.75)" : "#4D8035"]}
            />
          }
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 24) + 120,
          }}
        >
          <HomeHeader />
          <HomeSearchBar onActiveChange={setIsSearchActive} />
          {!isSearchActive && (
            <>
              <CategoryChips />
              <MascotChatSlot />
              <ScanNowBanner />
              <PlantOfTheDay />
              <FeaturedPlants />
              <RecentScans ref={recentScansRef} />
              <DailyTrivia />
            </>
          )}
        </ScrollView>
      </View>
    </PageTransition>
  );
}