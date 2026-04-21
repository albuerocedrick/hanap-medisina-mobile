/**
 * components/plant-details/ResearchTab.tsx
 *
 * Renders the "Research" sub-tab — maps the `research` array from Firestore.
 * Each item shows: title, summary, reference journal, and year.
 *
 * Empty and partial-data states are handled per-card so one malformed
 * research entry doesn't hide the rest.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { ResearchItem } from "../../services/firebaseLibrary";

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface ResearchTabProps {
  research: ResearchItem[];
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

interface ResearchCardProps {
  item: ResearchItem;
  index: number;
}

function ResearchCard({ item, index }: ResearchCardProps) {
  // Per-card guard: skip rendering if the entire item is unusable
  if (!item || typeof item !== "object") {
    console.warn(
      `[ResearchTab] Research item at index ${index} is invalid — skipping.`,
    );
    return null;
  }

  const title = item.title?.trim() || "Untitled Study";
  const summary = item.summary?.trim();
  const reference = item.reference?.trim();
  const year =
    typeof item.year === "number" && item.year > 0 ? item.year : null;

  return (
    <View className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4">
      {/* Card header */}
      <View className="bg-green-700 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="bg-white/20 rounded-lg p-1 mr-2">
            <Ionicons name="document-text-outline" size={14} color="#ffffff" />
          </View>
          <Text
            className="text-white font-semibold text-sm flex-1"
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        {year !== null && (
          <View className="bg-white/20 rounded-lg px-2 py-0.5 ml-2 flex-shrink-0">
            <Text className="text-white text-xs font-medium">{year}</Text>
          </View>
        )}
      </View>

      {/* Summary */}
      {summary ? (
        <View className="px-4 pt-3 pb-2">
          <Text className="text-gray-700 text-sm leading-6">{summary}</Text>
        </View>
      ) : (
        <View className="px-4 pt-3 pb-2">
          <Text className="text-gray-400 text-sm italic">
            No summary available.
          </Text>
        </View>
      )}

      {/* Reference */}
      {reference && (
        <View className="flex-row items-center px-4 pb-3 pt-1">
          <Ionicons
            name="library-outline"
            size={13}
            color="#6B7280"
            style={{ marginRight: 6 }}
          />
          <Text
            className="text-gray-500 text-xs italic flex-1"
            numberOfLines={2}
          >
            {reference}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function ResearchTab({ research }: ResearchTabProps) {
  // ── Guard ─────────────────────────────────────────────────────────────────
  const safeResearch = Array.isArray(research)
    ? research.filter((item) => item !== null && item !== undefined)
    : [];

  if (safeResearch.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-8">
        <View className="bg-gray-100 rounded-full p-4 mb-4">
          <Ionicons name="flask-outline" size={32} color="#9CA3AF" />
        </View>
        <Text className="text-gray-600 font-medium text-base text-center">
          No Research Available
        </Text>
        <Text className="text-gray-400 text-sm text-center mt-2 leading-5">
          Supporting studies for this plant have not been added yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Count header */}
      <View className="flex-row items-center mb-4">
        <Text className="text-gray-500 text-xs font-medium">
          {safeResearch.length}{" "}
          {safeResearch.length === 1 ? "study" : "studies"} found
        </Text>
      </View>

      {safeResearch.map((item, index) => (
        <ResearchCard key={`research-${index}`} item={item} index={index} />
      ))}

      {/* Footer note */}
      <View className="flex-row items-start mt-2 px-1">
        <Ionicons
          name="information-circle-outline"
          size={14}
          color="#9CA3AF"
          style={{ marginTop: 1, marginRight: 6 }}
        />
        <Text className="text-gray-400 text-xs leading-4 flex-1">
          Research summaries are for informational purposes only. Consult a
          qualified healthcare professional before use.
        </Text>
      </View>
    </ScrollView>
  );
}
