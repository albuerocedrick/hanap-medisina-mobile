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

import { useColorScheme } from "nativewind";
import { StyleSheet } from "react-native";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

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
    <View style={{ backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(162,207,163,0.4)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      {/* Card header */}
      <View style={{ backgroundColor: isDark ? "rgba(162,207,163,0.08)" : "rgba(162,207,163,0.15)", paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.2)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.05)", borderRadius: 8, padding: 6, marginRight: 8 }}>
            <Ionicons name="document-text-outline" size={14} color={isDark ? "#A2CFA3" : "#22451C"} />
          </View>
          <Text
            style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 13, flex: 1, lineHeight: 18 }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        {year !== null && (
          <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(34,69,28,0.08)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 }}>
            <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "#A2CFA3" : "#22451C", fontSize: 11 }}>{year}</Text>
          </View>
        )}
      </View>

      {/* Summary */}
      {summary ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.8)" : "#334155", fontSize: 13, lineHeight: 20 }}>{summary}</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.4)", fontSize: 13, fontStyle: "italic" }}>
            No summary available.
          </Text>
        </View>
      )}

      {/* Reference */}
      {reference && (
        <View style={{ flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
          <Ionicons
            name="library-outline"
            size={13}
            color={isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)"}
            style={{ marginRight: 6, marginTop: 1 }}
          />
          <Text
            style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 11, fontStyle: "italic", flex: 1 }}
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Guard ─────────────────────────────────────────────────────────────────
  const safeResearch = Array.isArray(research)
    ? research.filter((item) => item !== null && item !== undefined)
    : [];

  if (safeResearch.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, paddingHorizontal: 32 }}>
        <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(34,69,28,0.03)", borderRadius: 32, padding: 16, marginBottom: 16 }}>
          <Ionicons name="flask-outline" size={32} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.3)"} />
        </View>
        <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.7)" : "#22451C", fontSize: 16, textAlign: "center", marginBottom: 8 }}>
          No Research Available
        </Text>
        <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.6)", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
          Supporting studies for this plant have not been added yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Count header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, paddingLeft: 4 }}>
        <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {safeResearch.length}{" "}
          {safeResearch.length === 1 ? "study" : "studies"} found
        </Text>
      </View>

      {safeResearch.map((item, index) => (
        <ResearchCard key={`research-${index}`} item={item} index={index} />
      ))}

      {/* Footer note */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, paddingHorizontal: 4 }}>
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={isDark ? "rgba(248,250,252,0.3)" : "rgba(34,69,28,0.4)"}
          style={{ marginRight: 6 }}
        />
        <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)", fontSize: 11, lineHeight: 16 }}>
          Research summaries are for informational purposes only. Consult a
          qualified healthcare professional before use.
        </Text>
      </View>
    </ScrollView>
  );
}
