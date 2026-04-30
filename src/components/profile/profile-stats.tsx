/**
 * src/components/profile/profile-stats.tsx
 * Stat pill row (Total Scans + Member Since).
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface StatPillProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}

function StatPill({ icon, label, value }: StatPillProps) {
  return (
    <View className="flex-1 items-center bg-white border border-slate-100 rounded-2xl py-4 px-2 shadow-sm">
      <View className="w-9 h-9 bg-emerald-50 rounded-full items-center justify-center mb-2">
        <Feather name={icon} size={16} color="#16a34a" />
      </View>
      <Text className="text-xl font-extrabold text-slate-800">{value}</Text>
      <Text className="text-[11px] font-medium text-slate-400 mt-0.5 text-center">{label}</Text>
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
