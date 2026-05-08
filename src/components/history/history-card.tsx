import { ScanHistoryItem } from "@/src/services/firebaseHistory";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  item: ScanHistoryItem;
  onPress: (item: ScanHistoryItem) => void;
}

export const HistoryCard: React.FC<Props> = ({ item, onPress }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isPending = item.status === "pending";

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // FIX FOR PROBLEM 3 & 4: Correct Confidence Math
  const rawConf = item.confidence;
  const confPct = rawConf <= 1 ? rawConf * 100 : rawConf;
  
  // Format to 2 decimal places (e.g., 99.99%) and cap width at 100%
  const displayConf = Number(confPct.toFixed(2));
  const barWidth = Math.min(Math.max(displayConf, 0), 100);

  // Dynamic colors for confidence
  const getConfHex = (val: number) => {
    if (val >= 80) return "#16a34a"; // green-600
    if (val >= 50) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
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

  return (
    <AnimatedTouchable
      activeOpacity={0.85}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => onPress(item)}
      style={[
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
          borderColor: isPending 
            ? (isDark ? "rgba(245, 158, 11, 0.4)" : "#fde68a") // amber
            : (isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.55)"), // standard green-tint
          borderWidth: 1,
        },
        animStyle
      ]}
      className="mx-4 my-2 p-3 flex-row gap-4 rounded-2xl shadow-sm"
    >
      {/* Thumbnail */}
      <View 
        style={{
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)",
          borderWidth: 1,
        }}
        className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden relative"
      >
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
          <Text 
            style={{
              color: isDark ? "rgba(248,250,252,0.9)" : "#22451C",
              fontFamily: "Quicksand_700Bold",
            }}
            className="flex-1 text-base" 
            numberOfLines={1}
          >
            {item.plantName}
          </Text>

          {isPending ? (
            <View 
              style={{
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb",
                borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1 px-2 py-1 rounded-full"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <Text 
                style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#fbbf24" : "#d97706" }}
                className="text-[10px] tracking-wide uppercase"
              >
                Pending
              </Text>
            </View>
          ) : (
            <View 
              style={{
                backgroundColor: isDark ? "rgba(22, 163, 74, 0.15)" : "#f0fdf4",
                borderColor: isDark ? "rgba(22, 163, 74, 0.3)" : "#bbf7d0",
                borderWidth: 1,
              }}
              className="flex-row items-center gap-1 px-2 py-1 rounded-full"
            >
              <Feather name="check" size={10} color={isDark ? "#4ade80" : "#16a34a"} />
              <Text 
                style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#4ade80" : "#15803d" }}
                className="text-[10px] tracking-wide uppercase"
              >
                Synced
              </Text>
            </View>
          )}
        </View>

        <View className="mt-1">
          <View className="flex-row justify-between mb-1.5">
            <Text 
              style={{
                color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.55)",
                fontFamily: "Quicksand_600SemiBold",
              }}
              className="text-xs"
            >
              Confidence
            </Text>
            <Text 
              style={{
                color: getConfHex(displayConf),
                fontFamily: "Quicksand_700Bold",
              }}
              className="text-xs"
            >
              {displayConf}%
            </Text>
          </View>
          <View 
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.3)" }}
            className="h-1.5 rounded-full overflow-hidden"
          >
            <View
              className="h-full rounded-full"
              style={{ width: `${barWidth}%`, backgroundColor: getConfHex(displayConf) }}
            />
          </View>
        </View>

        <Text 
          style={{
            color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.45)",
            fontFamily: "Quicksand_500Medium",
          }}
          className="mt-2 text-[11px]"
        >
          {relativeTime(item.createdAt)}
        </Text>
      </View>
    </AnimatedTouchable>
  );
};