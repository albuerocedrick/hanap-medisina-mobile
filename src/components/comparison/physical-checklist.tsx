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
import { Text, View } from "react-native";
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
      className={[
        "flex-row items-stretch",
        isHighlighted ? "bg-green-50" : "bg-white",
        !isLast ? "border-b border-gray-100" : "",
      ].join(" ")}
    >
      {/* ── Col 1: Trait label ──────────────────────────────────────────── */}
      {/*
       * Fixed width matches the header corner cell exactly.
       * The "Same" badge lives here — under the label — so neither
       * value column is ever disturbed by badge layout.
       */}
      <View
        style={{ width: TRAIT_COL_WIDTH }}
        className="py-3 px-3 justify-center border-r border-gray-100"
      >
        <View className="flex-row items-center">
          <Ionicons
            name={traitIcon}
            size={12}
            color="#6B7280"
            style={{ marginRight: 5, flexShrink: 0 }}
          />
          <Text
            className="text-gray-500 text-xs font-semibold uppercase tracking-wide flex-shrink"
            numberOfLines={1}
          >
            {traitLabel}
          </Text>
        </View>

        {areSame && (
          <View className="mt-1 flex-row items-center">
            <Ionicons name="checkmark-circle" size={10} color="#15803d" />
            <Text className="text-green-700 text-xs ml-0.5 font-medium">
              Same
            </Text>
          </View>
        )}
      </View>

      {/* ── Col 2: Plant A value ────────────────────────────────────────── */}
      <View className="flex-1 py-3 px-3 justify-center border-r border-gray-100">
        <Text
          className={[
            "text-sm leading-5",
            missingA ? "text-gray-300 italic" : "text-gray-800",
          ].join(" ")}
        >
          {safeA}
        </Text>
      </View>

      {/* ── Col 3: Plant B value ────────────────────────────────────────── */}
      <View className="flex-1 py-3 px-3 justify-center">
        <Text
          className={[
            "text-sm leading-5",
            missingB ? "text-gray-300 italic" : "text-gray-800",
          ].join(" ")}
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
  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!traitsA && !traitsB) {
    return (
      <View className="bg-gray-50 rounded-2xl px-4 py-8 items-center">
        <Ionicons name="clipboard-outline" size={28} color="#D1D5DB" />
        <Text className="text-gray-400 text-sm text-center mt-2">
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

  // Pre-filter so isLast is accurate — only rows that will actually render
  const visibleTraits = TRAIT_ORDER.filter(
    (key) => safeTraitsA[key]?.trim() || safeTraitsB[key]?.trim(),
  );

  return (
    <View className="rounded-2xl overflow-hidden border border-gray-200">
      {/* ── Header row ────────────────────────────────────────────────────── */}
      {/*
       * Mirrors the EXACT same 3-column structure as PhysicalChecklistRow.
       * TRAIT_COL_WIDTH is the shared constant — updating it once adjusts both.
       */}
      <View
        className="flex-row items-stretch bg-green-700"
        style={{ minHeight: 44 }}
      >
        {/* Col 1 corner: icon only */}
        <View
          style={{ width: TRAIT_COL_WIDTH }}
          className="items-center justify-center border-r border-green-600 px-3"
        >
          <Ionicons
            name="git-compare-outline"
            size={16}
            color="rgba(255,255,255,0.65)"
          />
        </View>

        {/* Col 2: Plant A name */}
        <View className="flex-1 items-center justify-center border-r border-green-600 px-3 py-2">
          <Text
            className="text-white text-xs font-bold text-center"
            numberOfLines={2}
          >
            {plantNameA?.trim() || "Plant A"}
          </Text>
        </View>

        {/* Col 3: Plant B name */}
        <View className="flex-1 items-center justify-center px-3 py-2">
          <Text
            className="text-white text-xs font-bold text-center"
            numberOfLines={2}
          >
            {plantNameB?.trim() || "Plant B"}
          </Text>
        </View>
      </View>

      {/* ── Data rows ─────────────────────────────────────────────────────── */}
      {visibleTraits.length === 0 ? (
        <View className="bg-white px-4 py-6 items-center">
          <Text className="text-gray-400 text-sm italic">
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
