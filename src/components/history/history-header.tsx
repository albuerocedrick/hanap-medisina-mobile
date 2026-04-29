/**
 * src/components/history/history-header.tsx
 * Unified Scan History Header — HanapMedisina
 */

import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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

    return (
      <TouchableOpacity
        onPress={() => {
          // If offline, disable changing the filter (locked to pending)
          if (!isOffline) {
            onStatusChange(status);
          }
        }}
        activeOpacity={isOffline ? 1 : 0.7} // Remove click effect if offline
        className={`flex-row items-center px-4 py-2 rounded-full border ${
          isActive
            ? "bg-[#16a34a] border-[#16a34a]"
            : "bg-white border-slate-200"
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            isActive ? "text-white" : "text-slate-600"
          }`}
        >
          {label}
        </Text>
        
        {/* Optional Badge for Unsynced Count */}
        {badge !== undefined && badge > 0 && (
          <View
            className={`ml-2 px-1.5 py-0.5 rounded-full ${
              isActive ? "bg-white" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                isActive ? "text-[#16a34a]" : "text-red-600"
              }`}
            >
              {badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="px-4 pt-4 pb-3 bg-[#f8fafc]">
      {/* ── Top Row: Title & Sort Button ────────────────────────────────────── */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-2xl font-bold text-slate-800">Scan History</Text>
        
        <TouchableOpacity
          onPress={onSortChange}
          className="flex-row items-center px-3 py-1.5 bg-slate-200/60 rounded-lg"
        >
          <Text className="text-xs font-semibold text-slate-600 mr-1.5">
            {sortFilter === "newest" ? "Newest First" : "Oldest First"}
          </Text>
          <Feather
            name={sortFilter === "newest" ? "arrow-down" : "arrow-up"}
            size={14}
            color="#475569"
          />
        </TouchableOpacity>
      </View>

      {/* ── Subtitle: Total Count ────────────────────────────────────────────── */}
      <Text className="text-sm text-slate-500 mb-4 font-medium">
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