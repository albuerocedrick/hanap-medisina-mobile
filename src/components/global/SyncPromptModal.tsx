import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSyncStore } from "../../store/useSyncStore";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * SyncPromptModal
 *
 * A lightweight, non-blocking prompt that appears when the user comes
 * back online with pending offline scans. Tapping "Sync Now" kicks off
 * the background upload via useSyncStore.runSync() and immediately closes
 * the modal. Progress is then tracked by SyncStatusBanner.
 */
export default function SyncPromptModal({ visible, onDismiss }: Props) {
  const pendingCount = useSyncStore(
    (s) => s.syncQueue.filter((i) => i.retryCount < 3).length
  );
  const runSync = useSyncStore((s) => s.runSync);
  const isRunningSync = useSyncStore((s) => s.isRunningSync);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // If there's nothing to sync or sync already running, don't show
  if (!visible || pendingCount === 0 || isRunningSync) return null;

  const handleSyncNow = () => {
    onDismiss(); // Close the modal immediately — user is free to explore the app
    runSync();   // Background sync starts; SyncStatusBanner will show progress
  };

  const bg = isDark ? "#0B120B" : "#FAFEEF";
  const cardBg = isDark ? "#111C11" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(34,69,28,0.1)";
  const titleColor = isDark ? "#F8FAFC" : "#22451C";
  const bodyColor = isDark ? "rgba(248,250,252,0.6)" : "rgba(34,69,28,0.6)";

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: border,
              shadowColor: isDark ? "#000" : "#22451C",
            },
          ]}
        >
          {/* Icon badge */}
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: isDark ? "rgba(34,69,28,0.3)" : "rgba(34,69,28,0.08)" },
            ]}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={32}
              color={isDark ? "#A2CFA3" : "#22451C"}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: titleColor }]}>
            You're Back Online!
          </Text>

          {/* Description */}
          <Text style={[styles.body, { color: bodyColor }]}>
            You have{" "}
            <Text style={{ fontFamily: "Quicksand_700Bold", color: titleColor }}>
              {pendingCount}
            </Text>{" "}
            offline {pendingCount === 1 ? "scan" : "scans"} waiting to be
            backed up to your account.
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: border }]} />

          {/* Actions */}
          <TouchableOpacity
            onPress={handleSyncNow}
            style={[
              styles.primaryBtn,
              { backgroundColor: isDark ? "#A2CFA3" : "#22451C" },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={16}
              color={isDark ? "#0B120B" : "#FAFEEF"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.primaryBtnText,
                { color: isDark ? "#0B120B" : "#FAFEEF" },
              ]}
            >
              Sync Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDismiss}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(34,69,28,0.04)",
                borderColor: border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryBtnText, { color: bodyColor }]}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    width: "100%",
    borderRadius: 32,
    padding: 28,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "serif",
    fontStyle: "italic",
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  body: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 24,
  },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtnText: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 14,
  },
});
