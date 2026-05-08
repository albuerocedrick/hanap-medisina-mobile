/**
 * src/components/history/history-header.tsx
 * Unified Scan History Header — HanapMedisina (Modern Theme Edition)
 */

import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export type StatusFilter = "all" | "synced" | "pending";
export type SortFilter = "newest" | "oldest";

export interface HistoryHeaderProps {
  totalCount: number;
  pendingCount: number;
  statusFilter: StatusFilter;
  sortFilter: SortFilter;
  onStatusChange: (status: StatusFilter) => void;
  onSortChange: () => void;
  isOffline?: boolean;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({
  totalCount,
  pendingCount,
  statusFilter,
  sortFilter,
  onStatusChange,
  onSortChange,
  isOffline = false,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  
  // ── Reusable Pill Component ───────────────────────────────────────────────
  const FilterPill = ({
    label,
    status,
    badge,
  }: {
    label: string;
    status: StatusFilter;
    badge?: number;
  }) => {
    const isActive = statusFilter === status;
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedTouchable
        onPressIn={() => {
          if (!isOffline || status === "pending") {
            scale.value = withSpring(0.92, { damping: 14, stiffness: 300 });
          }
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 300 });
        }}
        onPress={() => {
          // If offline, disable changing the filter (locked to pending)
          if (!isOffline) {
            onStatusChange(status);
          }
        }}
        activeOpacity={isOffline ? 1 : 0.8}
        style={[
          {
            height: 36,
            paddingHorizontal: 16,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isActive 
              ? (isDark ? "rgba(162,207,163,0.15)" : "#22451C") 
              : (isDark ? "rgba(255,255,255,0.04)" : "transparent"),
            borderColor: isActive 
              ? (isDark ? "rgba(162,207,163,0.8)" : "#22451C") 
              : (isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.8)"),
            borderWidth: StyleSheet.hairlineWidth,
          },
          animStyle
        ]}
        className="flex-row items-center"
      >
        <Text
          style={{
            color: isActive 
              ? (isDark ? "#A2CFA3" : "#FAFEEF") 
              : (isDark ? "rgba(248,250,252,0.7)" : "#22451C"),
            fontFamily: "Quicksand_600SemiBold",
            fontSize: 13,
          }}
        >
          {label}
        </Text>
        
        {/* Optional Badge for Unsynced Count */}
        {badge !== undefined && badge > 0 && (
          <View
            style={{
              backgroundColor: isActive ? (isDark ? "rgba(162,207,163,0.2)" : "#FAFEEF") : (isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)"),
              marginLeft: 8,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: isActive ? (isDark ? "#A2CFA3" : "#22451C") : (isDark ? "#fca5a5" : "#dc2626"),
                fontFamily: "Quicksand_700Bold",
                fontSize: 10,
              }}
            >
              {badge}
            </Text>
          </View>
        )}
      </AnimatedTouchable>
    );
  };

  // ── Animated Sort Button ───────────────────────────────────────────────
  const SortButton = () => {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedTouchable
        onPressIn={() => {
          scale.value = withSpring(0.86, { damping: 14, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 320 });
        }}
        onPress={onSortChange}
        activeOpacity={1}
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FAFEEF",
            borderWidth: 1, // Will use hairlineWidth in actual code if possible, but 1 is fine or we can import StyleSheet
            borderColor: isDark ? "rgba(255,255,255,0.14)" : "#A2CFA3",
          },
          animStyle
        ]}
      >
        <Feather
          name={sortFilter === "newest" ? "calendar" : "calendar"}
          size={16}
          color={isDark ? "rgba(226,232,240,0.85)" : "#22451C"}
          style={{ position: 'absolute' }}
        />
        <View style={{ 
          position: 'absolute', 
          bottom: 8, 
          right: 8, 
          backgroundColor: isDark ? "#0B120B" : "#FAFEEF", 
          borderRadius: 10,
          padding: 1 
        }}>
          <Feather
            name={sortFilter === "newest" ? "arrow-down" : "arrow-up"}
            size={10}
            color={isDark ? "rgba(248,250,252,0.9)" : "#4D8035"}
          />
        </View>
      </AnimatedTouchable>
    );
  };

  return (
    <View style={{ backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }} className="px-5 pt-5 pb-3">
      {/* ── Top Row: Title & Sort Button ────────────────────────────────────── */}
      <View className="flex-row items-center justify-between mb-1">
        <Text 
          style={{
            fontSize: 28,
            fontFamily: "serif",
            fontStyle: "italic",
            fontWeight: "500",
            letterSpacing: 0.3,
            color: isDark ? "#F8FAFC" : "#22451C",
          }}
        >
          Scan History
        </Text>
        
        <SortButton />
      </View>

      {/* ── Subtitle: Total Count ────────────────────────────────────────────── */}
      <Text 
        style={{
          color: isDark ? "rgba(248,250,252,0.45)" : "rgba(34,69,28,0.6)",
          fontFamily: "Quicksand_500Medium",
        }}
        className="text-sm mb-5"
      >
        {totalCount} {totalCount === 1 ? "Scan" : "Scans"} Total
      </Text>

      {/* ── Bottom Row: Filter Pills ─────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {/* If offline, hide the All and Synced pills completely */}
        {!isOffline && (
          <>
            <FilterPill label="All" status="all" />
            <FilterPill label="Synced" status="synced" />
          </>
        )}
        
        <FilterPill
          label={isOffline ? "Unsynced (Local)" : "Unsynced"}
          status="pending"
          badge={pendingCount}
        />
      </ScrollView>
    </View>
  );
}