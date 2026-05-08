/**
 * components/comparison/PhysicalChecklist.tsx
 *
 * Renders the "Physical Checklist" comparison table for the 1v1 plant
 * comparison page. Exported as two pieces:
 *
 *  - `PhysicalChecklistRow`   — a single trait row (leaf, flower, etc.)
 *  - `PhysicalChecklistTable` — the complete table, mapping all ComparisonTraits
 *
 * ── Alignment fix ────────────────────────────────────────────────────────────
 * Every row — header included — uses the SAME three-column structure:
 *
 *   [ TRAIT col (w-24 / 96px) ] [ PLANT A col (flex-1) ] [ PLANT B col (flex-1) ]
 *
 * This guarantees pixel-perfect vertical alignment between the header names
 * and every data cell below them, regardless of content length.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { ComparisonTraits } from "../../services/firebaseLibrary";

// ─────────────────────────────────────────────
// CONSTANTS
// Width of the left trait-label column. Must be identical in the header
// and in every data row — change it in ONE place here.
// ─────────────────────────────────────────────

const TRAIT_COL_WIDTH = 96; // px  ≈ w-24

/** Map from ComparisonTraits key → human-readable label + icon. */
const TRAIT_META: Record<
  keyof ComparisonTraits,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  leaf: { label: "Leaf", icon: "leaf-outline" },
  flower: { label: "Flower", icon: "color-palette-outline" },
  stem: { label: "Stem", icon: "git-branch-outline" },
  smell: { label: "Smell", icon: "cloud-outline" },
};

const TRAIT_ORDER: (keyof ComparisonTraits)[] = [
  "leaf",
  "flower",
  "stem",
  "smell",
];

// ─────────────────────────────────────────────
// ROW PROPS
// ─────────────────────────────────────────────

interface PhysicalChecklistRowProps {
  traitLabel: string;
  traitIcon: keyof typeof Ionicons.glyphMap;
  valueA: string;
  valueB: string;
  isHighlighted?: boolean;
  isLast?: boolean;
}

// ─────────────────────────────────────────────
// ROW COMPONENT
// ─────────────────────────────────────────────

export function PhysicalChecklistRow({
  traitLabel,
  traitIcon,
  valueA,
  valueB,
  isHighlighted = false,
  isLast = false,
}: PhysicalChecklistRowProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const safeA = valueA?.trim() || "—";
  const safeB = valueB?.trim() || "—";

  const areSame =
    safeA !== "—" &&
    safeB !== "—" &&
    safeA.toLowerCase() === safeB.toLowerCase();

  const missingA = safeA === "—";
  const missingB = safeB === "—";

  return (
    <View
      style={{
        flexDirection: "row", alignItems: "stretch",
        backgroundColor: isHighlighted ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(34,69,28,0.03)") : "transparent",
        borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.05)"
      }}
    >
      <View
        style={{ width: TRAIT_COL_WIDTH, borderRightWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.05)" }}
        className="py-3 px-3 justify-center"
      >
        <View className="flex-row items-center">
          <Ionicons
            name={traitIcon}
            size={12}
            color={isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)"}
            style={{ marginRight: 5, flexShrink: 0 }}
          />
          <Text
            style={{ fontFamily: "Quicksand_700Bold", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 1 }}
            numberOfLines={1}
          >
            {traitLabel}
          </Text>
        </View>

        {areSame && (
          <View className="mt-1 flex-row items-center">
            <Ionicons name="checkmark-circle" size={10} color={isDark ? "#A2CFA3" : "#4D8035"} />
            <Text style={{ fontFamily: "Quicksand_600SemiBold", color: isDark ? "#A2CFA3" : "#4D8035", fontSize: 10, marginLeft: 2 }}>
              Same
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(34,69,28,0.05)" }} className="py-3 px-3 justify-center">
        <Text
          style={{
            fontFamily: "Quicksand_500Medium", fontSize: 14, lineHeight: 20,
            color: missingA ? (isDark ? "rgba(248,250,252,0.3)" : "rgba(34,69,28,0.3)") : (isDark ? "#F8FAFC" : "#22451C"),
            fontStyle: missingA ? "italic" : "normal"
          }}
        >
          {safeA}
        </Text>
      </View>

      <View style={{ flex: 1 }} className="py-3 px-3 justify-center">
        <Text
          style={{
            fontFamily: "Quicksand_500Medium", fontSize: 14, lineHeight: 20,
            color: missingB ? (isDark ? "rgba(248,250,252,0.3)" : "rgba(34,69,28,0.3)") : (isDark ? "#F8FAFC" : "#22451C"),
            fontStyle: missingB ? "italic" : "normal"
          }}
        >
          {safeB}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// TABLE PROPS
// ─────────────────────────────────────────────

interface PhysicalChecklistTableProps {
  traitsA: ComparisonTraits | null | undefined;
  traitsB: ComparisonTraits | null | undefined;
  plantNameA: string;
  plantNameB: string;
}

// ─────────────────────────────────────────────
// TABLE COMPONENT
// ─────────────────────────────────────────────

export function PhysicalChecklistTable({
  traitsA,
  traitsB,
  plantNameA,
  plantNameB,
}: PhysicalChecklistTableProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!traitsA && !traitsB) {
    return (
      <View style={{ backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(34,69,28,0.02)", borderRadius: 16, padding: 32, alignItems: "center" }}>
        <Ionicons name="clipboard-outline" size={28} color={isDark ? "rgba(248,250,252,0.3)" : "rgba(34,69,28,0.3)"} />
        <Text style={{ fontFamily: "Quicksand_500Medium", color: isDark ? "rgba(248,250,252,0.5)" : "rgba(34,69,28,0.5)", fontSize: 14, textAlign: "center", marginTop: 8 }}>
          Comparison traits are not available for these plants.
        </Text>
      </View>
    );
  }

  const safeTraitsA: ComparisonTraits = traitsA ?? {
    leaf: "",
    flower: "",
    stem: "",
    smell: "",
  };
  const safeTraitsB: ComparisonTraits = traitsB ?? {
    leaf: "",
    flower: "",
    stem: "",
    smell: "",
  };

  const visibleTraits = TRAIT_ORDER.filter(
    (key) => safeTraitsA[key]?.trim() || safeTraitsB[key]?.trim(),
  );

  return (
    <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)" }}>
      {/* ── Header row ────────────────────────────────────────────────────── */}
      <View
        style={{ flexDirection: "row", alignItems: "stretch", backgroundColor: isDark ? "rgba(162,207,163,0.1)" : "rgba(77,128,53,0.1)", minHeight: 44 }}
      >
        <View
          style={{ width: TRAIT_COL_WIDTH, borderRightWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)" }}
          className="items-center justify-center px-3"
        >
          <Ionicons
            name="git-compare-outline"
            size={16}
            color={isDark ? "rgba(248,250,252,0.7)" : "#22451C"}
          />
        </View>

        <View style={{ flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(34,69,28,0.1)" }} className="items-center justify-center px-3 py-2">
          <Text
            style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 13, fontWeight: "600", color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}
            numberOfLines={2}
          >
            {plantNameA?.trim() || "Plant A"}
          </Text>
        </View>

        <View style={{ flex: 1 }} className="items-center justify-center px-3 py-2">
          <Text
            style={{ fontFamily: "serif", fontStyle: "italic", fontSize: 13, fontWeight: "600", color: isDark ? "#F8FAFC" : "#22451C", textAlign: "center" }}
            numberOfLines={2}
          >
            {plantNameB?.trim() || "Plant B"}
          </Text>
        </View>
      </View>

      {/* ── Data rows ─────────────────────────────────────────────────────── */}
      {visibleTraits.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: "center", backgroundColor: isDark ? "#0B120B" : "#FAFEEF" }}>
          <Text style={{ fontFamily: "Quicksand_500Medium", fontStyle: "italic", color: isDark ? "rgba(248,250,252,0.4)" : "rgba(34,69,28,0.4)", fontSize: 14 }}>
            No trait data available.
          </Text>
        </View>
      ) : (
        visibleTraits.map((traitKey, index) => {
          const meta = TRAIT_META[traitKey];
          const valueA = safeTraitsA[traitKey];
          const valueB = safeTraitsB[traitKey];
          const isLast = index === visibleTraits.length - 1;

          return (
            <PhysicalChecklistRow
              key={traitKey}
              traitLabel={meta.label}
              traitIcon={meta.icon}
              valueA={valueA}
              valueB={valueB}
              isHighlighted={index % 2 === 0}
              isLast={isLast}
            />
          );
        })
      )}
    </View>
  );
}
