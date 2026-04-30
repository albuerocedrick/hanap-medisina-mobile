/**
 * src/components/profile/profile-menu-item.tsx
 * Reusable row item for profile settings actions.
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function ProfileMenuItem({ icon, label, onPress, destructive = false }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3.5 bg-white border-b border-slate-100"
    >
      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${destructive ? "bg-red-50" : "bg-slate-100"}`}>
        <Feather name={icon} size={16} color={destructive ? "#ef4444" : "#475569"} />
      </View>
      <Text className={`flex-1 text-sm font-medium ${destructive ? "text-red-500" : "text-slate-700"}`}>
        {label}
      </Text>
      {!destructive && <Feather name="chevron-right" size={16} color="#cbd5e1" />}
    </TouchableOpacity>
  );
}
