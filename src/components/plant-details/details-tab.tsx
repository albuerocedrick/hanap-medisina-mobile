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
  return (
    <View className="flex-row items-center mb-3 mt-5">
      <View className="bg-green-100 rounded-lg p-1.5 mr-2">
        <Ionicons name={icon} size={16} color="#15803d" />
      </View>
      <Text className="text-gray-800 font-semibold text-sm tracking-wide uppercase">
        {title}
      </Text>
    </View>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <View className="bg-gray-50 rounded-xl px-4 py-3">
      <Text className="text-gray-400 text-sm italic">{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function DetailsTab({ localName, details }: DetailsTabProps) {
  // ── Guard: graceful degradation if details is undefined/null ─────────────
  if (!details) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Ionicons name="leaf-outline" size={40} color="#D1D5DB" />
        <Text className="text-gray-400 text-sm mt-3">
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
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Local Name ─────────────────────────────────────────────────────── */}
      {!!localName?.trim() && (
        <View className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-2">
          <Text className="text-green-600 text-xs font-medium uppercase tracking-wider mb-0.5">
            Local Name
          </Text>
          <Text className="text-green-900 text-lg font-semibold">
            {localName}
          </Text>
        </View>
      )}

      {/* ── Preparation ────────────────────────────────────────────────────── */}
      <SectionHeader icon="flask-outline" title="Preparation" />
      {preparation.length > 0 ? (
        <View className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {preparation.map((step, index) => {
            const isLast = index === preparation.length - 1;
            return (
              <View
                key={index}
                className={`flex-row px-4 py-3 ${!isLast ? "border-b border-gray-50" : ""}`}
              >
                {/* Step number bubble */}
                <View className="w-6 h-6 rounded-full bg-green-700 items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Text className="text-white text-xs font-bold">
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-gray-700 text-sm leading-5">
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
        <View className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {factsEntries.map(([key, value], index) => {
            const isLast = index === factsEntries.length - 1;
            return (
              <View
                key={key}
                className={`
                  flex-row px-4 py-3 items-start
                  ${!isLast ? "border-b border-gray-50" : ""}
                `}
              >
                <Text className="text-gray-500 text-xs font-medium w-28 flex-shrink-0 pt-0.5">
                  {key}
                </Text>
                <Text className="flex-1 text-gray-800 text-sm font-medium">
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
        <View className="space-y-2">
          {warnings.map((warning, index) => (
            <View
              key={index}
              className="flex-row bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 items-start mb-2"
            >
              <Ionicons
                name="alert-circle"
                size={16}
                color="#d97706"
                style={{ marginTop: 1, marginRight: 10, flexShrink: 0 }}
              />
              <Text className="flex-1 text-amber-800 text-sm leading-5">
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
