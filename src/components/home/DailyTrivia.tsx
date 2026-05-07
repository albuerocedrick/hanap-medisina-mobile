import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { selectIsLoadingFeed, useFeedStore } from "../../store/useFeedStore";
import { SkeletonTriviaCard } from "./HomeSkeletons";
import { useColorScheme } from "nativewind";

export function DailyTrivia() {
  const getTodayTrivia = useFeedStore((s) => s.getTodayTrivia);
  const isLoadingFeed = useFeedStore(selectIsLoadingFeed);
  const trivia = getTodayTrivia();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  if (trivia === null && isLoadingFeed) return <View className="px-6 mb-8"><SkeletonTriviaCard /></View>;
  if (trivia === null) return null;

  return (
    <View className="px-6 mb-8">
      <Text
        className="text-[#22451C] dark:text-[#EAF3D5] mb-3"
        style={{ fontSize: 22, fontFamily: "serif", fontStyle: "italic", fontWeight: "500", letterSpacing: 0.4 }}
      >
        Daily Trivia
      </Text>

      <View className="bg-[#FAFEEF] dark:bg-white/5 border border-[#A2CFA3]/35 dark:border-white/10 rounded-[24px] p-4">
        <View className="flex-row items-center">
          <View style={{ width: 24, marginRight: 10, alignItems: "center", justifyContent: "center" }}>
            <Feather
              name="book-open"
              size={19}
              color={isDark ? "rgba(248,250,252,0.72)" : "#4D8035"}
            />
          </View>
          <Text className="flex-1 text-[#4D8035] dark:text-white/72 text-[13px] leading-[20px]">
            {trivia.text}
          </Text>
        </View>
      </View>
    </View>
  );
}