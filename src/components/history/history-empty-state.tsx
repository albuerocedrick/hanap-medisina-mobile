import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { StatusFilter } from "./history-header";

export const HistoryEmptyState = ({ filter }: { filter: StatusFilter }) => {
  const isPending = filter === "pending";
  return (
    <View className="flex-1 items-center justify-center px-10 pt-20">
      <View className="mb-4 p-4 bg-slate-50 rounded-full border border-slate-200">
        {isPending ? (
          <Feather name="cloud-off" size={32} color="#94a3b8" />
        ) : (
          <Ionicons name="leaf-outline" size={32} color="#94a3b8" />
        )}
      </View>
      <Text className="text-lg font-bold text-slate-900 text-center mb-2">
        {isPending ? "All caught up" : "No history found"}
      </Text>
      <Text className="text-sm text-slate-500 text-center leading-relaxed">
        {isPending
          ? "You have no offline scans waiting to synchronize."
          : "Scans you perform will automatically appear here."}
      </Text>
    </View>
  );
};