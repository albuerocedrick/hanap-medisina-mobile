import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
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

  // If there's nothing to sync or sync already running, don't show
  if (!visible || pendingCount === 0 || isRunningSync) return null;

  const handleSyncNow = () => {
    onDismiss(); // Close the modal immediately — user is free to explore the app
    runSync();   // Background sync starts; SyncStatusBanner will show progress
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center p-4">
        <View className="bg-white rounded-3xl w-full max-w-sm p-8 items-center shadow-2xl">
          {/* Icon */}
          <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
            <Text className="text-4xl">☁️</Text>
          </View>

          {/* Title */}
          <Text className="text-2xl font-black text-gray-900 mb-3 text-center tracking-tight">
            You're Back Online!
          </Text>

          {/* Description */}
          <Text className="text-gray-500 text-center mb-8 text-base leading-relaxed px-2">
            You have{" "}
            <Text className="font-bold text-gray-800">{pendingCount}</Text>{" "}
            offline {pendingCount === 1 ? "scan" : "scans"} waiting to be
            backed up to your account.
          </Text>

          {/* Actions */}
          <View className="w-full">
            <TouchableOpacity
              onPress={handleSyncNow}
              className="w-full bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-600/30 mb-3 active:scale-95"
            >
              <Text className="text-white font-bold text-lg tracking-wide">
                Sync Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDismiss}
              className="w-full py-4 rounded-2xl items-center bg-gray-100 active:bg-gray-200"
            >
              <Text className="text-gray-500 font-bold text-lg">
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
