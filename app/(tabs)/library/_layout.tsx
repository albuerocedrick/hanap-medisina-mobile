/**
 * app/(tabs)/library/_layout.tsx
 *
 * Stack navigator for the Library tab group.
 *
 * ── Architecture note on sub-tabs ────────────────────────────────────────────
 * The "Details / Research / Compare" sub-tabs inside the plant detail screen
 * are NOT a nested navigator here. They are rendered as a custom tab bar
 * component INSIDE [id].tsx, positioned below the plant hero image and name.
 *
 * Why not a nested Tab.Navigator?
 *  - A nested Tab.Navigator would replace or conflict with the bottom tab bar.
 *  - We want the sub-tabs to scroll INTO the screen (below the plant header),
 *    not sit fixed at the top of the device as a second nav bar.
 *  - A custom tab strip inside [id].tsx gives us full control over placement,
 *    animation, and the ability to put it below the plant image.
 *
 * Stack screens managed here:
 *  - index       → Main Library feed (search + filter + plant list)
 *  - [id]        → Plant detail with custom Details/Research/Compare sub-tabs
 *  - comparison  → 1v1 Plant Comparison engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity, View } from "react-native";

// ─────────────────────────────────────────────
// SHARED HEADER CONFIG
// ─────────────────────────────────────────────

/** Tint applied to the back arrow and any header action icons. */
const HEADER_TINT = "#ffffff";

/** Consistent header background across all library screens. */
const HEADER_BG = "#15803d"; // green-700

// ─────────────────────────────────────────────
// CUSTOM BACK BUTTON
// Rendered on [id] and comparison screens so we have consistent styling
// and a reliable fallback (router.back) that works with Expo Router.
// ─────────────────────────────────────────────

function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback: if the stack is somehow empty, go to the library index
        router.replace("/library");
      }
    } catch (err) {
      console.error("[LibraryLayout] BackButton navigation failed:", err);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleBack}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 16 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={{ paddingLeft: Platform.OS === "ios" ? 4 : 0 }}
    >
      <Ionicons
        name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
        size={24}
        color={HEADER_TINT}
      />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        // ── Shared visual defaults ────────────────────────────────────────
        headerStyle: { backgroundColor: HEADER_BG },
        headerTintColor: HEADER_TINT,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: HEADER_TINT,
        },
        headerShadowVisible: false,
        // Remove the default back title on iOS (shows "Back" by default)
        headerBackTitle: "",
        // Consistent cross-platform animation
        animation: Platform.OS === "ios" ? "default" : "slide_from_right",
        // Critical: this stack renders INSIDE the bottom tab bar, so the
        // bottom tab bar is never affected by these screen transitions.
        headerLeft: () => <BackButton />,
      }}
    >
      {/* ── Library Index ─────────────────────────────────────────────────── */}
      <Stack.Screen
        name="index"
        options={{
          title: "Plant Library",
          // Index screen: no back button (it IS the root of this stack)
          headerLeft: () => null,
          headerRight: () => (
            <View style={{ paddingRight: 4 }}>
              <Ionicons name="leaf" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          ),
        }}
      />

      {/* ── Plant Detail ([id]) ────────────────────────────────────────────── */}
      {/*
       * Title is intentionally left empty here — [id].tsx sets it dynamically
       * via `navigation.setOptions({ title: plant.name })` once the plant
       * data loads. This prevents a flash of "undefined" or a static string.
       */}
      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerLeft: () => <BackButton />,
          // Allow the header to overlap the hero image on iOS for a
          // more immersive plant detail layout.
          headerTransparent: Platform.OS === "ios",
          headerBlurEffect: Platform.OS === "ios" ? "dark" : undefined,
          // On Android, keep the solid header since blur isn't available
          headerStyle:
            Platform.OS === "android"
              ? { backgroundColor: HEADER_BG }
              : undefined,
        }}
      />

      {/* ── 1v1 Comparison ────────────────────────────────────────────────── */}
      <Stack.Screen
        name="comparison"
        options={{
          title: "Compare Plants",
          headerLeft: () => <BackButton />,
          // Slides up as a modal on iOS to signal a "focused task" UX
          presentation: Platform.OS === "ios" ? "modal" : "card",
          // On iOS modal, override the header bg since modal sheets have
          // their own surface — keep it consistent with the rest
          headerStyle: { backgroundColor: HEADER_BG },
        }}
      />
    </Stack>
  );
}
