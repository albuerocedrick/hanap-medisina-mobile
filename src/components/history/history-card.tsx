import { ScanHistoryItem } from "@/src/services/firebaseHistory";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface Props {
  item: ScanHistoryItem;
  onPress: (item: ScanHistoryItem) => void;
}

export const HistoryCard: React.FC<Props> = ({ item, onPress }) => {
  const isPending = item.status === "pending";

  // FIX FOR PROBLEM 3 & 4: Correct Confidence Math
  // If confidence is already given out of 100 (e.g. 99.5), use it. 
  // If it's a decimal (e.g. 0.995), multiply by 100.
  const rawConf = item.confidence;
  const confPct = rawConf <= 1 ? rawConf * 100 : rawConf;
  
  // Format to 2 decimal places (e.g., 99.99%) and cap width at 100%
  const displayConf = Number(confPct.toFixed(2));
  const barWidth = Math.min(Math.max(displayConf, 0), 100);

  // Dynamic colors
  const getConfColor = (val: number) => {
    if (val >= 80) return "bg-green-500 text-green-600";
    if (val >= 50) return "bg-amber-500 text-amber-600";
    return "bg-red-500 text-red-600";
  };

  const getConfHex = (val: number) => {
    if (val >= 80) return "#22c55e";
    if (val >= 50) return "#f59e0b";
    return "#ef4444";
  };

  // FIX FOR PROBLEM 2: Accurate relative time handling
  const relativeTime = (ms: number) => {
    if (!ms) return "Unknown Date";
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  // Rule 9 Nesting: Outer container p-3 (12px), rounded-2xl (16px) -> Inner image rounded-md (6px).
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      className={`mx-4 my-2 p-3 flex-row gap-4 bg-white rounded-2xl border shadow-sm ${
        isPending ? "border-amber-200" : "border-[#e5e7eb]"
      }`}
    >
      {/* Thumbnail */}
      <View className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden relative">
        <Image
          source={{ uri: item.imageUri }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {isPending && (
          <View className="absolute inset-0 bg-amber-500/10" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 justify-between py-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-base font-semibold text-slate-900" numberOfLines={1}>
            {item.plantName}
          </Text>

          {isPending ? (
            <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <Text className="text-[10px] font-semibold text-amber-600 tracking-wide uppercase">
                Pending
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <Feather name="check" size={10} color="#16a34a" />
              <Text className="text-[10px] font-semibold text-green-700 tracking-wide uppercase">
                Synced
              </Text>
            </View>
          )}
        </View>

        <View className="mt-1">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-xs font-medium text-slate-500">Confidence</Text>
            <Text className={`text-xs font-bold ${getConfColor(displayConf).split(' ')[1]}`}>
              {displayConf}%
            </Text>
          </View>
          <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full`}
              style={{ width: `${barWidth}%`, backgroundColor: getConfHex(displayConf) }}
            />
          </View>
        </View>

        <Text className="mt-2 text-[11px] font-medium text-slate-400">
          {relativeTime(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};