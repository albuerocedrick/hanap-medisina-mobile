import { useCallback, useEffect, useState } from "react";
import { useNetworkStore } from "../store/useNetworkStore";
import { useSyncStore } from "../store/useSyncStore";

/**
 * useNetworkSync
 *
 * Custom hook that bridges the network monitor and the sync queue.
 *
 * How it works:
 * 1. On mount, it registers a reconnect callback with useNetworkStore.
 * 2. When the device transitions from offline → online, the callback fires.
 * 3. The callback checks if useSyncStore has pending scans in the queue.
 * 4. If there are pending scans, it sets `showSyncPrompt = true`.
 * 5. The SyncPromptModal (Step 9) reads this flag and shows itself.
 *
 * This hook should be called ONCE in the root layout (_layout.tsx).
 */
export function useNetworkSync() {
  // Controls whether the sync prompt modal is visible
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  // Get the callback registration function from the network store
  const setReconnectCallback = useNetworkStore(
    (s) => s.setReconnectCallback
  );

  // The function that runs when the device comes back online
  const handleReconnect = useCallback(() => {
    try {
      // Check if there are any pending scans waiting to be uploaded
      const { syncQueue } = useSyncStore.getState();

      // Only items that aren't currently syncing and haven't exceeded max retries
      const pendingItems = syncQueue.filter(
        (item) => !item.isSyncing && item.retryCount < 3
      );

      if (pendingItems.length > 0) {
        console.log(
          `[useNetworkSync] Back online with ${pendingItems.length} pending scan(s). Showing sync prompt.`
        );
        setShowSyncPrompt(true);
      }
    } catch (err) {
      console.error("[useNetworkSync] Error in reconnect handler:", err);
    }
  }, []);

  // Register the reconnect callback when this hook mounts,
  // and clean it up when it unmounts (prevents stale references).
  useEffect(() => {
    setReconnectCallback(handleReconnect);

    // Also check on mount — the user might have opened the app
    // while already online with a queue from a previous session.
    // We use an async NetInfo.fetch() here because useNetworkStore's
    // initial synchronous state is optimistically set to 'online'.
    import("@react-native-community/netinfo").then(({ default: NetInfo }) => {
      NetInfo.fetch().then((state) => {
        const isOnline = state.isInternetReachable ?? state.isConnected ?? false;
        if (!isOnline) return;

        const { syncQueue } = useSyncStore.getState();
        const pendingItems = syncQueue.filter(
          (item) => !item.isSyncing && item.retryCount < 3
        );

        if (pendingItems.length > 0) {
          console.log(
            `[useNetworkSync] App started online with ${pendingItems.length} pending scan(s). Showing sync prompt.`
          );
          setShowSyncPrompt(true);
        }
      });
    });

    // Cleanup: remove the callback when the component unmounts
    return () => {
      setReconnectCallback(null);
    };
  }, [setReconnectCallback, handleReconnect]);

  // Allows the SyncPromptModal to dismiss itself after syncing
  const dismissSyncPrompt = useCallback(() => {
    setShowSyncPrompt(false);
  }, []);

  return {
    showSyncPrompt,
    dismissSyncPrompt,
  };
}
