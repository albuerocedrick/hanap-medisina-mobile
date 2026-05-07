import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function ScanNowBanner() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="px-[22px] mb-6">
      <TouchableOpacity
        className="rounded-[24px] px-4 py-4 border"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FAFEEF",
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "#A2CFA3",
          shadowColor: isDark ? "#000" : "#22451C",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.2 : 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
        onPress={() => router.push("/(tabs)/scan")}
        activeOpacity={0.9}
      >
        <View className="flex-row items-center">
          <View
            className="w-[44px] h-[44px] rounded-[14px] items-center justify-center mr-3"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(77,128,53,0.1)",
            }}
          >
            <Feather name="camera" size={20} color={isDark ? "#F8FAFC" : "#22451C"} />
          </View>

          <View className="flex-1">
            <Text
              className="font-bold text-[15px] leading-tight"
              style={{ color: isDark ? "rgba(248,250,252,0.92)" : "#1E3A2F" }}
            >
              Scan a plant
            </Text>
            <Text
              className="text-[12px] mt-0.5"
              style={{ color: isDark ? "rgba(226,232,240,0.62)" : "#4D8035" }}
            >
              Identify species in seconds with AI
            </Text>
          </View>

          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(77,128,53,0.14)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(77,128,53,0.22)",
            }}
          >
            <Feather name="arrow-up-right" size={15} color={isDark ? "#F8FAFC" : "#22451C"} />
          </View>
        </View>

        <View
          className="mt-3 pt-3 flex-row items-center justify-between"
          style={{ borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(77,128,53,0.16)" }}
        >
          <Text
            className="text-[11px] font-medium tracking-[0.3px]"
            style={{ color: isDark ? "rgba(248,250,252,0.62)" : "rgba(34,69,28,0.62)" }}
          >
            Point camera at leaf for best results
          </Text>
          <Feather
            name="zap"
            size={13}
            color={isDark ? "rgba(248,250,252,0.72)" : "rgba(34,69,28,0.72)"}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}