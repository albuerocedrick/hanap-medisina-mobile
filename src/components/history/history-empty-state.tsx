import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { Text, View } from "react-native";
import { StatusFilter } from "./history-header";

export const HistoryEmptyState = ({ filter }: { filter: StatusFilter }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isPending = filter === "pending";
  
  return (
    <View className="flex-1 items-center justify-center px-10 pt-20">
      <View 
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(162,207,163,0.15)",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)",
          borderWidth: 1,
        }}
        className="mb-4 p-4 rounded-full"
      >
        {isPending ? (
          <Feather name="cloud-off" size={32} color={isDark ? "rgba(248,250,252,0.4)" : "#A2CFA3"} />
        ) : (
          <Ionicons name="leaf-outline" size={32} color={isDark ? "rgba(248,250,252,0.4)" : "#A2CFA3"} />
        )}
      </View>
      <Text 
        style={{
          color: isDark ? "rgba(248,250,252,0.8)" : "#22451C",
          fontFamily: "Quicksand_700Bold",
        }}
        className="text-lg text-center mb-2"
      >
        {isPending ? "All caught up" : "No history found"}
      </Text>
      <Text 
        style={{
          color: isDark ? "rgba(248,250,252,0.45)" : "rgba(34,69,28,0.6)",
          fontFamily: "Quicksand_500Medium",
        }}
        className="text-sm text-center leading-relaxed"
      >
        {isPending
          ? "You have no offline scans waiting to synchronize."
          : "Scans you perform will automatically appear here."}
      </Text>
    </View>
  );
};