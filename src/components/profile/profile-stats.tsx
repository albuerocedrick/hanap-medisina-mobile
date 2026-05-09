/**
 * src/components/profile/profile-stats.tsx
 * Stat pill row (Total Scans + Member Since).
 */
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatPillProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}

function StatPill({ icon, label, value }: StatPillProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-1 items-center py-2 px-2">
      <View 
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FAFEEF",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.8)",
          marginBottom: 8,
        }}
      >
        <Feather name={icon} size={15} color={isDark ? "rgba(248,250,252,0.85)" : "#22451C"} />
      </View>
      <Text 
        style={{ color: isDark ? "#F8FAFC" : "#22451C", fontFamily: "Quicksand_700Bold" }} 
        className="text-xl"
      >
        {value}
      </Text>
      <Text 
        style={{ color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontFamily: "Quicksand_600SemiBold" }} 
        className="text-[11px] mt-0.5 text-center"
      >
        {label}
      </Text>
    </View>
  );
}

interface Props {
  totalScans: number;
  memberSince: string; // e.g. "Feb 2026"
  loading: boolean;
}

export function ProfileStats({ totalScans, memberSince, loading }: Props) {
  return (
    <View className="flex-row gap-3 mx-6 mb-6">
      <StatPill
        icon="camera"
        label="Total Scans"
        value={loading ? "—" : String(totalScans)}
      />
      <StatPill
        icon="calendar"
        label="Member Since"
        value={loading ? "—" : memberSince}
      />
    </View>
  );
}
