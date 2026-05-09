/**
 * components/plant-details/DetailsTab.tsx
 *
 * Renders the "Details" sub-tab of the plant detail screen.
 * Maps all three data structures from PlantDetails:
 *  - `preparation` → numbered step list
 *  - `facts`       → key-value identification grid
 *  - `warnings`    → amber warning badges
 *
 * Every section has a dedicated empty state so a partially-populated
 * Firestore document never causes a blank or crashed screen.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { PlantDetails } from "../../services/firebaseLibrary";

import { useColorScheme } from "nativewind";
import { StyleSheet } from "react-native";

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface DetailsTabProps {
  localName: string;
  details: PlantDetails;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
      <View style={{ backgroundColor: isDark ? "rgba(162,207,163,0.15)" : "rgba(162,207,163,0.2)", borderRadius: 8, padding: 6, marginRight: 8 }}>
        <Ionicons name={icon} size={16} color={isDark ? "#A2CFA3" : "#22451C"} />
      </View>
      <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Text>
    </View>
  );
}

function EmptySection({ message }: { message: string }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(34,69,28,0.03)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 13, fontStyle: "italic" }}>
        {message}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function DetailsTab({ localName, details }: DetailsTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Guard: graceful degradation if details is undefined/null ─────────────
  if (!details) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
        <Ionicons name="leaf-outline" size={40} color={isDark ? "rgba(255,255,255,0.2)" : "rgba(34,69,28,0.2)"} />
        <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 14, marginTop: 12 }}>
          No details available for this plant.
        </Text>
      </View>
    );
  }

  const preparation = Array.isArray(details.preparation)
    ? details.preparation.filter(Boolean)
    : [];

  const factsEntries =
    details.facts && typeof details.facts === "object"
      ? Object.entries(details.facts).filter(([k, v]) => k && v)
      : [];

  const warnings = Array.isArray(details.warnings)
    ? details.warnings.filter(Boolean)
    : [];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Local Name ─────────────────────────────────────────────────────── */}
      {!!localName?.trim() && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }}>
          <Ionicons name="pricetag-outline" size={13} color={isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.5)"} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 13, marginRight: 6 }}>
            Known locally as
          </Text>
          <Text style={{ fontFamily: "serif", fontStyle: "italic", fontWeight: "500", color: isDark ? "#F8FAFC" : "#22451C", fontSize: 15, marginTop: -2 }}>
            {localName}
          </Text>
        </View>
      )}

      {/* ── Preparation ────────────────────────────────────────────────────── */}
      <SectionHeader icon="flask-outline" title="Preparation" />
      {preparation.length > 0 ? (
        <View style={{ backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)", borderRadius: 16, overflow: "hidden" }}>
          {preparation.map((step, index) => {
            const isLast = index === preparation.length - 1;
            return (
              <View
                key={index}
                style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0, borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.2)" }}
              >
                {/* Step number bubble */}
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(162,207,163,0.4)" : "rgba(162,207,163,0.8)", backgroundColor: isDark ? "rgba(162,207,163,0.1)" : "rgba(162,207,163,0.15)", alignItems: "center", justifyContent: "center", marginRight: 12, marginTop: 1 }}>
                  <Text style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "#A2CFA3" : "#22451C", fontSize: 10, includeFontPadding: false, textAlignVertical: "center" }}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.85)" : "#334155", fontSize: 14, lineHeight: 22 }}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptySection message="No preparation steps available." />
      )}

      {/* ── Identification Facts ────────────────────────────────────────────── */}
      <SectionHeader icon="eye-outline" title="Identification" />
      {factsEntries.length > 0 ? (
        <View style={{ backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(162,207,163,0.4)", borderRadius: 16, overflow: "hidden" }}>
          {factsEntries.map(([key, value], index) => {
            const isLast = index === factsEntries.length - 1;
            return (
              <View
                key={key}
                style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "flex-start", borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0, borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(162,207,163,0.2)" }}
              >
                <Text style={{ width: 110, fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.6)", fontSize: 13, marginTop: 2 }}>
                  {key}
                </Text>
                <Text style={{ flex: 1, fontFamily: "Quicksand_600SemiBold", color: isDark ? "rgba(248,250,252,0.9)" : "#22451C", fontSize: 14, lineHeight: 20 }}>
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptySection message="No identification facts available." />
      )}

      {/* ── Warnings ───────────────────────────────────────────────────────── */}
      <SectionHeader icon="warning-outline" title="Warnings & Precautions" />
      {warnings.length > 0 ? (
        <View style={{ gap: 8 }}>
          {warnings.map((warning, index) => (
            <View
              key={index}
              style={{ flexDirection: "row", backgroundColor: isDark ? "rgba(217,119,6,0.08)" : "#FFFBEB", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(217,119,6,0.2)" : "#FDE68A", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, alignItems: "flex-start" }}
            >
              <Ionicons
                name="alert-circle"
                size={16}
                color={isDark ? "#FBBF24" : "#D97706"}
                style={{ marginTop: 2, marginRight: 10 }}
              />
              <Text style={{ flex: 1, fontFamily: "Quicksand_500Medium", color: isDark ? "#FDE68A" : "#B45309", fontSize: 14, lineHeight: 20 }}>
                {warning}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptySection message="No warnings listed for this plant." />
      )}
    </ScrollView>
  );
}
