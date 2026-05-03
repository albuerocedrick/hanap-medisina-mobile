/**
 * src/components/home/DailyTrivia.tsx
 *
 * Daily trivia fact card at the bottom of the Home Tab.
 * Rotates through 7 cached facts based on the day of the week —
 * no network call needed after the initial cache.
 *
 * Behaviour:
 *  - Calls useFeedStore.getTodayTrivia() to get today's fact.
 *  - Returns null (hides) if no trivia is available yet (not fetched).
 *  - Shows a skeleton while the feed is loading for the first time.
 *  - Works fully offline — weeklyTrivia is persisted by useFeedStore.
 *
 * Data sources (no props needed):
 *   useFeedStore → getTodayTrivia(), isLoadingFeed
 */

import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { selectIsLoadingFeed, useFeedStore } from "../../store/useFeedStore";
import { SkeletonTriviaCard } from "./HomeSkeletons";

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function DailyTrivia() {
  // ── Store subscriptions ──────────────────────────────────────────────────
  const getTodayTrivia = useFeedStore((s) => s.getTodayTrivia);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);

  const trivia = getTodayTrivia();

  // ── Loading state ─────────────────────────────────────────────────────────
  if (trivia === null && isLoadingFeed) {
    return (
      <View className="px-6 mb-6">
        <SkeletonTriviaCard />
      </View>
    );
  }

  // ── Empty state: hide if no trivia available ──────────────────────────────
  if (trivia === null) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="px-6 mb-6">
      <View className="bg-[#f0f7f1] border border-[#dce7df] rounded-[20px] p-4">
        <View className="flex-row items-start gap-3">
          {/* Icon */}
          <View className="w-9 h-9 bg-[#dce7df] rounded-full items-center justify-center mt-0.5">
            <Feather name="zap" size={16} color="#4a7553" />
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="text-[#243b27] font-bold text-[12px] mb-1 uppercase tracking-wide">
              Did You Know?
            </Text>
            <Text className="text-[#4a7553] text-[12px] font-medium leading-relaxed">
              {trivia.text}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
